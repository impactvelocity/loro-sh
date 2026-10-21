import { ButtonLink, Container } from "@/components/ui";
import { deployUrl, links } from "@/lib/links";

const features = [
  {
    title: "Experiences",
    body: "A start page, questions and an outcome, each built from a catalogue of components. Fork a catalogue to make your own kind.",
  },
  {
    title: "Profiles",
    body: "Every sign-up lands on a person with their answers and taste, ready to group into segments.",
  },
  {
    title: "Agent",
    body: "Ask it to set up an experience or find people in Profiles. It asks before it changes anything.",
  },
  {
    title: "REST API",
    body: "POST /trigger starts an experience from your booking system or CRM, with the answers already filled in.",
  },
  {
    title: "MCP server",
    body: "The same tools at /mcp, for Claude or any other MCP client, with a workspace API key.",
  },
  {
    title: "Analytics",
    body: "Views, sign-ups and outcomes per experience, counted without names or emails.",
  },
];

const stack = ["Workers", "D1", "KV", "R2", "Workflows", "Durable Objects", "AI Gateway", "Images", "Stream"];

export function Framework() {
  return (
    <section id="framework" className="scroll-mt-16 pt-24 sm:pt-32">
      <Container>
        <div className="overflow-hidden rounded-[28px] bg-deep text-white">
          <div className="grid grid-cols-1 gap-12 p-6 sm:p-10 lg:grid-cols-12 lg:gap-14 lg:p-14">
            <div className="lg:col-span-5">
              <h2 className="font-display text-4xl leading-[1.05] tracking-normal text-balance sm:text-5xl">
                Open source, on your own Cloudflare account
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-pretty text-white/70">
                Loro is one Cloudflare Worker. Deploy it to your account and every profile, answer and outcome stays in
                your database.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span key={item} className="rounded-full border border-white/12 px-3 py-1 text-[13px] text-white/75">
                    {item}
                  </span>
                ))}
              </div>
              {links.repo ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  {deployUrl ? <ButtonLink href={deployUrl} variant="inverse">Deploy to Cloudflare</ButtonLink> : null}
                  <ButtonLink href={links.repo} variant="inverse-secondary">
                    Read the code
                  </ButtonLink>
                </div>
              ) : null}
            </div>

            <div className="min-w-0 lg:col-span-7">
              <Trigger />
            </div>
          </div>

          <ul className="grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li
                key={f.title}
                className="border-b border-white/10 p-6 sm:p-8 sm:odd:border-r lg:border-r lg:odd:border-r lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-last-child(-n+3)]:border-b-0"
              >
                <h3 className="font-display text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/65">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/** The call a booking system makes for the stay example: answers in, Maya's page out. */
function Trigger() {
  const k = "text-[#b4b4e6]";
  const s = "text-[#c9d6bf]";
  const d = "text-white/40";
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-deep-raised">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-[13px] text-white/60">After a booking, from your system</p>
        <span className="rounded-full bg-white/8 px-2.5 py-0.5 font-mono text-[11px] text-white/60">POST</span>
      </div>
      <pre className="overflow-x-auto [scrollbar-color:rgb(255_255_255/0.15)_transparent] [scrollbar-width:thin] p-4 font-mono text-[12.5px] leading-[1.7] sm:p-5 sm:text-[13px]">
        <code>
          <span className={d}>curl</span> https://app.loro.sh/api/workspaces/low-tide-house/{"\n"}
          {"  "}experiences/your-stay/trigger \{"\n"}
          {"  "}-H <span className={s}>&quot;Authorization: Bearer $LORO_KEY&quot;</span> \{"\n"}
          {"  "}-d <span className={s}>&apos;</span>
          {"{"}
          {"\n"}
          {"    "}<span className={k}>&quot;person&quot;</span>: {"{ "}<span className={k}>&quot;name&quot;</span>:{" "}
          <span className={s}>&quot;Maya&quot;</span>, <span className={k}>&quot;email&quot;</span>:{" "}
          <span className={s}>&quot;maya@example.com&quot;</span>
          {" },"}
          {"\n"}
          {"    "}<span className={k}>&quot;answers&quot;</span>: {"{"}
          {"\n"}
          {"      "}<span className={k}>&quot;arrive&quot;</span>: <span className={s}>&quot;Friday&quot;</span>,{" "}
          <span className={k}>&quot;nights&quot;</span>: <span className={s}>&quot;Two&quot;</span>,{"\n"}
          {"      "}<span className={k}>&quot;dog&quot;</span>: <span className={s}>&quot;Juniper&quot;</span>,{"\n"}
          {"      "}<span className={k}>&quot;favourites&quot;</span>:{" "}
          <span className={s}>&quot;Sightglass, Tartine, Zuni Café&quot;</span>,{"\n"}
          {"      "}<span className={k}>&quot;plan-around&quot;</span>:{" "}
          <span className={s}>&quot;Saturday&apos;s our anniversary.&quot;</span>
          {"\n"}
          {"    }"}
          {"\n"}
          {"  }"}
          <span className={s}>&apos;</span>
        </code>
      </pre>
      <div className="border-t border-white/10 px-4 py-3 text-[13px] text-white/60 sm:px-5">
        Loro reads Maya&rsquo;s taste, plans her days around the house and posts her page&rsquo;s link to your
        webhook.
      </div>
    </div>
  );
}
