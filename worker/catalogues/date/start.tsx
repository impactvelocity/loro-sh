/**
 * The Date catalogue's start page, set like a dating app's own: a pink
 * hero with the line in big capitals and the sign-up under it, a framed
 * photo beside it with the app's pass and like buttons on it; then
 * photo-and-words rows on their own colours; a real plan from a test run,
 * so they see what they'll get; where the dates happen, set big; a second
 * sign-up; and questions.
 *
 * In the dating app's own flow the experience is started by API after a
 * match, with both people's taste filled in. This page is for people who
 * come to it on their own, and for the demo.
 */
import { useState } from "react";
import { ArrowRightIcon, CircleHelpIcon, ClockIcon, HeartIcon, ImageIcon, MailIcon, MapPinnedIcon, PanelTopIcon, XIcon } from "lucide-react";

import { type RenderContext, defineComponent, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { CatalogueLink } from "../basic/shared";
import { cn } from "@/lib/utils";
import { Logo, SectionHead, body, button, display, displayHeadings, field, fill, framed, heart, quiet, rule, toneOptions, toneStyle, wrap } from "./shared";

export const startLayout = defineLayout({
  fields: {
    brand: f.text({ label: "App name", default: "Overlap" }),
    logo: f.image({ label: "Logo", help: "Shown instead of the name." }),
    nav: f.list({ label: "Navigation", itemLabel: "Link", max: 4, fields: { link: f.link({ label: "Link" }) } }),
    cta: f.link({ label: "Header button", default: { label: "Plan a date", href: "#start" } }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div style={fill("cream")} className={cn("flex flex-1 flex-col antialiased", body)}>
      {/* The bar in cells split by black rules, like the app's own. */}
      <header className={cn("border-b-2 bg-[var(--card)]", rule)}>
        <div className={cn(wrap, "flex h-18 items-stretch justify-between")}>
          <span className={cn("flex items-center border-r-2 pr-6 @3xl:pr-10", rule)}>
            <Logo brand={settings.brand} logo={settings.logo} className="text-[2.1rem]" />
          </span>
          <div className="flex items-stretch">
            {settings.nav.length > 0 && (
              <nav className="flex items-stretch text-[0.95rem] font-medium @max-3xl:hidden">
                {settings.nav.map(({ link }, i) => (
                  <CatalogueLink key={i} href={link.href} ctx={ctx} className={cn("flex items-center border-l-2 px-6 transition-colors hover:bg-[var(--yellow)]", rule)}>
                    {link.label}
                  </CatalogueLink>
                ))}
              </nav>
            )}
            {settings.cta.label && (
              <span className={cn("flex items-center border-l-2 pl-5", rule)}>
                <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(button, heart, "h-11 px-5 whitespace-nowrap")}>
                  {settings.cta.label}
                </CatalogueLink>
              </span>
            )}
          </div>
        </div>
      </header>
      <main className={cn("flex-1", displayHeadings)}>{children}</main>
      <footer style={fill("ink")} className="overflow-hidden">
        <div className={cn(wrap, "flex flex-col gap-10 pt-20 pb-10")}>
          <Logo brand={settings.brand} className="text-[clamp(5rem,22cqi,20rem)] leading-[0.8] whitespace-nowrap text-[var(--pink)]" />
          <div className="flex flex-col gap-3 border-t-2 border-current/25 pt-6 text-sm opacity-75 @2xl:flex-row @2xl:justify-between">
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
  const [name, setName] = useState(ctx.optin.initial?.name ?? "");
  const [email, setEmail] = useState(ctx.optin.initial?.email ?? "");
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
        <button type="submit" disabled={pending} className={cn(button, heart, "whitespace-nowrap")}>
          {pending ? "One moment…" : label}
          {!pending && <ArrowRightIcon className="size-4" />}
        </button>
      </div>
      {(errors.name || errors.email || errors.form) && (
        <p role="alert" className="text-sm font-semibold text-[var(--heart)]">
          {errors.name ?? errors.email ?? errors.form}
        </p>
      )}
      {note && <p className="text-xs opacity-70">{note}</p>}
    </form>
  );
}

/**
 * The hero: the line in big capitals on the pink with the sign-up under
 * it; beside it, a photo in a black frame with the app's pass and like
 * buttons sat on it.
 */
const hero = defineComponent({
  type: "hero",
  name: "Hero",
  description: "A big headline with the sign-up under it, and a framed photo beside it.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Headline", default: "Plan the date" }),
    body: f.longText({ label: "Under the headline" }),
    image: f.image({ label: "Photo" }),
    tone: f.segmented({ label: "Background", default: "pink", options: toneOptions }),
    signup: f.toggle({ label: "Sign-up in the hero", default: true, help: "Off: a button down to the sign-up instead." }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Sign-up button", default: "Start" }),
    note: f.text({ label: "Small print" }),
    cta: f.link({ label: "Button", default: { label: "Plan a date", href: "#join" }, help: "Shown when the sign-up isn't in the hero." }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} style={toneStyle(props.tone)} className={cn("border-b-2", rule)}>
      <div className={cn(wrap, "grid items-center gap-x-14 gap-y-12 py-14 @4xl:grid-cols-12 @4xl:py-20")}>
        <div className="flex flex-col gap-8 @4xl:col-span-7">
          <h1 className={cn(display, "text-[clamp(4rem,10.5cqi,10rem)] [line-height:0.85] text-balance")}>{props.title}</h1>
          {props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty @3xl:text-xl">{props.body}</p>}
          {props.signup ? (
            <div id="start" className="w-full max-w-2xl scroll-mt-24">
              <SignupForm ctx={ctx} askName={props.askName} label={props.button} note={props.note} />
            </div>
          ) : (
            props.cta.label && (
              <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, heart, "self-start")}>
                {props.cta.label}
              </CatalogueLink>
            )
          )}
        </div>
        {props.image && (
          <div className="relative mx-auto w-full max-w-md @4xl:col-span-5 @4xl:max-w-none">
            <img src={props.image} alt="" fetchPriority="high" className={cn(framed, "aspect-[4/5] w-full")} />
            <div aria-hidden className="absolute inset-x-0 -bottom-7 flex justify-center gap-5">
              <span className={cn("flex size-16 items-center justify-center rounded-full border-2 bg-[var(--card)]", rule)}>
                <XIcon className="size-7" strokeWidth={2.5} />
              </span>
              <span className={cn("flex size-16 items-center justify-center rounded-full border-2 bg-[var(--heart)] text-[var(--heart-foreground)]", rule)}>
                <HeartIcon className="size-7 fill-current" />
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  ),
});

/** Rows of a photo on one side, a big heading and a short paragraph on the other, each on its own colour. */
const feature = defineComponent({
  type: "feature",
  name: "Photo and Words",
  description: "A photo beside a heading and a paragraph. Alternate the side and the colour down the page.",
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
    tone: f.segmented({ label: "Background", default: "cream", options: toneOptions }),
  },
  Component: ({ id, props }) => (
    <section id={id} style={toneStyle(props.tone)} className={cn("scroll-mt-6 border-b-2", rule)}>
      <div className={cn(wrap, "grid items-center gap-x-16 gap-y-10 py-14 @4xl:grid-cols-12 @4xl:py-20")}>
        {props.image && (
          <img
            src={props.image}
            alt=""
            loading="lazy"
            className={cn(framed, "aspect-[4/3] w-full @4xl:col-span-6", props.side === "right" && "@4xl:order-2 @4xl:col-start-7")}
          />
        )}
        <div className={cn("flex flex-col gap-6 @4xl:col-span-5", props.side === "right" ? "@4xl:order-1 @4xl:col-start-1" : "@4xl:col-start-8")}>
          {props.heading && <h2 className={cn(display, "text-[clamp(3.25rem,7cqi,6.25rem)] text-balance")}>{props.heading}</h2>}
          {props.body
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="max-w-md text-lg leading-relaxed text-pretty">
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
    <section id={id} style={fill("yellow")} className={cn("border-b-2", rule)}>
      <div className={cn(wrap, "flex flex-col gap-14 py-20 @4xl:py-28")}>
        <SectionHead
          label={props.label}
          title={props.heading}
          aside={props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty">{props.body}</p>}
        />
        <ol className={cn("flex flex-col border-2 bg-[var(--card)] @4xl:ml-[25%]", rule)}>
          {props.rows.map((row, i) => (
            <li key={i} className={cn("grid items-center gap-x-8 gap-y-3 px-5 py-5 not-first:border-t-2 @3xl:grid-cols-[8.5rem_4.5rem_1fr] @3xl:px-7", rule)}>
              <span className={cn(display, "text-5xl whitespace-nowrap")}>{row.time}</span>
              {row.image ? (
                <img src={row.image} alt="" loading="lazy" className={cn(framed, "size-[4.5rem] @max-3xl:hidden")} />
              ) : (
                <span className={cn(framed, "size-[4.5rem] @max-3xl:hidden")} />
              )}
              <span className="flex min-w-0 flex-col items-start gap-1">
                <span className="text-xl font-semibold tracking-[-0.02em]">{row.place}</span>
                {row.detail && <span className={quiet}>{row.detail}</span>}
                {row.because && <span className="mt-1 rounded-full border-2 border-[var(--ink)] bg-[var(--pink)] px-2.5 py-0.5 text-xs font-medium">Because {row.because}</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center @3xl:justify-between @4xl:ml-[25%]">
          {props.note && <p className="max-w-xl text-sm opacity-75">{props.note}</p>}
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

/** Where: a small label on the left, the cities in big capitals on the right. */
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
    <section id={id} className={cn(wrap, "grid scroll-mt-6 gap-x-10 gap-y-8 py-20 @4xl:grid-cols-12 @4xl:py-28")}>
      {props.label && <p className="text-[0.95rem] font-medium opacity-80 @4xl:col-span-3 @4xl:pt-5">{props.label}</p>}
      <div className="flex flex-col @4xl:col-span-9">
        {props.items.map((item, i) => (
          <div key={i} className={cn("flex flex-col gap-2 border-b-2 py-6 first:pt-0", rule)}>
            <h2 className={cn(display, "text-[clamp(4rem,10cqi,9rem)] [line-height:0.85]")}>{item.city}</h2>
            {item.areas && <p className="text-lg">{item.areas}</p>}
          </div>
        ))}
        {props.note && <p className={cn(quiet, "mt-6 max-w-lg")}>{props.note}</p>}
      </div>
    </section>
  ),
});

/** The second sign-up: the heading big on lilac with the form under it, the photo framed beside. */
const optin = defineComponent({
  type: "optin",
  name: "Sign-Up",
  description: "A big heading with the sign-up under it, and a framed photo beside it.",
  icon: MailIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "Plan the date" }),
    body: f.longText({ label: "Intro" }),
    image: f.image({ label: "Photo" }),
    tone: f.segmented({ label: "Background", default: "lilac", options: toneOptions }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Button", default: "Start" }),
    note: f.text({ label: "Small print" }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} style={toneStyle(props.tone)} className={cn("scroll-mt-4 border-y-2", rule)}>
      <div className={cn(wrap, "grid items-center gap-x-16 gap-y-12 py-20 @4xl:grid-cols-12 @4xl:py-28")}>
        <div className="flex flex-col gap-7 @4xl:col-span-7">
          <h2 className={cn(display, "text-[clamp(4rem,10cqi,9rem)] [line-height:0.85] text-balance")}>{props.headline}</h2>
          {props.body && <p className="max-w-lg text-lg leading-relaxed text-pretty">{props.body}</p>}
          <SignupForm ctx={ctx} askName={props.askName} label={props.button} note={props.note} className="mt-2 max-w-2xl" />
        </div>
        {props.image && <img src={props.image} alt="" loading="lazy" className={cn(framed, "aspect-[4/3] w-full -rotate-2 @4xl:col-span-5")} />}
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
    tone: f.segmented({ label: "Background", default: "cream", options: toneOptions }),
  },
  Component: ({ id, props }) => (
    <section id={id} style={toneStyle(props.tone)} className="scroll-mt-6">
      <div className={cn(wrap, "grid gap-x-10 gap-y-10 py-20 @4xl:grid-cols-12 @4xl:py-28")}>
        {props.heading && <h2 className={cn(display, "text-[clamp(3.25rem,7cqi,6.25rem)] @4xl:col-span-4")}>{props.heading}</h2>}
        <div className={cn("flex flex-col border-2 bg-[var(--card)] @4xl:col-span-7 @4xl:col-start-6", rule)}>
          {props.items.map((item, i) => (
            <details key={i} className={cn("group px-5 py-4 not-first:border-t-2 open:bg-[var(--yellow)] @3xl:px-7", rule)}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold tracking-[-0.015em]">
                {item.question}
                <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xl leading-none transition-transform group-open:rotate-45", rule)}>
                  +
                </span>
              </summary>
              <p className="max-w-2xl pt-3 leading-relaxed text-pretty">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  ),
});

export const startComponents = [hero, feature, example, areas, optin, faq];
