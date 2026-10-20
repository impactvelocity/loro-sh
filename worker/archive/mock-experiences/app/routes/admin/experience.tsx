import { useState } from "react";
import { data, Link, Outlet, useLocation, useNavigate } from "react-router";
import { CheckIcon, CopyIcon, ExternalLinkIcon, PlusIcon } from "lucide-react";

import type { Route } from "./+types/experience";
import { funnelTypes, getFunnel, isInternal, peopleIn } from "@core/funnels";
import { StatusBadge } from "@/admin-components/experience-status";
import { PageHeader } from "@/admin-components/page-header";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Spinner } from "@/admin-components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";

export function loader({ params }: Route.LoaderArgs) {
  const funnel = getFunnel(params.slug);
  if (!funnel) throw data(null, { status: 404 });
  return { funnel, people: peopleIn(funnel), now: new Date().toISOString() };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.funnel.name ?? "Experience"} · Loro` }];
}

export type ExperienceContext = Route.ComponentProps["loaderData"];

const tabs = [
  { value: "", label: "Overview" },
  { value: "start", label: "Start Page", public: true },
  { value: "intake", label: "Intake", public: true },
  { value: "workflow", label: "Workflow" },
  { value: "tests", label: "Tests" },
  { value: "feedback", label: "Feedback" },
  { value: "share", label: "Share" },
  { value: "settings", label: "Settings" },
];

/** Tabs with fields to save. The rest act straight away. */
const editable = ["start", "intake", "workflow", "settings"];

/** Mocked: pauses, then shows it saved. */
function SaveActions() {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  return (
    <>
      <Button variant="ghost" size="sm" disabled={state === "saving"}>
        Discard
      </Button>
      <Button
        size="sm"
        aria-busy={state === "saving"}
        onClick={() => {
          setState("saving");
          setTimeout(() => setState("saved"), 700);
          setTimeout(() => setState("idle"), 2200);
        }}
      >
        {state === "saving" && <Spinner data-icon="inline-start" />}
        {state === "saved" && <CheckIcon data-icon="inline-start" />}
        {state === "saved" ? "Saved" : "Save Changes"}
      </Button>
    </>
  );
}

function ShareActions({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          navigator.clipboard?.writeText(new URL(href, location.origin).toString());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
        {copied ? "Copied" : "Copy Link"}
      </Button>
      <a href={href} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Open Page
        <ExternalLinkIcon data-icon="inline-end" />
      </a>
    </>
  );
}

export default function ExperienceLayout({ loaderData }: Route.ComponentProps) {
  const { funnel } = loaderData;
  const base = `/admin/experiences/${funnel.slug}`;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = pathname.replace(base, "").replace(/^\//, "").split("/")[0] ?? "";
  // Fixtures only render the type's sample data for now.
  const href = `/f/${funnel.type}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        back={{ to: "/admin/experiences", label: "Experiences" }}
        backAside={
          <>
            <Badge variant="outline">
              {funnelTypes[funnel.type].name}
              {isInternal(funnel.type) && <span className="max-sm:hidden"> · Internal</span>}
            </Badge>
            <StatusBadge status={funnel.status} />
          </>
        }
        title={funnel.name}
        description={`${funnel.anchor.name}, ${funnel.anchor.date} · ${funnel.anchor.place}`}
        actions={
          editable.includes(current) ? (
            <SaveActions key={current} />
          ) : current !== "" ? undefined : isInternal(funnel.type) ? (
            <Link to={`${base}/share`} className={buttonVariants({ size: "sm" })}>
              <PlusIcon data-icon="inline-start" />
              Create for Someone
            </Link>
          ) : (
            <ShareActions href={href} />
          )
        }
      />

      {/* Scrolls sideways on phones. The padding keeps the active underline inside. */}
      <Tabs
        className="overflow-x-auto pb-px [scrollbar-width:none]"
        value={current}
        onValueChange={(value) =>
          navigate(value ? `${base}/${value}` : base, { preventScrollReset: true })
        }
      >
        <TabsList variant="line" className="w-max min-w-full justify-start">
          {tabs.filter((tab) => !(tab.public && isInternal(funnel.type))).map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {tab.value === "intake" && (
                <span className="text-muted-foreground tabular-nums">{funnel.intake.length}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Outlet context={loaderData satisfies ExperienceContext} />
    </div>
  );
}
