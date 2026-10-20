/**
 * The outcome workflow: one durable run per generation or test.
 *
 *   code "before" → Taste (read, match, brief) → code "after-taste"
 *     → each generated section, in page order → Finish → code "finish"
 *
 * Every piece is a `step.do`, so it's retried on its own and never
 * repeated once done, even if the Worker restarts mid-run. Each step tells
 * the run's room (room.server.ts) what it's doing, and the room streams
 * that to the page. A section that fails is marked and skipped; the rest
 * of the page still arrives. Anything else failing fails the run.
 *
 * Code inside `step.do` runs once; code outside it runs again on every
 * replay, so it only reads step results and never writes.
 */
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";

import { outcomeModel } from "../ai.server";
import { getCatalogue } from "../catalogue/registry";
import type { Answers } from "../catalogue/define";
import type { StepResult } from "../catalogue/workflow";
import type { TasteBrief } from "../outcome/brief";
import { defaultCity } from "../outcome/lookups";
import { FINISH, TASTE, codeSteps, generatedBlocks, sectionLabel } from "../outcome/plan";
import type { RunEvent, StepState, TasteEntity } from "../outcome/state";
import { type OutcomeParams, loadRunContext, profileText, skillsFor } from "./context.server";
import { type EarlierSection, candidatesFor, summarize, writeSection } from "./generate.server";
import { saveRunResult } from "./results.server";
import { roomFor } from "./room.server";
import { type TasteBase, matchTaste, qlooTools, readTaste, writeBrief } from "./taste.server";

const SECTION = { retries: { limit: 1, delay: "3 seconds" }, timeout: "5 minutes" } as const;
const QUICK = { retries: { limit: 2, delay: "2 seconds", backoff: "exponential" }, timeout: "2 minutes" } as const;

/** How often a streaming section is sent to the page. */
const PARTIAL_MS = 120;

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

export class OutcomeWorkflow extends WorkflowEntrypoint<Env, OutcomeParams> {
  async run(event: Readonly<WorkflowEvent<OutcomeParams>>, step: WorkflowStep) {
    const params = event.payload as OutcomeParams;
    const { config } = params;
    const room = roomFor(params.workspaceId, params.runId);
    const emit = (events: RunEvent[], persist = true) => room.apply(events, { persist });
    const patch = (id: string, change: Partial<Omit<StepState, "id" | "kind">>): RunEvent => ({ type: "step", id, patch: change });
    const start = (id: string, text: string | null = null) =>
      emit([patch(id, { status: "running", startedAt: Date.now(), message: text, error: null })]);
    const report = (id: string) => (text: string) => emit([patch(id, { message: text })], false);

    try {
      const catalogue = getCatalogue(config.catalogue);
      if (!catalogue) throw new Error(`The catalogue "${config.catalogue}" is missing.`);
      const context = await step.do("context", QUICK, () => loadRunContext(params));
      const outputs: Record<string, unknown> = {};
      /** The person's answers, plus any a "before" step filled in where theirs are empty. */
      const answers = { ...params.answers };
      /** What `ctx.qloo` ranks by: the brief's favourites once Taste has run. */
      const tasteBase = (brief: TasteBrief | null): TasteBase => ({
        signals: brief?.signals ?? [],
        ages: context.segment?.ages ?? [],
        gender: context.segment && context.segment.gender !== "any" ? context.segment.gender : null,
        location: brief?.location ?? (defaultCity(config.workflow.lookups) || null),
      });

      /** One code step, at any point. Its failure is shown on it, never the run's. */
      const runCode = async (
        { block, definition }: ReturnType<typeof codeSteps>[number],
        state: { brief: TasteBrief | null; sections: Record<string, unknown> },
      ) => {
        try {
          const result = await step.do(`code:${block.id}`, QUICK, async () => {
            await start(block.id);
            const result: StepResult = await definition.run(block.props, {
              env: this.env,
              workspaceId: params.workspaceId,
              runId: params.runId,
              test: params.test,
              person: { name: params.person.name, email: params.person.email },
              answers,
              profile: params.profile,
              prompt: config.workflow.prompt,
              config,
              location: state.brief?.location ?? (defaultCity(config.workflow.lookups) || null),
              brief: state.brief,
              sections: state.sections,
              steps: outputs,
              outcomeUrl: params.outcomeUrl,
              report: report(block.id),
              qloo: qlooTools(tasteBase(state.brief)),
              model: outcomeModel(),
            });
            // As text: any JSON the step returns survives the step's storage as it was.
            const saved = JSON.stringify({
              output: result.output ?? null,
              notes: result.notes ?? [],
              candidates: definition.provides ? (result.candidates ?? []) : [],
              answers: definition.at === "before" ? (result.answers ?? {}) : {},
            });
            await emit([
              patch(block.id, {
                status: result.skipped ? "skipped" : "done",
                message: result.message ?? null,
                data: result.data ?? null,
                endedAt: Date.now(),
              }),
            ]);
            return saved;
          });
          const { output, notes, candidates, answers: filled } = JSON.parse(result) as {
            output: unknown;
            notes: string[];
            candidates: TasteEntity[];
            answers?: Answers;
          };
          outputs[block.id] = output;
          for (const [key, value] of Object.entries(filled ?? {})) {
            const current = answers[key];
            const empty = current === undefined || current === null || current === "" || (Array.isArray(current) && !current.length);
            if (empty) answers[key] = value;
          }
          return { notes, candidates };
        } catch (error) {
          await emit([patch(block.id, { status: "error", error: message(error), endedAt: Date.now() })]);
          if (definition.required) throw new Error(`${definition.name}: ${message(error)}`);
          return { notes: [], candidates: [] };
        }
      };

      // Before Taste: notes for the profile.
      const notes: string[] = [];
      for (const code of codeSteps(config, "before")) notes.push(...(await runCode(code, { brief: null, sections: {} })).notes);

      // Taste.
      const blocks = generatedBlocks(catalogue, config);
      const { lookups } = config.workflow;
      const profile = profileText(params, context, notes);
      const read = await step.do("taste:read", QUICK, async () => {
        await start(TASTE, "Reading what you told us");
        return readTaste(profile, lookups);
      });
      const match = await step.do("taste:match", { ...QUICK, timeout: "4 minutes" }, () =>
        matchTaste({ read, context, lookups, answers, report: report(TASTE) }),
      );
      const brief: TasteBrief = await step.do("taste:brief", QUICK, async () => {
        await emit([patch(TASTE, { message: "Writing your taste brief" })], false);
        const written = await writeBrief({ profile, match });
        const matched = match.signals.filter((s) => s.id).map((s) => s.name);
        const found = Object.keys(match.entities).length;
        await emit([
          patch(TASTE, {
            status: "done",
            endedAt: Date.now(),
            // Public: what was matched, never the profile.
            data: { matched, found },
            message: match.qloo
              ? `Matched ${matched.length} ${matched.length === 1 ? "favourite" : "favourites"} and found ${found} picks in Qloo`
              : "Written from your answers",
          }),
        ]);
        return { ...match, ...written, profile, categories: read.categories, location: read.location || null };
      });

      // After Taste: a step that provides candidates adds them to the brief, under its id.
      for (const code of codeSteps(config, "after-taste")) {
        const { candidates } = await runCode(code, { brief, sections: {} });
        if (!code.definition.provides) continue;
        for (const entity of candidates) brief.entities[entity.id] ??= entity;
        brief.pools[code.block.id] = candidates.map((entity) => entity.id);
      }

      // The sections, in page order. Each knows what came before it.
      const used = new Set<string>();
      const earlier: EarlierSection[] = [];
      const sections: Record<string, unknown> = {};
      const extra = Object.fromEntries(codeSteps(config, "after-taste").map(({ block }) => [block.id, outputs[block.id]]));
      for (const { block, definition } of blocks) {
        const label = sectionLabel(block, definition.name);
        try {
          const result = await step.do(`section:${block.id}`, SECTION, async () => {
            const candidates = candidatesFor(definition, block, brief, used);
            // A section of picks with nothing to pick from would be all words: leave it out.
            if (candidates.length === 0 && definition.generate.picks) {
              const none = ((block.props.lookups as string[]) ?? []).length === 0;
              const reason = none ? "No lookups chosen to pick from" : "Nothing in Qloo to pick from";
              await emit([patch(block.id, { status: "skipped", message: reason, endedAt: Date.now() })]);
              return JSON.stringify({ data: null, used: [] });
            }
            const skills = skillsFor(context, [...config.workflow.skills, ...((block.props.skills as string[]) ?? [])]);
            await emit([
              { type: "entities", entities: Object.fromEntries(candidates.map((entity) => [entity.id, entity])) },
              patch(block.id, {
                status: "running",
                startedAt: Date.now(),
                data: null,
                error: null,
                message: `Writing ${label}`,
                skills: skills.map((skill) => skill.title),
              }),
            ]);
            let last = 0;
            let sent: Promise<unknown> = Promise.resolve();
            const written = await writeSection({
              definition,
              block,
              label,
              brief,
              brand: context.brand.name,
              firstName: params.person.name.split(" ")[0] ?? "",
              skills,
              earlier,
              candidates,
              extra,
              onPartial: (data) => {
                if (Date.now() - last < PARTIAL_MS) return;
                last = Date.now();
                sent = sent.then(() => emit([patch(block.id, { data })], false)).catch(() => {});
              },
            });
            await sent;
            await emit([patch(block.id, { status: "done", data: written.data, message: null, endedAt: Date.now() })]);
            return JSON.stringify(written);
          });
          const written = JSON.parse(result) as { data: unknown; used: string[] };
          if (written.data === null) continue;
          sections[block.id] = written.data;
          for (const id of written.used) used.add(id);
          earlier.push({ label, summary: summarize(written.data, brief.entities) });
        } catch (error) {
          console.error("section", block.id, error);
          await emit([patch(block.id, { status: "error", error: "This part couldn't be made.", endedAt: Date.now() })]);
        }
      }

      // Finish: the page is ready.
      await step.do("finish", QUICK, async () => {
        await emit([
          patch(FINISH, { status: "done", startedAt: Date.now(), endedAt: Date.now() }),
          { type: "run", patch: { status: "done" } },
        ]);
        await saveRunResult(params, { status: "done", run: await room.snapshot(), brief, error: null });
      });

      // In the background, once it's ready: webhooks, syncs.
      const after = codeSteps(config, "finish");
      for (const code of after) await runCode(code, { brief, sections });
      if (after.length) {
        await step.do("finish:save", QUICK, async () =>
          saveRunResult(params, { status: "done", run: await room.snapshot(), brief, error: null }),
        );
      }
    } catch (error) {
      console.error("outcome", params.runId, error);
      await step.do("fail", QUICK, async () => {
        await emit([{ type: "run", patch: { status: "error", error: "Something went wrong making this." } }]);
        await saveRunResult(params, { status: "error", run: await room.snapshot(), brief: null, error: message(error) });
      });
    }
  }
}
