/**
 * The Stay catalogue's start page, for guests who want to plan their days
 * before they arrive. Most guests never see it: the booking system starts
 * the experience by API and emails the outcome. It's here for anyone who
 * wants to try it, set like a small guest house's site: an inset photo
 * with the headline centred over it and the sign-up under it, a line
 * about the house, two cards, the dog notes, the house facts, an example
 * from a real run, a second sign-up and questions.
 */
import { type ReactNode, useState } from "react";
import { ArrowRightIcon, CircleHelpIcon, DogIcon, LayoutGridIcon, ListIcon, MailIcon, PanelTopIcon, PilcrowIcon, SparklesIcon } from "lucide-react";

import { type RenderContext, defineComponent, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { CatalogueLink, brandStyle } from "../basic/shared";
import { cn } from "@/lib/utils";
import { Action, Logo, SectionHead, button, display, displayHeadings, field, lead, named, quiet, wrap } from "./shared";

const tokens = "Use {{first_name}} or {{answers.<id>}} to fill in from their answers.";

export const startLayout = defineLayout({
  fields: {
    brand: f.text({ label: "House name", default: "Low Tide House" }),
    logo: f.image({ label: "Logo", help: "Shown instead of the name." }),
    accent: f.color({ label: "Accent", default: "#9c9a81" }),
    nav: f.list({ label: "Navigation", itemLabel: "Link", max: 4, fields: { link: f.link({ label: "Link" }) } }),
    cta: f.link({ label: "Header button", default: { label: "Plan your stay", href: "#start" } }),
    address: f.longText({ label: "Address", help: "In the footer. One line per line." }),
    contact: f.longText({ label: "Contact", help: "In the footer. One line per line." }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground antialiased">
      <header className={cn(wrap, "flex h-22 items-center justify-between gap-6")}>
        <Logo brand={settings.brand} logo={settings.logo} className="text-[1.35rem] @3xl:text-[1.6rem]" />
        <div className="flex items-center gap-4 @3xl:gap-8">
          {settings.nav.length > 0 && (
            <nav className="flex items-center gap-6 font-display text-[1.05rem] @max-3xl:hidden">
              {settings.nav.map(({ link }, i) => (
                <CatalogueLink key={i} href={link.href} ctx={ctx} className="underline-offset-[6px] decoration-1 hover:underline">
                  {link.label}
                </CatalogueLink>
              ))}
            </nav>
          )}
          <Action link={settings.cta} ctx={ctx} className="h-10 px-4 text-[0.92rem] whitespace-nowrap @3xl:h-11 @3xl:px-5" />
        </div>
      </header>
      <main className={cn("flex-1", displayHeadings)}>{children}</main>
      <footer className={cn(wrap, "grid gap-10 pt-20 pb-12 @3xl:grid-cols-12")}>
        <div className="flex flex-col gap-6 @3xl:col-span-6">
          <Logo brand={settings.brand} className="text-[2rem]" />
          {settings.footer && <p className={cn(quiet, "max-w-sm")}>{settings.footer}</p>}
        </div>
        {[settings.address, settings.contact].map((block, i) =>
          block ? (
            <p key={i} className="font-display text-[1.1rem] leading-relaxed whitespace-pre-line @3xl:col-span-3">
              {block}
            </p>
          ) : null,
        )}
        <p className={cn(quiet, "@3xl:col-span-12")}>Places matched to your taste by Qloo</p>
      </footer>
    </div>
  ),
});

/**
 * Name and email, then on to the questions. Errors show only on the form
 * that was sent, since the hero and the lower sign-up share one sign-up.
 */
function SignupForm({
  ctx,
  title,
  body,
  askName,
  label,
  note,
  className,
}: {
  ctx: RenderContext;
  title: string;
  body: string;
  askName: boolean;
  label: string;
  note: string;
  className?: string;
}) {
  const [name, setName] = useState(ctx.optin.initial?.name ?? "");
  const [email, setEmail] = useState(ctx.optin.initial?.email ?? "");
  const [sent, setSent] = useState(false);
  const { pending } = ctx.optin;
  const errors = sent ? ctx.optin.errors : {};
  return (
    <form
      noValidate
      className={cn("flex flex-col gap-6 bg-card px-6 py-8 text-center text-foreground shadow-[0_24px_60px_-34px_oklch(0.2_0.02_100/0.55)] @2xl:px-10 @2xl:py-10", className)}
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
        ctx.optin.submit({ name, email });
      }}
    >
      {(title || body) && (
        <div className="flex flex-col items-center gap-3">
          {/* h3: the layout sets every h2 as a section heading. */}
          {title && <h3 className={cn(display, "text-[clamp(1.9rem,3.2cqi,2.4rem)] text-balance")}>{title}</h3>}
          {body && <p className="max-w-lg leading-relaxed text-muted-foreground text-pretty">{body}</p>}
        </div>
      )}
      <div className={cn("grid gap-3 text-left", askName ? "@2xl:grid-cols-[1fr_1.4fr_auto]" : "@2xl:grid-cols-[1fr_auto]")}>
        {askName && (
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">First name</span>
            <input
              className={field}
              autoComplete="given-name"
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className="text-sm text-red-700">{errors.name}</span>}
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">Email</span>
          <input
            className={field}
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="text-sm text-red-700">{errors.email}</span>}
        </label>
        <button type="submit" disabled={pending} className={cn(button, "self-start")}>
          {pending ? "One moment…" : label}
        </button>
      </div>
      {errors.form && (
        <p role="alert" className="text-sm text-red-700">
          {errors.form}
        </p>
      )}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </form>
  );
}

/** The top: an inset photo with the headline centred over it, and the sign-up just under it. */
const hero = defineComponent({
  type: "hero",
  name: "Hero",
  description: "The headline over an inset photo, with the sign-up straddling its lower edge.",
  icon: PanelTopIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "Four blocks up from the beach" }),
    body: f.text({ label: "Under the headline" }),
    image: f.image({ label: "Photo" }),
    signup: f.toggle({ label: "Sign-up in the hero", default: true, help: "Off: a button down to the sign-up instead." }),
    formTitle: f.text({ label: "Sign-up heading", default: "Plan your days before you pack" }),
    formBody: f.longText({ label: "Sign-up intro" }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Sign-up button", default: "Plan my stay" }),
    note: f.text({ label: "Small print", default: "We'll only email you about your stay." }),
    cta: f.link({ label: "Button", default: { label: "Plan your stay", href: "#join" }, help: "Shown when the sign-up isn't in the hero." }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className={cn(wrap, "flex flex-col")}>
      <div className="relative isolate flex min-h-[min(74svh,44rem)] items-center justify-center overflow-hidden bg-[var(--deep)] px-6 py-24 text-center text-white">
        {props.image && (
          <>
            <img src={props.image} alt="" fetchPriority="high" className="absolute inset-0 -z-10 size-full object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-black/30" />
          </>
        )}
        <div className={cn("flex max-w-4xl flex-col items-center gap-6", props.signup && "pb-24 @3xl:pb-28")}>
          <h1 className={cn(display, "text-[clamp(2.9rem,7cqi,5.6rem)] [line-height:1.04] text-balance drop-shadow-[0_1px_18px_rgb(0_0_0/0.25)]")}>
            {props.headline}
          </h1>
          {props.body && <p className="max-w-xl font-display text-[1.25rem] leading-relaxed text-pretty opacity-95">{props.body}</p>}
          {!props.signup && <Action link={props.cta} ctx={ctx} kind="paper" className="mt-4 h-13 px-9" />}
        </div>
      </div>
      {props.signup && (
        <div id="start" className="relative z-10 mx-auto -mt-28 w-full max-w-3xl scroll-mt-6 px-0 @3xl:-mt-32 @3xl:px-6">
          <SignupForm ctx={ctx} title={props.formTitle} body={props.formBody} askName={props.askName} label={props.button} note={props.note} />
        </div>
      )}
    </section>
  ),
});

/** One line about the place, centred in the serif, the way a guest house's homepage opens. */
const intro = defineComponent({
  type: "intro",
  name: "Intro",
  description: "A centred paragraph in the serif, with an optional sign-off.",
  icon: PilcrowIcon,
  fields: {
    body: f.longText({ label: "Text" }),
    signature: f.text({ label: "Sign-off", placeholder: "Nell and Tomás" }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className={cn(wrap, "flex scroll-mt-6 flex-col items-center gap-6 py-24 text-center @4xl:py-32")}>
      <p className={cn(lead, "max-w-3xl text-[clamp(1.45rem,2.6cqi,1.95rem)] [line-height:1.5]")}>{ctx.fill(props.body)}</p>
      {props.signature && <p className={cn(named, "text-xl text-muted-foreground")}>{props.signature}</p>}
    </section>
  ),
});

/** Two (or three) photo cards: a photo, a centred serif title, a line, a text link. */
const cards = defineComponent({
  type: "cards",
  name: "Cards",
  description: "Photo cards with a centred title, a line and a link, side by side.",
  icon: LayoutGridIcon,
  fields: {
    items: f.list({
      label: "Cards",
      itemLabel: "Card",
      max: 3,
      fields: {
        image: f.image({ label: "Photo" }),
        title: f.text({ label: "Title" }),
        body: f.longText({ label: "Text" }),
        link: f.link({ label: "Link" }),
      },
    }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className={cn(wrap, "grid gap-x-10 gap-y-16 pb-24 @3xl:grid-cols-2 @4xl:pb-32", props.items.length === 3 && "@5xl:grid-cols-3")}>
      {props.items.map((item, i) => (
        <article key={i} className="flex flex-col items-center gap-5 text-center">
          {item.image && <img src={item.image} alt="" loading="lazy" className="aspect-[3/2] w-full object-cover" />}
          <h3 className={cn(display, "mt-3 text-[2.1rem]")}>{item.title}</h3>
          {item.body && <p className="max-w-md text-[1.05rem] leading-relaxed text-pretty">{item.body}</p>}
          <Action link={item.link} ctx={ctx} kind="text" />
        </article>
      ))}
    </section>
  ),
});

/**
 * The small print that matters to a dog owner, as italic serif names over
 * a line each, beside a photo. Also on the outcome, headed with the dog's
 * name.
 */
export const notes = defineComponent({
  type: "notes",
  name: "Notes",
  description: "Short notes as italic titles over a line each, in two columns, with a photo.",
  icon: DogIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Bring the dog", help: tokens }),
    body: f.longText({ label: "Intro", help: tokens }),
    image: f.image({ label: "Photo" }),
    items: f.list({
      label: "Notes",
      itemLabel: "Note",
      max: 8,
      fields: { title: f.text({ label: "Title" }), body: f.longText({ label: "Text" }) },
    }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className="scroll-mt-6 bg-[var(--sand)]">
      <div className={cn(wrap, "grid gap-x-14 gap-y-12 py-24 @4xl:grid-cols-12 @4xl:items-center @4xl:py-28")}>
        {props.image && <img src={props.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover @4xl:col-span-5" />}
        <div className={cn("flex flex-col gap-12", props.image ? "@4xl:col-span-7" : "@4xl:col-span-12")}>
          <div className="flex flex-col gap-4">
            <h2 className={cn(display, "text-[clamp(2.4rem,5cqi,4rem)] text-balance")}>{ctx.fill(props.heading)}</h2>
            {props.body && <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">{ctx.fill(props.body)}</p>}
          </div>
          <dl className="grid gap-x-10 gap-y-9 @2xl:grid-cols-2">
            {props.items.map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <dt className={named}>{item.title}</dt>
                <dd className="leading-relaxed text-pretty">{ctx.fill(item.body)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  ),
});

/** The facts a guest checks twice: beds, times, parking. Centred, like a guest house's visit page. Also on the outcome. */
export const details = defineComponent({
  type: "details",
  name: "House Details",
  description: "Label and value pairs in centred columns, like check-in time and beds.",
  icon: ListIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The house" }),
    body: f.longText({ label: "Intro", help: tokens }),
    items: f.list({
      label: "Details",
      itemLabel: "Detail",
      max: 12,
      fields: { label: f.text({ label: "Label" }), value: f.text({ label: "Value" }) },
      default: [
        { label: "Check-in", value: "From 4 PM" },
        { label: "Check-out", value: "By 11 AM" },
      ],
    }),
    link: f.link({ label: "Button" }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className={cn(wrap, "flex scroll-mt-6 flex-col items-center gap-14 py-24 @4xl:py-32")}>
      <SectionHead title={ctx.fill(props.heading)} body={props.body && ctx.fill(props.body)} />
      <dl className="grid w-full max-w-5xl gap-x-8 gap-y-10 text-center @xl:grid-cols-2 @3xl:grid-cols-4">
        {props.items.map((item, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <dt className="text-sm font-semibold">{item.label}</dt>
            <dd className="font-display text-[1.2rem] leading-snug text-pretty">{ctx.fill(item.value)}</dd>
          </div>
        ))}
      </dl>
      <Action link={props.link} ctx={ctx} />
    </section>
  ),
});

/**
 * What Qloo does with someone's taste, shown before they start: a place a
 * guest loves at home on the left, what was found in town for them on the
 * right. The rows come from a real run, so the example is true.
 */
const example = defineComponent({
  type: "example",
  name: "Taste Example",
  description: "Places a guest loves at home, next to what was found here for them. From a real run.",
  icon: SparklesIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Same taste, new town" }),
    body: f.longText({ label: "Intro" }),
    items: f.list({
      label: "Rows",
      itemLabel: "Row",
      max: 5,
      fields: {
        yours: f.text({ label: "Their place", placeholder: "Sightglass, San Francisco" }),
        near: f.text({ label: "Found here", placeholder: "Carmel Valley Coffee Roasting" }),
        detail: f.text({ label: "Detail", placeholder: "6 min walk · coffee" }),
        image: f.image({ label: "Photo" }),
      },
    }),
    note: f.text({ label: "Small print" }),
    cta: f.link({ label: "Button", default: { label: "Find yours", href: "#join" } }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className={cn(wrap, "flex flex-col items-center gap-14 py-24 @4xl:py-32")}>
      <SectionHead title={props.heading} body={props.body} />
      <ol className="flex w-full max-w-4xl flex-col border-t border-border">
        {props.items.map((item, i) => (
          <li key={i} className="grid items-center gap-x-8 gap-y-3 border-b border-border py-7 @3xl:grid-cols-[1fr_auto_1.3fr]">
            <span className="text-lg text-muted-foreground">{item.yours}</span>
            <ArrowRightIcon aria-hidden className="size-4 text-muted-foreground @max-3xl:hidden" />
            <span className="flex items-center gap-5">
              {item.image && <img src={item.image} alt="" loading="lazy" className="size-16 shrink-0 object-cover" />}
              <span className="flex flex-col gap-1">
                <span className={cn(display, "text-[1.9rem]")}>{item.near}</span>
                {item.detail && <span className={quiet}>{item.detail}</span>}
              </span>
            </span>
          </li>
        ))}
      </ol>
      {props.note && <p className={cn(quiet, "max-w-xl text-center")}>{props.note}</p>}
      <Action link={props.cta} ctx={ctx} />
    </section>
  ),
});

/** The lower sign-up: a wide inset photo with the headline over it, and the same form under it. */
const optin = defineComponent({
  type: "optin",
  name: "Sign-Up",
  description: "A headline over a wide photo, and the sign-up under it.",
  icon: MailIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "Plan your stay" }),
    body: f.longText({ label: "Intro" }),
    image: f.image({ label: "Photo" }),
    formTitle: f.text({ label: "Form heading" }),
    formBody: f.longText({ label: "Form intro" }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Button", default: "Plan my stay" }),
    note: f.text({ label: "Small print", default: "We'll only email you about your stay." }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className={cn(wrap, "flex scroll-mt-4 flex-col py-12")}>
      <div className="relative isolate flex min-h-[26rem] flex-col items-center justify-center gap-5 overflow-hidden bg-[var(--deep)] px-6 pt-20 pb-36 text-center text-white">
        {props.image && (
          <>
            <img src={props.image} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-black/30" />
          </>
        )}
        <h2 className={cn(display, "text-[clamp(2.9rem,7cqi,5.2rem)] text-balance")}>{props.headline}</h2>
        {props.body && <p className="max-w-xl font-display text-[1.25rem] leading-relaxed text-pretty opacity-95">{props.body}</p>}
      </div>
      <div className="relative z-10 mx-auto -mt-24 w-full max-w-3xl @3xl:px-6">
        <SignupForm ctx={ctx} title={props.formTitle} body={props.formBody} askName={props.askName} label={props.button} note={props.note} />
      </div>
    </section>
  ),
});

function Faq({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group border-b border-border py-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-[1.35rem] font-[350]">
        {question}
        <span aria-hidden className="text-2xl font-light text-muted-foreground transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="max-w-2xl pt-3 leading-relaxed text-muted-foreground text-pretty">{children}</p>
    </details>
  );
}

const faq = defineComponent({
  type: "faq",
  name: "Questions",
  description: "What guests ask before they start.",
  icon: CircleHelpIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Questions" }),
    items: f.list({
      label: "Questions",
      itemLabel: "Question",
      fields: { question: f.text({ label: "Question" }), answer: f.longText({ label: "Answer" }) },
    }),
  },
  Component: ({ id, props }) => (
    <section id={id} className={cn(wrap, "flex scroll-mt-6 flex-col items-center gap-12 py-24 @4xl:py-32")}>
      {props.heading && <SectionHead title={props.heading} />}
      <div className="flex w-full max-w-3xl flex-col border-t border-border">
        {props.items.map((item, i) => (
          <Faq key={i} question={item.question}>
            {item.answer}
          </Faq>
        ))}
      </div>
    </section>
  ),
});

export const startComponents = [hero, intro, cards, notes, details, example, optin, faq];
