/**
 * The festival's start page, set like an editorial poster:
 *
 * - Poster: the name in big serif over the sunset, the dates and place,
 *   and the sign-up right there in the hero, so nobody scrolls to start.
 *   The headliners follow on the night band.
 * - Lineup: each day as a row, the day on the left and the bill in
 *   descending type, or set times by stage. The guide's step reads it.
 * - Know Before You Go, How It Works and Questions: hairlines, no boxes.
 * - Sign-Up: the second chance, further down, on a desert photo at dusk.
 * - Ticket Strip: a line of italic serif sliding by.
 * - Countdown: the days left until the gates open, on a field of the accent.
 *
 * Every section takes its block id as its anchor, so the nav's #lineup works.
 */
import { useState } from "react";
import { ArrowRightIcon, CalendarDaysIcon, HourglassIcon, InfoIcon, MailIcon, SunIcon, TicketIcon } from "lucide-react";

import { defineComponent, defineLayout, type ComponentProps, type RenderContext } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { startComponents as basicStart } from "../basic/start";
import { CatalogueLink, brandStyle } from "../basic/shared";
import { type LineupSet, byTime, clock, lineupFields, stageColor } from "./lineup";
import {
  Accent,
  ActArt,
  Logo,
  Backdrop,
  Contours,
  SectionHead,
  Stage,
  night,
  pill,
  poster,
  posterHeadings,
  quiet,
  restyle,
  sky,
  wrap,
} from "./shared";

export const startLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Festival name", default: "Mirage Valley" }),
    logo: f.image({ label: "Logo", help: "Shown instead of the name." }),
    accent: f.color({ label: "Accent", default: "#e0603a" }),
    nav: f.list({ label: "Navigation", itemLabel: "Link", max: 4, fields: { link: f.link({ label: "Link" }) } }),
    cta: f.link({ label: "Header button", default: { label: "Plan my weekend", href: "#start" } }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground antialiased">
      <header style={{ background: "var(--sky-1)", color: "var(--sky-foreground)" }}>
        <div className={cn(wrap, "flex h-18 items-center justify-between gap-6")}>
          <Logo brand={settings.brand} logo={settings.logo} className="text-xl" />
          <div className="flex items-center gap-8">
            {settings.nav.length > 0 && (
              <nav className="flex items-center gap-7 text-sm @max-3xl:hidden">
                {settings.nav.map(({ link }, i) => (
                  <CatalogueLink key={i} href={link.href} ctx={ctx} className="opacity-70 transition-opacity hover:opacity-100">
                    {link.label}
                  </CatalogueLink>
                ))}
              </nav>
            )}
            {settings.cta.label && (
              <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(pill, "h-10 px-5 text-sm whitespace-nowrap")}>
                {settings.cta.label}
              </CatalogueLink>
            )}
          </div>
        </div>
      </header>
      <main className={cn("flex-1", posterHeadings)}>{children}</main>
      <footer style={night} className="overflow-hidden">
        <div className={cn(wrap, "flex flex-col gap-10 pt-20 pb-10")}>
          <Logo brand={settings.brand} sun={false} className="text-[clamp(3rem,10cqi,9rem)] whitespace-nowrap" />
          <div className="flex flex-col gap-3 border-t border-current/15 pt-6 text-sm opacity-70 @2xl:flex-row @2xl:justify-between">
            {settings.footer && <span>{settings.footer}</span>}
            <span>Matched to your taste by Qloo</span>
          </div>
        </div>
      </footer>
    </div>
  ),
});

const field = cn(
  "h-12 w-full rounded-full border border-input bg-background/70 px-5 text-base outline-none transition-colors",
  "placeholder:text-muted-foreground/70 focus-visible:border-[var(--brand)] focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20 aria-invalid:border-red-600",
);

/**
 * Name and email, then on to the questions. Errors show only on the form
 * that was sent, since the hero and the lower sign-up share one sign-up.
 */
function SignupForm({
  ctx,
  title,
  body,
  askName,
  button,
  note,
  className,
}: {
  ctx: RenderContext;
  title: string;
  body: string;
  askName: boolean;
  button: string;
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
      className={cn(
        "relative isolate flex flex-col gap-5 overflow-hidden rounded-[calc(var(--radius)*2)] bg-card p-7 text-foreground shadow-[0_30px_80px_-30px_oklch(0.2_0.08_330/0.55)] ring-1 ring-black/5 @2xl:p-9",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
        ctx.optin.submit({ name, email });
      }}
    >
      <Contours />
      {(title || body) && (
        <div className="flex flex-col gap-2.5">
          {/* h3: the layout sets every h2 in serif, and the form's title stays in Inter. */}
          {title && <h3 className="text-2xl font-semibold tracking-[-0.02em] text-balance">{title}</h3>}
          {body && <p className="text-[0.95rem] leading-relaxed text-muted-foreground text-pretty">{body}</p>}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {askName && (
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Name</span>
            <input
              className={field}
              autoComplete="name"
              placeholder="First name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className="px-5 text-sm text-red-700">{errors.name}</span>}
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
          {errors.email && <span className="px-5 text-sm text-red-700">{errors.email}</span>}
        </label>
      </div>
      <button type="submit" disabled={pending} className={cn(pill, "w-full")}>
        {pending ? "One moment…" : button}
        {!pending && <ArrowRightIcon className="size-4" />}
      </button>
      {errors.form && (
        <p role="alert" className="text-center text-sm text-red-700">
          {errors.form}
        </p>
      )}
      {note && <p className="text-center text-xs text-muted-foreground">{note}</p>}
    </form>
  );
}

/** Each headliner's tilt and the colour of the card behind them, in turn, like posters on a wall. */
const pasted = [
  { tilt: "-rotate-[1.6deg]", back: "var(--sun)" },
  { tilt: "rotate-[1.2deg]", back: "var(--brand)" },
  { tilt: "-rotate-[0.8deg]", back: "var(--sky-2)" },
];

/**
 * A headliner's photo, tall, pasted up like a poster: a sand border, a
 * block of colour offset behind, tilted a little. The photo is toned to
 * the sunset and comes into full colour (and straightens) on hover. Their
 * night sits on it as a sticker. Their initials if there's no photo.
 */
function Portrait({ src, name, when, index }: { src: string; name: string; when: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const box = "aspect-[4/5] w-full rounded-[calc(var(--radius)*1.6)]";
  const { tilt, back } = pasted[index % pasted.length];
  return (
    <div className={cn("group relative transition-transform duration-200 ease-out hover:-translate-y-1.5 hover:rotate-0 motion-reduce:transition-none", tilt)}>
      <div
        aria-hidden
        className={cn(box, "absolute inset-0 translate-x-3 translate-y-3 transition-transform duration-200 group-hover:translate-x-4 group-hover:translate-y-4")}
        style={{ background: back }}
      />
      {src && !failed ? (
        <div className={cn(box, "relative overflow-hidden bg-[var(--sky-1)] shadow-2xl ring-[6px] ring-[var(--plum-foreground)]")}>
          <img
            src={src}
            alt={name}
            onError={() => setFailed(true)}
            className="size-full object-cover grayscale contrast-110 transition-[filter,scale] duration-300 group-hover:scale-[1.04] group-hover:grayscale-0"
          />
          {/* Toned to the sunset (the photo's light, the sky's colour) until hover. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-b from-[var(--sky-4)] via-[var(--sky-3)] to-[var(--sky-1)] mix-blend-color transition-opacity duration-300 group-hover:opacity-0"
          />
          {/* A dusk wash from below, and a sheen across the top corner. */}
          <div aria-hidden className="absolute inset-0 bg-linear-to-t from-[var(--plum)]/50 via-transparent to-transparent mix-blend-multiply" />
          <div aria-hidden className="absolute inset-0 bg-linear-to-br from-white/25 via-transparent to-transparent" />
        </div>
      ) : (
        <ActArt name={name} image={null} color="var(--sky-3)" className={cn(box, "relative text-6xl ring-[6px] ring-[var(--plum-foreground)]")} />
      )}
      {when && (
        <span className="absolute top-5 left-5 rotate-[-4deg] rounded-full bg-[var(--sun)] px-3.5 py-1.5 text-sm font-semibold text-[var(--plum)] shadow-lg">
          {when}
        </span>
      )}
    </div>
  );
}

/** The poster: the name over the sunset, with the sign-up in the hero and the headliners below. */
const hero = defineComponent({
  type: "poster",
  name: "Festival Poster",
  description: "Name, dates and the sign-up over a desert sunset, then the headliners.",
  icon: SunIcon,
  fields: {
    name: f.text({ label: "Name", default: "Mirage Valley" }),
    subtitle: f.text({ label: "Subtitle", default: "Music & Arts Festival" }),
    dates: f.text({ label: "Dates", placeholder: "April 16–18, 2027" }),
    place: f.text({ label: "Where", placeholder: "Indio, California" }),
    image: f.image({ label: "Photo", help: "Faded into the sky behind the name." }),
    headliners: f.list({
      label: "Headliners",
      itemLabel: "Headliner",
      max: 6,
      fields: { name: f.text({ label: "Name" }), image: f.image({ label: "Photo" }), when: f.text({ label: "When", placeholder: "Friday night" }) },
    }),
    body: f.longText({ label: "Intro" }),
    signup: f.toggle({ label: "Sign-up in the hero", default: true, help: "Off: a button down to the sign-up instead." }),
    formTitle: f.text({ label: "Sign-up heading", default: "Plan your weekend" }),
    formBody: f.longText({ label: "Sign-up intro" }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Sign-up button", default: "Start" }),
    note: f.text({ label: "Small print", default: "We'll only email you about this." }),
    cta: f.link({ label: "Button", default: { label: "Plan my weekend", href: "#join" }, help: "Shown when the sign-up isn't in the hero." }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} style={night}>
      <div className="relative isolate overflow-hidden" style={sky}>
        {/* The photo, then the night coming up from below. */}
        <Backdrop src={props.image} night long />
        <div className={cn(wrap, "grid gap-12 pt-14 pb-56 @3xl:pt-20 @5xl:grid-cols-12 @5xl:items-center @5xl:gap-16 @5xl:pt-24 @5xl:pb-64")}>
          <div className="flex flex-col gap-8 @5xl:col-span-7">
            <h1 className={cn(poster, "text-[clamp(4.5rem,13cqi,11.5rem)] leading-[0.82] text-balance")}>
              <Accent text={props.name} />
            </h1>
            <div className="flex flex-col gap-2">
              {props.subtitle && <p className="text-xl font-medium opacity-90 @3xl:text-2xl">{props.subtitle}</p>}
              {(props.dates || props.place) && (
                <p className="text-lg opacity-85">{[props.dates, props.place].filter(Boolean).join(" · ")}</p>
              )}
            </div>
            {props.body && <p className="max-w-lg text-lg leading-relaxed text-pretty opacity-85">{props.body}</p>}
            {!props.signup && props.cta.label && (
              <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(pill, "h-14 self-start px-8 text-base")}>
                {props.cta.label}
                <ArrowRightIcon className="size-4" />
              </CatalogueLink>
            )}
          </div>
          {props.signup && (
            <div id="start" className="scroll-mt-6 @5xl:col-span-5 @5xl:col-start-8">
              <SignupForm
                ctx={ctx}
                title={props.formTitle}
                body={props.formBody}
                askName={props.askName}
                button={props.button}
                note={props.note}
                className="mx-auto max-w-md @5xl:mr-0"
              />
            </div>
          )}
        </div>
      </div>
      {props.headliners.length > 0 && (
        <div className={cn(wrap, "py-14 @4xl:py-20", props.headliners.some((item) => item.image) && "relative z-10 -mt-16 pt-0 @4xl:-mt-24 @4xl:pt-0")}>
          {props.headliners.some((item) => item.image) ? (
            <ul className="grid gap-x-10 gap-y-14 @2xl:grid-cols-3">
              {props.headliners.map((item, i) => (
                <li key={i} className="flex flex-col gap-7">
                  <Portrait src={item.image} name={item.name} when={item.when} index={i} />
                  <span className={cn("text-xl font-semibold tracking-[-0.02em] @3xl:text-2xl", i % 2 === 1 && "text-[var(--sun)]")}>
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn(poster, "flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[clamp(2.25rem,5cqi,4.5rem)]")}>
              {props.headliners.map((item, i) => (
                <span key={i} className="whitespace-nowrap">
                  <span className={cn(i % 2 === 1 && "text-[var(--sun)] italic")}>{item.name}</span>
                  {i < props.headliners.length - 1 && <span className="pl-5 text-[0.5em] opacity-40">✶</span>}
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </section>
  ),
});

const tiers = {
  top: "text-[clamp(3rem,7.5cqi,7rem)] leading-[0.9]",
  mid: "text-[clamp(1.6rem,3.4cqi,3rem)] leading-[1.3] tracking-[-0.004em]",
  low: "font-sans text-[1.05rem] leading-[1.9]",
} as const;

/** The bill as a poster: a row per day, the day on the left, the acts in descending type. */
function PosterView({ days, sets }: { days: { name: string; date: string }[]; sets: LineupSet[] }) {
  return (
    <div className="flex flex-col">
      {days.map((day) => {
        const today = sets.filter((set) => set.day === day.name);
        return (
          <div key={day.name} className="grid gap-x-10 gap-y-6 border-t border-current/15 py-12 @4xl:grid-cols-12 @4xl:py-16">
            <div className="flex items-baseline gap-3 @4xl:col-span-3 @4xl:flex-col @4xl:gap-1">
              <span className="text-xl font-semibold tracking-[-0.02em]">{day.name}</span>
              {day.date && <span className={quiet}>{day.date}</span>}
            </div>
            <div className="flex flex-col gap-6 @4xl:col-span-9">
              {(["top", "mid", "low"] as const).map((tier) => {
                const names = today.filter((set) => set.billing === tier);
                if (!names.length) return null;
                return (
                  <p key={tier} className={cn(tier !== "low" && poster, tiers[tier], tier === "low" && "opacity-65")}>
                    {names.map((set, i) => (
                      <span key={set.artist}>
                        {/* A name never breaks across lines; the list breaks between names. */}
                        <span className={cn("whitespace-nowrap", tier === "mid" && i % 3 === 1 && "text-[var(--sun)] italic")}>
                          {set.artist}
                        </span>
                        {i < names.length - 1 && <span className="opacity-40">{tier === "low" ? "  ·  " : ", "}</span>}
                      </span>
                    ))}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The bill by stage, one day at a time. */
function TimesView({
  days,
  stages,
  sets,
}: {
  days: { name: string; date: string }[];
  stages: { name: string; color: string }[];
  sets: LineupSet[];
}) {
  const [day, setDay] = useState(days[0]?.name ?? "");
  const today = sets.filter((set) => set.day === day);
  const used = stages.filter((stage) => today.some((set) => set.stage === stage.name));
  return (
    <div className="flex flex-col gap-8 border-t border-current/15 pt-8">
      <div role="tablist" aria-label="Day" className="flex gap-8 overflow-x-auto">
        {days.map((option) => (
          <button
            key={option.name}
            type="button"
            role="tab"
            aria-selected={option.name === day}
            onClick={() => setDay(option.name)}
            className={cn(
              "flex shrink-0 items-baseline gap-2 border-b-2 pb-2 transition-[opacity,border-color]",
              option.name === day ? "border-[var(--sun)]" : "border-transparent opacity-50 hover:opacity-80",
            )}
          >
            <span className="text-xl font-semibold tracking-[-0.02em]">{option.name}</span>
            {option.date && <span className={quiet}>{option.date}</span>}
          </button>
        ))}
      </div>
      <div className="grid gap-x-8 gap-y-10 @2xl:grid-cols-2 @5xl:grid-cols-4">
        {used.map((stage) => (
          <div key={stage.name} className="flex flex-col gap-1">
            <Stage name={stage.name} color={stage.color} className="pb-3 text-sm font-medium" />
            <ol className="flex flex-col">
              {today
                .filter((set) => set.stage === stage.name)
                .toSorted(byTime)
                .map((set) => (
                  <li key={set.artist} className="flex items-baseline justify-between gap-4 border-t border-current/12 py-3">
                    <span className="text-lg leading-tight font-medium">{set.artist}</span>
                    <span className="shrink-0 text-xs tabular-nums opacity-60">
                      {clock(set.start)}–{clock(set.end, true)}
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The bill, as a poster or as set times by stage. The guide's step reads it from here. */
const lineup = defineComponent({
  type: "lineup",
  name: "Lineup",
  description: "Every act by day, as a poster or as set times. The guide plans from it.",
  icon: CalendarDaysIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The lineup" }),
    view: f.segmented({
      label: "Opens on",
      options: [
        { value: "poster", label: "Poster" },
        { value: "times", label: "Set times" },
      ],
    }),
    ...lineupFields,
  },
  Component: function Lineup({ id, props }) {
    const [view, setView] = useState(props.view);
    const sets = props.sets.filter((set) => set.artist);
    return (
      <section id={id} style={night} className="scroll-mt-4">
        <div className={cn(wrap, "flex flex-col gap-4 py-20 @3xl:py-28")}>
          <SectionHead
            title={props.heading}
            aside={
              <div role="tablist" aria-label="View" className="inline-flex rounded-full p-1 ring-1 ring-current/20">
                {(
                  [
                    ["poster", "Poster"],
                    ["times", "Set Times"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={view === value}
                    onClick={() => setView(value)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      view === value ? "bg-[var(--plum-foreground)] text-[var(--plum)]" : "opacity-70 hover:opacity-100",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            className="border-t-0 pt-0"
          />
          <div className="pt-6">
            {view === "poster" ? (
              <PosterView days={props.days} sets={sets} />
            ) : (
              <TimesView days={props.days} stages={props.stages} sets={sets} />
            )}
          </div>
        </div>
      </section>
    );
  },
});

/** Gates, getting there, camping: the practical bits, in columns between hairlines. */
const info = defineComponent({
  type: "info",
  name: "Know Before You Go",
  description: "The practical bits, in columns.",
  icon: InfoIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Know before you go" }),
    items: f.list({
      label: "Tiles",
      itemLabel: "Tile",
      max: 8,
      fields: { label: f.text({ label: "Label" }), title: f.text({ label: "Title" }), body: f.longText({ label: "Text" }) },
    }),
  },
  Component: ({ id, props }) => (
    <section id={id} className="scroll-mt-4">
      <div className={cn(wrap, "flex flex-col gap-12 py-20 @3xl:py-28")}>
        <SectionHead title={props.heading} />
        <ul className="grid gap-x-10 gap-y-10 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {props.items.map((item, i) => (
            <li key={i} className="flex flex-col gap-3 border-t border-current/15 pt-5">
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-balance">{item.label || item.title}</h3>
              {item.label && item.title && <p className="text-lg text-balance">{item.title}</p>}
              {item.body && <p className="leading-relaxed text-muted-foreground text-pretty">{item.body}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  ),
});

/** A line of italic serif sliding by, like a wristband. */
const marquee = defineComponent({
  type: "marquee",
  name: "Ticket Strip",
  description: "One line sliding by on a strip of sun, like a wristband.",
  icon: TicketIcon,
  fields: {
    text: f.text({ label: "Text", default: "Three days ✶ Four stages ✶ Forty-one acts" }),
  },
  Component: ({ props }) => {
    const line = (
      <span className="flex shrink-0 items-center gap-10 pr-10">
        {props.text.split("✶").map((part, i) => (
          <span key={i} className="flex items-center gap-10">
            <span>{part.trim()}</span>
            <span aria-hidden className="text-[0.55em] opacity-50">
              ✶
            </span>
          </span>
        ))}
      </span>
    );
    return (
      <div aria-label={props.text} style={{ background: "var(--sun)", color: "var(--plum)" }} className="overflow-hidden py-4">
        {/* Twice over, and moved by half its width, so the loop has no seam. Still for reduced motion. */}
        <div aria-hidden className={cn(poster, "flex w-max animate-marquee text-3xl whitespace-nowrap italic motion-reduce:animate-none @3xl:text-4xl")}>
          {line}
          {line}
          {line}
          {line}
        </div>
      </div>
    );
  },
});

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The days left until the gates open, counted on the page, in serif on a
 * flat field of the accent, apart from the night band. Server and browser can land either side of midnight, so the
 * number is allowed to differ between them.
 */
const countdown = defineComponent({
  type: "countdown",
  name: "Countdown",
  description: "How many days until the gates open, with a line on what happens when.",
  icon: HourglassIcon,
  fields: {
    opens: f.text({
      label: "Gates open",
      placeholder: "2027-04-16T12:00-07:00",
      help: "Date and time, with the festival's offset from UTC.",
    }),
    heading: f.text({ label: "After the number", default: "days until the gates open" }),
    body: f.longText({ label: "Intro" }),
    open: f.text({ label: "Once they're open", default: "The gates are open" }),
  },
  Component: ({ id, props }) => {
    const opens = Date.parse(props.opens);
    if (Number.isNaN(opens)) return null;
    const days = Math.ceil((opens - Date.now()) / DAY_MS);
    return (
      <section id={id} style={{ background: "var(--brand)", color: "var(--plum-foreground)" }} className="scroll-mt-4">
        <div className={cn(wrap, "grid gap-x-10 gap-y-8 py-20 @3xl:py-28 @4xl:grid-cols-12 @4xl:items-end")}>
          <h2 className="flex flex-col @4xl:col-span-8">
            {days > 0 ? (
              <>
                <span suppressHydrationWarning className={cn(poster, "text-[clamp(7rem,24cqi,17rem)] leading-[0.8] tabular-nums")}>
                  {days}
                </span>
                <span className={cn(poster, "text-[clamp(2.25rem,5cqi,4.5rem)] text-balance")}>
                  {days === 1 ? props.heading.replace(/^days/, "day") : props.heading}
                </span>
              </>
            ) : (
              <span className={cn(poster, "text-[clamp(3rem,8cqi,7rem)] text-balance")}>
                <Accent text={props.open} />
              </span>
            )}
          </h2>
          {props.body && (
            <p className="max-w-md text-lg leading-relaxed text-pretty opacity-90 @4xl:col-span-4 @4xl:pb-3">{props.body}</p>
          )}
        </div>
      </section>
    );
  },
});

/** The second chance to sign up, further down: a desert at dusk, the pitch on the left, the form on the right. */
const optin = defineComponent({
  type: "optin",
  name: "Sign-Up",
  description: "Name and email over a desert at dusk, then on to the questions.",
  icon: MailIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "Who are you there for?" }),
    body: f.longText({ label: "Intro" }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Button", default: "Start" }),
    note: f.text({ label: "Small print", default: "We'll only email you about this." }),
    image: f.image({ label: "Photo", help: "Faded into the sky behind it." }),
    formTitle: f.text({ label: "Form heading", default: "Plan your weekend" }),
    formBody: f.text({ label: "Form intro", default: "A few questions. The link lands in your inbox." }),
  },
  Component: ({ props, ctx }) => (
    <section id="join" style={sky} className="relative isolate scroll-mt-4 overflow-hidden">
      <Backdrop src={props.image} night />
      <div className={cn(wrap, "grid gap-12 pt-20 pb-44 @4xl:grid-cols-12 @4xl:items-center @4xl:pt-28 @4xl:pb-56")}>
        <div className="flex flex-col gap-5 @4xl:col-span-6">
          <h2 className={cn(poster, "text-[clamp(3.25rem,8cqi,7rem)] leading-[0.88] text-balance")}>
            <Accent text={props.headline} />
          </h2>
          {props.body && <p className="max-w-md text-lg leading-relaxed text-pretty opacity-85">{props.body}</p>}
        </div>
        <div className="@4xl:col-span-5 @4xl:col-start-8">
          <SignupForm
            ctx={ctx}
            title={props.formTitle}
            body={props.formBody}
            askName={props.askName}
            button={props.button}
            note={props.note}
            className="mx-auto max-w-md @4xl:mr-0"
          />
        </div>
      </div>
    </section>
  ),
});

// How It Works and Questions: the Basic catalogue's, in this look.

type FeatureProps = { heading: string; columns: "2" | "3"; numbered: boolean; items: { title: string; body: string }[] };
type FaqProps = { heading: string; items: { question: string; answer: string }[] };

const features = restyle(basicStart, "features", ({ id, props }: ComponentProps<any> & { props: FeatureProps }) => (
  <section id={id} className="scroll-mt-4">
    <div className={cn(wrap, "flex flex-col gap-14 py-20 @3xl:py-28")}>
      <SectionHead title={props.heading} />
      <ol className={cn("grid gap-x-10 gap-y-12 @4xl:grid-cols-12")}>
        {props.items.map((item, i) => (
          <li
            key={i}
            className={cn(
              "flex flex-col gap-4 border-t border-current/15 pt-6",
              props.columns === "3" ? "@4xl:col-span-4" : "@4xl:col-span-6",
            )}
          >
            {props.numbered && (
              <span className={cn(poster, "text-[4.5rem] leading-none text-[var(--brand)] italic")}>{i + 1}</span>
            )}
            <h3 className="text-xl font-medium text-balance">{item.title}</h3>
            {item.body && <p className="leading-relaxed text-muted-foreground text-pretty">{item.body}</p>}
          </li>
        ))}
      </ol>
    </div>
  </section>
));

const faq = restyle(basicStart, "faq", ({ id, props }: ComponentProps<any> & { props: FaqProps }) => (
  <section id={id} className="scroll-mt-4">
    <div className={cn(wrap, "grid gap-x-10 gap-y-10 py-20 @3xl:py-28 @4xl:grid-cols-12")}>
      <div className="flex flex-col gap-3 @4xl:col-span-5">
        <h2 className={cn(poster, "text-[clamp(2.75rem,6cqi,5.5rem)]")}>{props.heading}</h2>
      </div>
      <div className="flex flex-col @4xl:col-span-7">
        {props.items.map((item, i) => (
          <details key={i} className="group border-t border-current/15 py-6 last:border-b">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-xl font-medium text-balance">
              {item.question}
              <span aria-hidden className="text-2xl leading-none font-light text-[var(--brand)] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-2xl pt-3 text-lg leading-relaxed text-muted-foreground text-pretty">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
));

export const startComponents = [hero, lineup, info, marquee, countdown, optin, features, faq];

