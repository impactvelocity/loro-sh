/**
 * The Venue catalogue's start page, set like the venue's own wall: the
 * line huge over a photo printed pink, the sign-up on a ticket stub; the
 * month's shows as flyers taped up in a row; photo-and-words rows that
 * swap sides; a real run's picks on a setlist; the house in numbers; a
 * second sign-up on a field of pink into orange into yellow; questions.
 *
 * In the venue's own flow the experience is started by API, from the box
 * office, with what someone's bought here before. This page is for people
 * who come on their own, and for the demo.
 */
import { useMemo, useState } from "react";
import { ArrowRightIcon, CalendarDaysIcon, CircleHelpIcon, HashIcon, ImageIcon, ListMusicIcon, MailIcon, PanelTopIcon } from "lucide-react";

import { type RenderContext, defineComponent, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { CatalogueLink } from "../basic/shared";
import { cn } from "@/lib/utils";
import { type EventKind, clock, dateLabel, demoProgramme, eventKinds, eventStatuses, localToday, price, qlooImage } from "./programme";
import {
  Accent,
  Backdrop,
  DateStamp,
  Duotone,
  Grain,
  Logo,
  Seal,
  SectionHead,
  Tape,
  body,
  button,
  display,
  displayHeadings,
  ghost,
  inks,
  mono,
  pick,
  quiet,
  tilt,
  torn,
  wrap,
} from "./shared";

export const startLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Venue name", default: "The Wren" }),
    logo: f.image({ label: "Logo", help: "Shown instead of the name." }),
    nav: f.list({ label: "Navigation", itemLabel: "Link", max: 4, fields: { link: f.link({ label: "Link" }) } }),
    cta: f.link({ label: "Header button", default: { label: "Find my nights", href: "#start" } }),
    address: f.longText({ label: "Address" }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div className={cn("relative isolate flex flex-1 flex-col bg-background text-foreground antialiased", body)}>
      {/* Over the hero, which pulls itself up under it. */}
      <header className="relative z-20">
        <div className={cn(wrap, "flex h-20 items-center justify-between gap-6")}>
          <Logo brand={settings.brand} logo={settings.logo} className="text-[2rem]" />
          <div className="flex items-center gap-8">
            {settings.nav.length > 0 && (
              <nav className={cn(mono, "flex items-center gap-7 text-[0.8rem] @max-3xl:hidden")}>
                {settings.nav.map(({ link }, i) => (
                  <CatalogueLink key={i} href={link.href} ctx={ctx} className="opacity-75 underline-offset-4 transition-opacity hover:text-[var(--hot)] hover:underline hover:opacity-100">
                    {link.label}
                  </CatalogueLink>
                ))}
              </nav>
            )}
            {settings.cta.label && (
              <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(button, "h-10 px-4 text-[1.05rem] whitespace-nowrap")}>
                {settings.cta.label}
              </CatalogueLink>
            )}
          </div>
        </div>
      </header>
      <main className={cn("flex-1", displayHeadings)}>{children}</main>
      <footer className="relative isolate overflow-hidden bg-[var(--deep)] text-[var(--paper)]">
        <div aria-hidden className="gig-dust absolute inset-0 -z-10 opacity-40" />
        <div className={cn(wrap, "flex flex-col gap-12 pt-24 pb-10")}>
          <Logo brand={settings.brand} className="gig-worn text-[clamp(4.5rem,19cqi,17rem)] [line-height:0.8] whitespace-nowrap text-[var(--hot)]" />
          <div className={cn(mono, "grid gap-8 border-t-2 border-dashed border-current/20 pt-6 text-[0.8rem] @2xl:grid-cols-3")}>
            {settings.address && <p className="leading-relaxed whitespace-pre-line opacity-75">{settings.address}</p>}
            {settings.footer && <p className="leading-relaxed opacity-75">{settings.footer}</p>}
            <p className="opacity-75 @2xl:text-right">Shows ranked for you by Qloo, a taste engine</p>
          </div>
        </div>
      </footer>
      <Grain />
    </div>
  ),
});

/** Where the stub's perforation sits, and the notches cut at its ends. */
const STUB = "3rem";
const notched = {
  WebkitMask: `radial-gradient(circle 11px at ${STUB} 0, #0000 97%, #000) top / 100% 51% no-repeat, radial-gradient(circle 11px at ${STUB} 100%, #0000 97%, #000) bottom / 100% 51% no-repeat`,
  mask: `radial-gradient(circle 11px at ${STUB} 0, #0000 97%, #000) top / 100% 51% no-repeat, radial-gradient(circle 11px at ${STUB} 100%, #0000 97%, #000) bottom / 100% 51% no-repeat`,
};

/** A field on the ticket: ink on paper, a line under it. */
const ticketField = cn(
  "h-12 w-full border-0 border-b-2 border-[var(--ink)]/25 bg-transparent px-0 text-base text-[var(--ink)] outline-none transition-colors",
  "placeholder:text-[var(--ink)]/45 focus:border-[var(--hot)] aria-invalid:border-red-600",
);

/**
 * The sign-up, printed on a ticket stub: name and email in one row, then
 * on to the questions. Errors show only on the form that was sent, since
 * the hero and the lower sign-up share one sign-up.
 */
function Ticket({ ctx, askName, label, note, stub, className }: { ctx: RenderContext; askName: boolean; label: string; note: string; stub: string; className?: string }) {
  const [name, setName] = useState(ctx.optin.initial?.name ?? "");
  const [email, setEmail] = useState(ctx.optin.initial?.email ?? "");
  const [sent, setSent] = useState(false);
  const { pending } = ctx.optin;
  const errors = sent ? ctx.optin.errors : {};
  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <form
        noValidate
        style={notched}
        className="relative grid grid-cols-[3rem_1fr] bg-[var(--paper)] text-[var(--ink)] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)]"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(true);
          ctx.optin.submit({ name, email });
        }}
      >
        <div aria-hidden className="gig-ink pointer-events-none absolute inset-0 opacity-35" />
        <span aria-hidden className={cn(mono, "flex items-center justify-center border-r-2 border-dashed border-[var(--ink)]/30 text-[0.65rem] font-bold tracking-[0.2em] uppercase [writing-mode:vertical-rl] rotate-180")}>
          {stub}
        </span>
        <div className="flex flex-col gap-3 px-5 py-4 @2xl:px-6">
          <div className={cn("grid items-end gap-x-4 gap-y-2", askName ? "@2xl:grid-cols-[1fr_1.4fr_auto]" : "@2xl:grid-cols-[1fr_auto]")}>
            {askName && (
              <label className="flex flex-col">
                <span className="sr-only">First name</span>
                <input
                  className={ticketField}
                  autoComplete="given-name"
                  placeholder="First name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
              </label>
            )}
            <label className="flex flex-col">
              <span className="sr-only">Email</span>
              <input
                className={ticketField}
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
            </label>
            <button type="submit" disabled={pending} className={cn(button, "mt-3 whitespace-nowrap @2xl:mt-0")}>
              {pending ? "One moment…" : label}
              {!pending && <ArrowRightIcon className="size-4" strokeWidth={2.5} />}
            </button>
          </div>
          {(errors.name || errors.email || errors.form) && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {errors.name ?? errors.email ?? errors.form}
            </p>
          )}
        </div>
      </form>
      {note && <p className={cn(mono, "text-[0.72rem] opacity-70")}>{note}</p>}
    </div>
  );
}

/** The line huge over the house printed pink, the sign-up on a ticket stub beside it. */
const hero = defineComponent({
  type: "hero",
  name: "Hero",
  description: "The line huge over a full-bleed photo printed in pink, with the sign-up on a ticket stub.",
  icon: PanelTopIcon,
  fields: {
    title: f.text({ label: "Headline", default: "Your month at The Wren" }),
    body: f.longText({ label: "Under the headline" }),
    image: f.image({ label: "Photo" }),
    signup: f.toggle({ label: "Sign-up in the hero", default: true, help: "Off: a button down to the sign-up instead." }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Sign-up button", default: "Start" }),
    note: f.text({ label: "Small print" }),
    stamp: f.text({ label: "Round stamp", default: "The Wren · Main Street · Vancouver", help: "Runs round the stamp. Empty to leave it off." }),
    mark: f.text({ label: "In the stamp", default: "1931" }),
    cta: f.link({ label: "Button", default: { label: "Find my nights", href: "#join" }, help: "Shown when the sign-up isn't in the hero." }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className="relative isolate -mt-20 overflow-hidden">
      <Backdrop image={props.image} />
      <div className={cn(wrap, "relative flex min-h-[min(96svh,64rem)] flex-col justify-end gap-10 pt-36 pb-16 @4xl:pb-24")}>
        {props.stamp && <Seal text={props.stamp} mark={props.mark} className="absolute top-28 right-10 size-32 @max-3xl:hidden @4xl:size-40 @6xl:right-16" />}
        <h1 className={cn(display, "gig-worn max-w-[13ch] text-[clamp(4.25rem,15.5cqi,14.5rem)] font-black [line-height:0.8] text-balance")}>
          <Accent text={props.title} />
        </h1>
        <div className="grid items-end gap-x-12 gap-y-8 @4xl:grid-cols-12">
          {props.body && <p className="max-w-md text-lg leading-relaxed text-pretty @4xl:col-span-4 @3xl:text-xl">{props.body}</p>}
          {props.signup ? (
            <div id="start" className="scroll-mt-24 @4xl:col-span-8 @4xl:col-start-5 @6xl:col-span-7 @6xl:col-start-6">
              <Ticket ctx={ctx} askName={props.askName} label={props.button} note={props.note} stub="Admit one" />
            </div>
          ) : (
            props.cta.label && (
              <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "self-start")}>
                {props.cta.label}
              </CatalogueLink>
            )
          )}
        </div>
      </div>
    </section>
  ),
});

/** A flyer from the month, taped up: the subject printed in one ink, a date sticker, what it is and when. */
function Flyer({ event }: { event: ReturnType<typeof demoProgramme>[number] }) {
  const turn = tilt(event.id, 1.6);
  return (
    <article className="group relative flex flex-col gap-4 transition-[rotate] duration-300 hover:rotate-0" style={{ rotate: `${turn}deg` }}>
      <Tape className="-top-3 left-1/2 -translate-x-1/2" turn={tilt(`${event.id}:tape`, 5)} />
      <div className="relative">
        <Duotone src={qlooImage(event.qloo, 640)} ink={pick(event.id, inks)} reveal className="aspect-[4/5] w-full" />
        <DateStamp date={event.date} className="absolute top-3 right-3" />
        {event.status !== "on-sale" && (
          <span className={cn(mono, "absolute bottom-3 left-3 bg-[var(--ink)] px-2 py-1 text-[0.7rem] text-[var(--paper)]")}>{eventStatuses[event.status]}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className={cn(mono, "text-[0.72rem] text-[var(--hot)]")}>{eventKinds[event.kind].one}</span>
        <h3 className={cn(display, "text-[2.4rem] [line-height:0.88] text-balance")}>{event.title}</h3>
        <p className={cn(mono, "text-[0.75rem] text-muted-foreground")}>
          {dateLabel(event.date, true)} · {clock(event.start)} · {price(event)}
        </p>
      </div>
    </article>
  );
}

/**
 * The month on the wall: the demo programme from today, as flyers, with
 * the kinds of night to filter by. The same shows the What's On step ranks.
 */
const whatson = defineComponent({
  type: "whatson",
  name: "What's On",
  description: "The month's shows as flyers taped to the wall, from the demo programme, with a filter by kind of night.",
  icon: CalendarDaysIcon,
  fields: {
    label: f.text({ label: "Beside the heading", placeholder: "What's on" }),
    heading: f.text({ label: "Heading", default: "The next four weeks" }),
    body: f.longText({ label: "Intro" }),
    count: f.number({ label: "Flyers before More", default: 8, min: 4, max: 30 }),
    timeZone: f.text({ label: "Time zone", default: "America/Vancouver", help: "So the month starts tomorrow where the venue is." }),
    cta: f.link({ label: "Button", default: { label: "Find mine", href: "#join" } }),
  },
  Component: ({ id, props, ctx }) => {
    const events = useMemo(() => demoProgramme(localToday(props.timeZone || "America/Vancouver")), [props.timeZone]);
    const [kind, setKind] = useState<EventKind | null>(null);
    const [all, setAll] = useState(false);
    const kinds = [...new Set(events.map((event) => event.kind))];
    const shown = events.filter((event) => !kind || event.kind === kind);
    const visible = all ? shown : shown.slice(0, props.count);
    return (
      <section id={id} className="scroll-mt-6">
        <div className={cn(wrap, "flex flex-col gap-12 py-24 @4xl:py-32")}>
          <SectionHead
            label={props.label}
            title={props.heading}
            aside={props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty opacity-80">{props.body}</p>}
          />
          <div className={cn(mono, "flex flex-wrap gap-2 @4xl:ml-[25%]")} role="group" aria-label="Kinds of night">
            {[null, ...kinds].map((value) => {
              const on = kind === value;
              return (
                <button
                  key={value ?? "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setKind(value)}
                  className={cn(
                    "h-9 px-3.5 text-[0.78rem] ring-2 transition-colors ring-inset",
                    on ? "bg-[var(--hot)] text-[var(--ink)] ring-[var(--hot)]" : "ring-foreground/20 hover:ring-foreground/60",
                  )}
                >
                  {value ? eventKinds[value].label : `Everything, ${events.length}`}
                </button>
              );
            })}
          </div>
          <div className="grid gap-x-7 gap-y-16 pt-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
            {visible.map((event) => (
              <Flyer key={event.id} event={event} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {shown.length > visible.length && (
              <button type="button" onClick={() => setAll(true)} className={ghost}>
                {shown.length - visible.length} more this month
              </button>
            )}
            {props.cta.label && (
              <CatalogueLink href={props.cta.href} ctx={ctx} className={button}>
                {props.cta.label}
                <ArrowRightIcon className="size-4" strokeWidth={2.5} />
              </CatalogueLink>
            )}
          </div>
        </div>
      </section>
    );
  },
});

/** A photo on one side, pasted up and taped; a big heading and a short paragraph on the other. */
const feature = defineComponent({
  type: "feature",
  name: "Photo and Words",
  description: "A photo printed in one ink beside a heading and a paragraph. Alternate the side down the page.",
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
  },
  Component: ({ id, props }) => (
    <section id={id} className="scroll-mt-6">
      <div className={cn(wrap, "grid items-center gap-x-16 gap-y-12 py-14 @4xl:grid-cols-12 @4xl:py-20")}>
        {props.image && (
          <div
            className={cn("group relative @4xl:col-span-6", props.side === "right" && "@4xl:order-2 @4xl:col-start-7")}
            style={{ rotate: `${tilt(id, 1.4)}deg` }}
          >
            <Tape className="-top-3 left-6" turn={-6} />
            <Tape className="-top-3 right-6" turn={5} />
            <Duotone src={props.image} ink={pick(id, inks)} reveal className="aspect-[4/3] w-full" />
          </div>
        )}
        <div className={cn("flex flex-col gap-6 @4xl:col-span-5", props.side === "right" ? "@4xl:order-1 @4xl:col-start-1" : "@4xl:col-start-8")}>
          {props.heading && <h2 className={cn(display, "gig-worn text-[clamp(3.25rem,7.5cqi,6.75rem)] text-balance")}>{props.heading}</h2>}
          {props.body
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="max-w-md text-lg leading-relaxed text-pretty opacity-85">
                {paragraph}
              </p>
            ))}
        </div>
      </div>
    </section>
  ),
});

/**
 * A real run's picks, so people see what they'll get before they start,
 * written up like a setlist taped to the stage: the night, the show and
 * the favourite it came from. The rows come from a test run, so the
 * example is true.
 */
const example = defineComponent({
  type: "example",
  name: "Example Picks",
  description: "Picks from a real run on a taped-up setlist: the night, the show and the favourite each one came from.",
  icon: ListMusicIcon,
  fields: {
    label: f.text({ label: "Beside the heading", placeholder: "An example" }),
    heading: f.text({ label: "Heading", default: "Picked for a Khruangbin fan" }),
    body: f.longText({ label: "Intro" }),
    rows: f.list({
      label: "Picks",
      itemLabel: "Pick",
      max: 6,
      fields: {
        night: f.text({ label: "Night", placeholder: "Thursday" }),
        title: f.text({ label: "Show", placeholder: "Hermanos Gutiérrez" }),
        detail: f.text({ label: "Detail", placeholder: "Gig · seated · $45" }),
        because: f.text({ label: "Because", placeholder: "you play Khruangbin" }),
        image: f.image({ label: "Photo" }),
      },
    }),
    note: f.text({ label: "Small print" }),
    cta: f.link({ label: "Button", default: { label: "Find yours", href: "#join" } }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className="relative isolate overflow-hidden bg-[var(--deep)] text-[var(--paper)]">
      <div aria-hidden className="gig-dust absolute inset-0 -z-10 opacity-50" />
      <div className={cn(wrap, "grid gap-x-12 gap-y-14 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
        <div className="flex flex-col gap-6 @4xl:col-span-5">
          {props.label && <p className={cn(mono, "text-[0.8rem] opacity-60")}>{props.label}</p>}
          <h2 className={cn(display, "gig-worn text-[clamp(3.25rem,7cqi,6.5rem)] text-balance")}>{props.heading}</h2>
          {props.body && <p className="max-w-md text-lg leading-relaxed text-pretty opacity-80">{props.body}</p>}
          {props.cta.label && (
            <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "mt-2 self-start")}>
              {props.cta.label}
              <ArrowRightIcon className="size-4" strokeWidth={2.5} />
            </CatalogueLink>
          )}
        </div>
        <div className="relative @4xl:col-span-7" style={{ rotate: "-1.2deg" }}>
          <Tape className="-top-3 left-10" turn={-4} />
          <Tape className="-top-3 right-12" turn={7} />
          <div className="relative isolate bg-[var(--paper)] px-5 pt-8 pb-12 text-[var(--ink)] @2xl:px-9" style={torn("bottom", 3, 14)}>
            <div aria-hidden className="gig-ink absolute inset-0 -z-10 opacity-60" />
            <ol className="flex flex-col">
              {props.rows.map((row, i) => (
                <li key={i} className="grid items-center gap-x-5 gap-y-2 border-b-2 border-[var(--ink)]/15 py-5 last:border-b-0 @2xl:grid-cols-[4.5rem_1fr]">
                  {row.image ? (
                    <Duotone src={row.image} ink={inks[i % inks.length]} className="size-[4.5rem] @max-2xl:hidden" />
                  ) : (
                    <span className="size-[4.5rem] bg-[var(--ink)]/10 @max-2xl:hidden" />
                  )}
                  <span className="flex min-w-0 flex-col gap-1.5">
                    <span className={cn(mono, "text-[0.75rem] font-bold text-[var(--hot)]")}>{row.night}</span>
                    <span className={cn(display, "text-[clamp(2rem,4.4cqi,3rem)] [line-height:0.9]")}>{row.title}</span>
                    {row.detail && <span className={cn(mono, "text-[0.75rem] opacity-70")}>{row.detail}</span>}
                    {row.because && <span className="text-[0.95rem] font-medium">Because {row.because}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          {props.note && <p className={cn(mono, "mt-6 text-[0.72rem] opacity-60")}>{props.note}</p>}
        </div>
      </div>
    </section>
  ),
});

/** The house in numbers, set huge in outline, filling pink on hover. */
const facts = defineComponent({
  type: "facts",
  name: "The House",
  description: "A few numbers about the venue, set huge in outline, with a line under each.",
  icon: HashIcon,
  fields: {
    label: f.text({ label: "Label", default: "The house" }),
    items: f.list({
      label: "Numbers",
      itemLabel: "Number",
      max: 4,
      fields: { value: f.text({ label: "Number", placeholder: "1931" }), label: f.text({ label: "Under it", placeholder: "Built as a picture house" }) },
    }),
    note: f.longText({ label: "Small print" }),
  },
  Component: ({ id, props }) => (
    <section id={id} className={cn(wrap, "grid scroll-mt-6 gap-x-10 gap-y-10 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
      {props.label && <p className={cn(mono, "text-[0.8rem] text-muted-foreground @4xl:col-span-3 @4xl:pt-5")}>{props.label}</p>}
      <div className="flex flex-col gap-10 @4xl:col-span-9">
        <dl className="grid gap-x-10 gap-y-12 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {props.items.map((item, i) => (
            <div key={i} className="group flex flex-col gap-3">
              <dt
                className={cn(
                  display,
                  "order-1 text-[clamp(5rem,10cqi,9rem)] font-black [line-height:0.8] text-transparent [-webkit-text-stroke:2px_var(--paper)] transition-colors group-hover:text-[var(--hot)] group-hover:[-webkit-text-stroke-color:var(--hot)]",
                )}
              >
                {item.value}
              </dt>
              <dd className={cn(mono, "order-2 max-w-[22ch] text-[0.85rem] opacity-80")}>{item.label}</dd>
            </div>
          ))}
        </dl>
        {props.note && <p className={cn(quiet, "max-w-lg")}>{props.note}</p>}
      </div>
    </section>
  ),
});

/** The lower sign-up: a field of pink into orange into yellow, specked like an old print, torn top and bottom, the ticket on it. */
const optin = defineComponent({
  type: "optin",
  name: "Sign-Up",
  description: "A heading on a speckled field of pink into orange into yellow with torn edges, and the sign-up ticket under it.",
  icon: MailIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "Find my nights" }),
    body: f.longText({ label: "Intro" }),
    image: f.image({ label: "Photo", help: "Printed faintly into the field." }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Button", default: "Start" }),
    note: f.text({ label: "Small print" }),
  },
  Component: ({ id, props, ctx }) => (
    <section
      id={id}
      className="relative isolate scroll-mt-4 overflow-hidden bg-linear-175 from-[var(--hot)] from-15% via-[var(--flare)] via-75% to-[var(--acid)] text-[var(--ink)]"
      style={torn("both", 7, 16)}
    >
      {props.image && <img src={props.image} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover opacity-15 mix-blend-multiply grayscale" />}
      <div aria-hidden className="gig-ink absolute inset-0 -z-10" />
      <div className={cn(wrap, "flex flex-col items-center gap-7 py-32 text-center @4xl:py-44")}>
        <h2 className={cn(display, "gig-worn max-w-5xl text-[clamp(4rem,12cqi,11rem)] font-black [line-height:0.82] text-balance")}>{props.headline}</h2>
        {props.body && <p className="max-w-lg text-lg leading-relaxed font-medium text-pretty">{props.body}</p>}
        <Ticket
          ctx={ctx}
          askName={props.askName}
          label={props.button}
          note={props.note}
          stub="Admit one"
          className="mt-3 max-w-2xl text-left [&>p:last-child]:text-center [&>p:last-child]:opacity-80"
        />
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
  },
  Component: ({ id, props }) => (
    <section id={id} className="scroll-mt-6">
      <div className={cn(wrap, "grid gap-x-10 gap-y-10 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
        {props.heading && <h2 className={cn(display, "gig-worn text-[clamp(3.25rem,7cqi,6.5rem)] @4xl:col-span-4")}>{props.heading}</h2>}
        <div className="flex flex-col border-t-2 border-foreground/15 @4xl:col-span-7 @4xl:col-start-6">
          {props.items.map((item, i) => (
            <details key={i} className="group border-b-2 border-foreground/15 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium tracking-[-0.015em] transition-colors hover:text-[var(--hot)]">
                {item.question}
                <span aria-hidden className={cn(display, "text-4xl text-[var(--hot)] transition-transform group-open:rotate-45")}>
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

export const startComponents = [hero, whatson, feature, example, facts, optin, faq];
