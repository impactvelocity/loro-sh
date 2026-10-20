/**
 * The Date catalogue's start page, set like Squarespace's Fayette: a
 * photo full bleed under a light wine wash with the line centred in big
 * serif and the sign-up right under it; then photo-and-words rows that
 * swap sides, on cream to break up the wine; a real plan from a test run, so they see what they'll
 * get; where the dates happen, as Fayette's location row; a second
 * sign-up over a photo; and questions.
 *
 * In the dating app's own flow the experience is started by API after a
 * match, with both people's taste filled in. This page is for people who
 * come to it on their own, and for the demo.
 */
import { useState } from "react";
import { ArrowRightIcon, CircleHelpIcon, ClockIcon, ImageIcon, MailIcon, MapPinnedIcon, PanelTopIcon } from "lucide-react";

import { type RenderContext, defineComponent, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { CatalogueLink } from "../basic/shared";
import { cn } from "@/lib/utils";
import { Logo, SectionHead, Wash, body, button, display, displayHeadings, field, quiet, toneStyle, wrap } from "./shared";

export const startLayout = defineLayout({
  fields: {
    brand: f.text({ label: "App name", default: "Overlap" }),
    logo: f.image({ label: "Logo", help: "Shown instead of the name." }),
    nav: f.list({ label: "Navigation", itemLabel: "Link", max: 4, fields: { link: f.link({ label: "Link" }) } }),
    cta: f.link({ label: "Header button", default: { label: "Plan a date", href: "#start" } }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div className={cn("flex flex-1 flex-col bg-background text-foreground antialiased", body)}>
      {/* Over the hero, which pulls itself up under it. */}
      <header className="relative z-20">
        <div className={cn(wrap, "flex h-20 items-center justify-between gap-6")}>
          <Logo brand={settings.brand} logo={settings.logo} className="text-[1.75rem]" />
          <div className="flex items-center gap-8">
            {settings.nav.length > 0 && (
              <nav className="flex items-center gap-7 text-[0.95rem] @max-3xl:hidden">
                {settings.nav.map(({ link }, i) => (
                  <CatalogueLink key={i} href={link.href} ctx={ctx} className="opacity-85 transition-opacity hover:opacity-100">
                    {link.label}
                  </CatalogueLink>
                ))}
              </nav>
            )}
            {settings.cta.label && (
              <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(button, "h-10 px-5 whitespace-nowrap")}>
                {settings.cta.label}
              </CatalogueLink>
            )}
          </div>
        </div>
      </header>
      <main className={cn("flex-1", displayHeadings)}>{children}</main>
      <footer className="overflow-hidden bg-[var(--deep)] text-[var(--deep-foreground)]">
        <div className={cn(wrap, "flex flex-col gap-10 pt-24 pb-10")}>
          <Logo brand={settings.brand} className="text-[clamp(4rem,16cqi,14rem)] leading-[0.85] whitespace-nowrap" />
          <div className="flex flex-col gap-3 border-t border-current/15 pt-6 text-sm opacity-70 @2xl:flex-row @2xl:justify-between">
            {settings.footer && <span>{settings.footer}</span>}
            <span>Places matched to both of your tastes by Qloo</span>
          </div>
        </div>
      </footer>
    </div>
  ),
});

/**
 * Name and email in one row, then on to the questions, like an RSVP.
 * Errors show only on the form that was sent, since the hero and the
 * lower sign-up share one sign-up.
 */
function SignupForm({ ctx, askName, label, note, className }: { ctx: RenderContext; askName: boolean; label: string; note: string; className?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { pending } = ctx.optin;
  const errors = sent ? ctx.optin.errors : {};
  return (
    <form
      noValidate
      className={cn("flex w-full flex-col gap-3", className)}
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
        ctx.optin.submit({ name, email });
      }}
    >
      <div className={cn("grid gap-2", askName ? "@2xl:grid-cols-[1fr_1.4fr_auto]" : "@2xl:grid-cols-[1fr_auto]")}>
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
        </label>
        <button type="submit" disabled={pending} className={cn(button, "whitespace-nowrap")}>
          {pending ? "One moment…" : label}
          {!pending && <ArrowRightIcon className="size-4" />}
        </button>
      </div>
      {(errors.name || errors.email || errors.form) && (
        <p role="alert" className="text-sm text-[var(--blush)]">
          {errors.name ?? errors.email ?? errors.form}
        </p>
      )}
      {note && <p className="text-xs opacity-70">{note}</p>}
    </form>
  );
}

/** Fayette's hero: a photo under a wine wash, the line centred in big serif, the sign-up under it. */
const hero = defineComponent({
  type: "hero",
  name: "Hero",
  description: "A centred headline over a full-bleed photo, with the sign-up under it.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Headline", default: "Plan the date" }),
    body: f.longText({ label: "Under the headline" }),
    image: f.image({ label: "Photo" }),
    signup: f.toggle({ label: "Sign-up in the hero", default: true, help: "Off: a button down to the sign-up instead." }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Sign-up button", default: "Start" }),
    note: f.text({ label: "Small print" }),
    cta: f.link({ label: "Button", default: { label: "Plan a date", href: "#join" }, help: "Shown when the sign-up isn't in the hero." }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className="relative isolate -mt-20 overflow-hidden">
      <Wash image={props.image} />
      <div className={cn(wrap, "flex min-h-[min(94svh,60rem)] flex-col items-center justify-center gap-8 pt-36 pb-20 text-center")}>
        <h1 className={cn(display, "max-w-6xl text-[clamp(3.25rem,8.5cqi,7.75rem)] leading-[0.98] text-balance")}>{props.title}</h1>
        {props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-90 @3xl:text-xl">{props.body}</p>}
        {props.signup ? (
          <div id="start" className="mt-2 w-full max-w-2xl scroll-mt-24 text-left">
            <SignupForm ctx={ctx} askName={props.askName} label={props.button} note={props.note} className="[&>p:last-child]:text-center" />
          </div>
        ) : (
          props.cta.label && (
            <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "mt-2")}>
              {props.cta.label}
            </CatalogueLink>
          )
        )}
      </div>
    </section>
  ),
});

/** Fayette's rows: a photo on one side, a big heading and a short paragraph on the other. */
const feature = defineComponent({
  type: "feature",
  name: "Photo and Words",
  description: "A photo beside a heading and a paragraph. Alternate the side down the page.",
  icon: ImageIcon,
  fields: {
    heading: f.text({ label: "Heading" }),
    body: f.longText({ label: "Words" }),
    image: f.image({ label: "Photo" }),
    side: f.segmented({
      label: "Photo on the",
      default: "left",
      options: [
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
      ],
    }),
    tone: f.segmented({
      label: "Background",
      default: "light",
      options: [
        { value: "wine", label: "Wine" },
        { value: "light", label: "Cream" },
      ],
    }),
  },
  Component: ({ id, props }) => (
    <section id={id} style={toneStyle(props.tone)} className="scroll-mt-6">
      <div className={cn(wrap, "grid items-center gap-x-16 gap-y-10 py-14 @4xl:grid-cols-12 @4xl:py-20")}>
      {props.image && (
        <img
          src={props.image}
          alt=""
          loading="lazy"
          className={cn("aspect-[4/3] w-full object-cover @4xl:col-span-6", props.side === "right" && "@4xl:order-2 @4xl:col-start-7")}
        />
      )}
      <div className={cn("flex flex-col gap-6 @4xl:col-span-5", props.side === "right" ? "@4xl:order-1 @4xl:col-start-1" : "@4xl:col-start-8")}>
        {props.heading && <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.25rem)] text-balance")}>{props.heading}</h2>}
        {props.body
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((paragraph, i) => (
            <p key={i} className="max-w-md text-lg leading-relaxed text-pretty opacity-90">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  ),
});

/**
 * A real plan, so people see what they'll get before they start: the
 * times, the places and which favourite each came from. The rows come
 * from a test run, so the example is true.
 */
const example = defineComponent({
  type: "example",
  name: "Example Plan",
  description: "A plan from a real run: times, places and the favourite each one came from.",
  icon: ClockIcon,
  fields: {
    label: f.text({ label: "Beside the heading", placeholder: "An example" }),
    heading: f.text({ label: "Heading", default: "Saturday in the West Village" }),
    body: f.longText({ label: "Intro" }),
    rows: f.list({
      label: "Stops",
      itemLabel: "Stop",
      max: 6,
      fields: {
        time: f.text({ label: "Time", placeholder: "6 PM" }),
        place: f.text({ label: "Place", placeholder: "Bar Pisellino" }),
        detail: f.text({ label: "Detail", placeholder: "A drink to start · 4 min walk" }),
        because: f.text({ label: "Because", placeholder: "Maya likes Phoebe Bridgers" }),
        image: f.image({ label: "Photo" }),
      },
    }),
    note: f.text({ label: "Small print" }),
    cta: f.link({ label: "Button", default: { label: "Plan yours", href: "#join" } }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className="bg-[var(--deep)] text-[var(--deep-foreground)]">
      <div className={cn(wrap, "flex flex-col gap-14 py-24 @4xl:py-32")}>
        <SectionHead
          label={props.label}
          title={props.heading}
          aside={props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-80">{props.body}</p>}
        />
        <ol className="flex flex-col border-t border-current/15 @4xl:ml-[25%]">
          {props.rows.map((row, i) => (
            <li key={i} className="grid items-center gap-x-8 gap-y-3 border-b border-current/15 py-6 @3xl:grid-cols-[8rem_4.5rem_1fr]">
              <span className={cn(display, "text-4xl")}>{row.time}</span>
              {row.image ? (
                <img src={row.image} alt="" loading="lazy" className="size-[4.5rem] object-cover @max-3xl:hidden" />
              ) : (
                <span className="size-[4.5rem] bg-current/10 @max-3xl:hidden" />
              )}
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-xl font-normal tracking-[-0.02em]">{row.place}</span>
                {row.detail && <span className="text-sm opacity-65">{row.detail}</span>}
                {row.because && <span className="text-sm text-[var(--blush)]">Because {row.because}</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center @3xl:justify-between @4xl:ml-[25%]">
          {props.note && <p className="max-w-xl text-sm opacity-60">{props.note}</p>}
          {props.cta.label && (
            <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "self-start")}>
              {props.cta.label}
              <ArrowRightIcon className="size-4" />
            </CatalogueLink>
          )}
        </div>
      </div>
    </section>
  ),
});

/** Fayette's location row: a small label on the left, the places in big serif on the right. */
const areas = defineComponent({
  type: "areas",
  name: "Where",
  description: "The cities and neighbourhoods dates are planned in, set big like an address.",
  icon: MapPinnedIcon,
  fields: {
    label: f.text({ label: "Label", default: "Where" }),
    items: f.list({
      label: "Cities",
      itemLabel: "City",
      max: 6,
      fields: { city: f.text({ label: "City", placeholder: "New York" }), areas: f.text({ label: "Neighbourhoods", placeholder: "West Village, Lower East Side" }) },
    }),
    note: f.longText({ label: "Small print" }),
  },
  Component: ({ id, props }) => (
    <section id={id} className={cn(wrap, "grid scroll-mt-6 gap-x-10 gap-y-8 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
      {props.label && <p className="text-[0.95rem] opacity-80 @4xl:col-span-3 @4xl:pt-5">{props.label}</p>}
      <div className="flex flex-col gap-10 @4xl:col-span-9">
        {props.items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2">
            <h2 className={cn(display, "text-[clamp(3rem,7cqi,6.5rem)] leading-[0.98]")}>{item.city}</h2>
            {item.areas && <p className="text-lg opacity-80">{item.areas}</p>}
          </div>
        ))}
        {props.note && <p className={cn(quiet, "max-w-lg")}>{props.note}</p>}
      </div>
    </section>
  ),
});

/** Fayette's RSVP band: a photo full bleed, the heading centred, the sign-up under it. */
const optin = defineComponent({
  type: "optin",
  name: "Sign-Up",
  description: "A centred heading over a full-bleed photo, with the sign-up under it.",
  icon: MailIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "Plan the date" }),
    body: f.longText({ label: "Intro" }),
    image: f.image({ label: "Photo", help: "Behind the whole section." }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Button", default: "Start" }),
    note: f.text({ label: "Small print" }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className="relative isolate scroll-mt-4 overflow-hidden">
      <Wash image={props.image} strength="light" />
      <div className={cn(wrap, "flex flex-col items-center gap-7 py-28 text-center @4xl:py-40")}>
        <h2 className={cn(display, "max-w-4xl text-[clamp(3rem,8cqi,7rem)] leading-[0.98] text-balance")}>{props.headline}</h2>
        {props.body && <p className="max-w-lg text-lg leading-relaxed text-pretty opacity-90">{props.body}</p>}
        <SignupForm ctx={ctx} askName={props.askName} label={props.button} note={props.note} className="mt-2 max-w-2xl text-left [&>p:last-child]:text-center" />
      </div>
    </section>
  ),
});

const faq = defineComponent({
  type: "faq",
  name: "Questions",
  description: "What people ask before they start.",
  icon: CircleHelpIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Questions" }),
    items: f.list({
      label: "Questions",
      itemLabel: "Question",
      fields: { question: f.text({ label: "Question" }), answer: f.longText({ label: "Answer" }) },
    }),
    tone: f.segmented({
      label: "Background",
      default: "light",
      options: [
        { value: "wine", label: "Wine" },
        { value: "light", label: "Cream" },
      ],
    }),
  },
  Component: ({ id, props }) => (
    <section id={id} style={toneStyle(props.tone)} className="scroll-mt-6">
      <div className={cn(wrap, "grid gap-x-10 gap-y-10 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
      {props.heading && <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.25rem)] @4xl:col-span-4")}>{props.heading}</h2>}
      <div className="flex flex-col border-t border-border @4xl:col-span-7 @4xl:col-start-6">
        {props.items.map((item, i) => (
          <details key={i} className="group border-b border-border py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-normal tracking-[-0.015em]">
              {item.question}
              <span aria-hidden className="text-2xl font-extralight opacity-70 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-2xl pt-3 leading-relaxed text-pretty opacity-75">{item.answer}</p>
          </details>
        ))}
        </div>
      </div>
    </section>
  ),
});

export const startComponents = [hero, feature, example, areas, optin, faq];
