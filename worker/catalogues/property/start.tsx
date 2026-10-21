/**
 * The Property catalogue's start page: one home, set like a single-listing
 * site. The address big on the white with the sign-up beside it, then
 * the house full bleed; the photographs as a staggered collage; the details in hairlines;
 * the street on a map; and an example of what Qloo does with someone's
 * taste, so the buyer knows what they'll get before they start.
 */
import { type ReactNode, useState } from "react";
import { ArrowRightIcon, Building2Icon, CircleHelpIcon, ImagesIcon, ListIcon, MailIcon, MapIcon, PilcrowIcon, SparklesIcon, UserRoundIcon } from "lucide-react";

import { type RenderContext, defineComponent, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { parsePoint } from "@core/outcome/lookups";
import { CatalogueLink, brandStyle } from "../basic/shared";
import { cn } from "@/lib/utils";
import { Logo, SectionHead, button, deep, display, displayHeadings, field, quiet, wrap } from "./shared";

const images = (label: string, max: number) =>
  f.list({ label, itemLabel: "Photo", max, fields: { image: f.image({ label: "Photo" }), caption: f.text({ label: "Caption" }) } });

export const startLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Agency name", default: "Harbour & Grey" }),
    logo: f.image({ label: "Logo", help: "Shown instead of the name." }),
    accent: f.color({ label: "Accent", default: "#111111" }),
    nav: f.list({ label: "Navigation", itemLabel: "Link", max: 4, fields: { link: f.link({ label: "Link" }) } }),
    cta: f.link({ label: "Header button", default: { label: "See your week here", href: "#start" } }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground antialiased">
      <header className="border-b border-border">
        <div className={cn(wrap, "flex h-18 items-center justify-between gap-6")}>
          <Logo brand={settings.brand} logo={settings.logo} className="text-lg" />
          <div className="flex items-center gap-8">
            {settings.nav.length > 0 && (
              <nav className="flex items-center gap-7 text-sm @max-3xl:hidden">
                {settings.nav.map(({ link }, i) => (
                  <CatalogueLink key={i} href={link.href} ctx={ctx} className="text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </CatalogueLink>
                ))}
              </nav>
            )}
            {settings.cta.label && (
              <CatalogueLink href={settings.cta.href} ctx={ctx} className={cn(button, "h-10 px-5 text-sm whitespace-nowrap")}>
                {settings.cta.label}
              </CatalogueLink>
            )}
          </div>
        </div>
      </header>
      <main className={cn("flex-1", displayHeadings)}>{children}</main>
      <footer style={deep} className="overflow-hidden">
        <div className={cn(wrap, "flex flex-col gap-10 pt-20 pb-10")}>
          <Logo brand={settings.brand} className="text-[clamp(2.75rem,9cqi,8rem)] whitespace-nowrap" />
          <div className="flex flex-col gap-3 border-t border-current/15 pt-6 text-sm opacity-70 @2xl:flex-row @2xl:justify-between">
            {settings.footer && <span>{settings.footer}</span>}
            <span>Places matched to your taste by Qloo</span>
          </div>
        </div>
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
  top,
  className,
}: {
  ctx: RenderContext;
  title: string;
  body: string;
  askName: boolean;
  label: string;
  note: string;
  /** Above the form, edge to edge: the home it's about. */
  top?: ReactNode;
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
        "flex flex-col gap-5 overflow-hidden border border-foreground bg-card p-7 text-foreground @2xl:p-8",
        top && "pt-0 @2xl:pt-0",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
        ctx.optin.submit({ name, email });
      }}
    >
      {top && <div className="-mx-7 border-b border-border bg-[var(--sand)]/60 px-7 py-4 @2xl:-mx-8 @2xl:px-8">{top}</div>}
      {(title || body) && (
        <div className="flex flex-col gap-2">
          {/* h3: the layout sets every h2 in the display face, and the form's title stays in Inter. */}
          {title && <h3 className="text-xl font-semibold tracking-[-0.02em] text-balance">{title}</h3>}
          {body && <p className="text-[0.95rem] leading-relaxed text-muted-foreground text-pretty">{body}</p>}
        </div>
      )}
      <div className="flex flex-col gap-3">
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
      </div>
      <button type="submit" disabled={pending} className={cn(button, "w-full")}>
        {pending ? "One moment…" : label}
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

/** The listing up top: the address big on the white with the sign-up beside it, then the house full width and the photographs. */
const listing = defineComponent({
  type: "listing",
  name: "Listing",
  description: "The address in big type with the sign-up, then a full-width photo and the rest of the photos.",
  icon: Building2Icon,
  fields: {
    status: f.text({ label: "Status", placeholder: "New build", help: "Shown before the neighbourhood." }),
    address: f.text({ label: "Address", default: "123 Main Street" }),
    area: f.text({ label: "Neighbourhood", placeholder: "Point Grey, Vancouver" }),
    price: f.text({ label: "Price", placeholder: "$1,250,000" }),
    beds: f.text({ label: "Beds", placeholder: "3" }),
    baths: f.text({ label: "Baths", placeholder: "2" }),
    size: f.text({ label: "Size", placeholder: "1,800 sq ft" }),
    body: f.longText({ label: "Intro" }),
    photos: images("Photos", 5),
    signup: f.toggle({ label: "Sign-up in the hero", default: true, help: "Off: a button down to the sign-up instead." }),
    formTitle: f.text({ label: "Sign-up heading", default: "See your week here" }),
    formBody: f.longText({ label: "Sign-up intro" }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Sign-up button", default: "Start" }),
    note: f.text({ label: "Small print", default: "We'll only email you about this home." }),
    cta: f.link({ label: "Button", default: { label: "See your week here", href: "#join" }, help: "Shown when the sign-up isn't in the hero." }),
  },
  Component: ({ id, props, ctx }) => {
    const [cover, ...rest] = props.photos.filter((photo) => photo.image);
    const facts = [props.status, props.area, props.beds && `${props.beds} bed`, props.baths && `${props.baths} bath`, props.size].filter(Boolean);
    return (
      <section id={id}>
        <div className={cn(wrap, "grid gap-12 pt-14 pb-12 @3xl:pt-20 @5xl:grid-cols-12 @5xl:items-end @5xl:gap-16 @5xl:pb-16")}>
          <div className="flex flex-col gap-7 @5xl:col-span-7">
            <h1 className={cn(display, "text-[clamp(3.5rem,9cqi,8.5rem)] [line-height:0.86] text-balance")}>{props.address}</h1>
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-foreground pt-5 text-lg">
              {props.price && <span className="font-semibold tabular-nums">{props.price}</span>}
              <span className="text-muted-foreground">{facts.join(" · ")}</span>
            </p>
            {props.body && <p className="max-w-xl text-lg leading-relaxed text-pretty">{props.body}</p>}
            {!props.signup && props.cta.label && (
              <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "h-14 self-start px-8 text-base")}>
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
                label={props.button}
                note={props.note}
                className="max-w-md @5xl:mr-0 @5xl:ml-auto"
              />
            </div>
          )}
        </div>
        {cover && <img src={cover.image} alt={cover.caption} fetchPriority="high" className="aspect-[16/9] w-full object-cover @4xl:aspect-[21/9]" />}
        {rest.length > 0 && (
          <div className={cn(wrap, "grid gap-3 py-3 @3xl:grid-cols-4")}>
            {rest.slice(0, 4).map((photo, i) => (
              <figure key={i} className="flex flex-col gap-2">
                <img src={photo.image} alt={photo.caption} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                {photo.caption && <figcaption className={quiet}>{photo.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </section>
    );
  },
});

/** The description: a big heading on the left, the words and highlights on the right, a wide photo under. */
const story = defineComponent({
  type: "story",
  name: "About the Home",
  description: "A heading, the description and its highlights, then a wide photo.",
  icon: PilcrowIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "About the home" }),
    body: f.longText({ label: "Description" }),
    highlights: f.list({ label: "Highlights", itemLabel: "Highlight", max: 10, fields: { text: f.text({ label: "Text" }) } }),
    image: f.image({ label: "Photo" }),
  },
  Component: ({ id, props }) => (
    <section id={id} className={cn(wrap, "flex scroll-mt-6 flex-col gap-14 py-24 @4xl:py-32")}>
      <div className="grid gap-x-10 gap-y-10 @4xl:grid-cols-12">
        {props.heading && <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance @4xl:col-span-6")}>{props.heading}</h2>}
        <div className="flex flex-col gap-5 @4xl:col-span-5 @4xl:col-start-8">
          {props.body
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="text-lg leading-relaxed text-pretty">
                {paragraph}
              </p>
            ))}
          {props.highlights.length > 0 && (
            <ul className="mt-4 flex flex-col border-t border-border">
              {props.highlights.map((item, i) => (
                <li key={i} className="border-b border-border py-3 text-muted-foreground">
                  {item.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {props.image && <img src={props.image} alt="" loading="lazy" className="aspect-[16/9] w-full rounded-(--radius) object-cover @4xl:aspect-[21/9]" />}
    </section>
  ),
});

/** More photos, as a staggered collage: three columns set at different heights, like a printed brochure. */
const gallery = defineComponent({
  type: "gallery",
  name: "Gallery",
  description: "More photos in three staggered columns, with captions.",
  icon: ImagesIcon,
  fields: {
    heading: f.text({ label: "Heading" }),
    photos: images("Photos", 12),
  },
  Component: ({ id, props }) => {
    const photos = props.photos.filter((photo) => photo.image);
    const columns = [0, 1, 2].map((c) => photos.filter((_, i) => i % 3 === c));
    return (
      <section id={id} className={cn(wrap, "flex flex-col gap-10 pb-24 @4xl:pb-32")}>
        {props.heading && <SectionHead title={props.heading} />}
        <div className="grid gap-3 @3xl:grid-cols-3 @3xl:gap-5">
          {columns.map((column, c) => (
            <div key={c} className={cn("flex flex-col gap-3 @3xl:gap-5", c === 1 && "@3xl:pt-28", c === 2 && "@3xl:pt-12")}>
              {column.map((photo, i) => (
                <figure key={i} className="flex flex-col gap-2">
                  <img
                    src={photo.image}
                    alt={photo.caption}
                    loading="lazy"
                    className={cn("w-full rounded-(--radius) object-cover", (i + c) % 2 === 0 ? "aspect-[4/5]" : "aspect-[4/3]")}
                  />
                  {photo.caption && <figcaption className={quiet}>{photo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  },
});

/** The numbers buyers compare: year, lot, parking, heating. */
const facts = defineComponent({
  type: "facts",
  name: "Facts",
  description: "Label and value pairs, like year built and lot size.",
  icon: ListIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The details" }),
    items: f.list({
      label: "Facts",
      itemLabel: "Fact",
      max: 16,
      fields: { label: f.text({ label: "Label" }), value: f.text({ label: "Value" }) },
      default: [
        { label: "Year built", value: "" },
        { label: "Lot", value: "" },
      ],
    }),
  },
  Component: ({ id, props }) => (
    <section id={id} className="bg-[var(--sand)]">
      <div className={cn(wrap, "flex flex-col gap-12 py-24 @4xl:py-28")}>
        {props.heading && <SectionHead title={props.heading} />}
        <dl className="grid border-t border-foreground @2xl:grid-cols-2 @4xl:grid-cols-4">
          {props.items.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5 border-b border-foreground/15 py-5 @2xl:pr-8">
              <dt className={quiet}>{item.label}</dt>
              <dd className="text-lg font-medium tracking-[-0.01em]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  ),
});

/** An OpenStreetMap of the block, in grey so the photographs keep the colour, and what's close by. */
const area = defineComponent({
  type: "area",
  name: "Neighbourhood",
  description: "A map of the area and a list of what's nearby.",
  icon: MapIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "The neighbourhood" }),
    body: f.longText({ label: "Intro" }),
    point: f.text({ label: "Map point", placeholder: "49.2704, -123.1869", help: "Latitude, longitude." }),
    items: f.list({
      label: "Nearby",
      itemLabel: "Place",
      max: 10,
      fields: { name: f.text({ label: "Name" }), detail: f.text({ label: "Detail" }), distance: f.text({ label: "Distance" }) },
    }),
    note: f.text({ label: "Small print" }),
  },
  Component: ({ id, props }) => {
    const point = parsePoint(props.point);
    const pad = 0.011;
    const map = point
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${point.lng - pad * 1.7},${point.lat - pad},${point.lng + pad * 1.7},${point.lat + pad}&layer=mapnik&marker=${point.lat},${point.lng}`
      : null;
    return (
      <section id={id} className={cn(wrap, "grid scroll-mt-6 gap-x-10 gap-y-12 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
        <div className="flex flex-col gap-6 @4xl:col-span-5">
          {props.heading && <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance")}>{props.heading}</h2>}
          {props.body && <p className="text-lg leading-relaxed text-pretty text-muted-foreground">{props.body}</p>}
          {props.items.length > 0 && (
            <ul className="mt-2 flex flex-col border-t border-border">
              {props.items.map((item, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 border-b border-border py-4">
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium tracking-[-0.01em]">{item.name}</span>
                    {item.detail && <span className={quiet}>{item.detail}</span>}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{item.distance}</span>
                </li>
              ))}
            </ul>
          )}
          {props.note && <p className="text-xs text-muted-foreground">{props.note}</p>}
        </div>
        {map && (
          <div className="relative self-start overflow-hidden rounded-(--radius) bg-muted @4xl:col-span-6 @4xl:col-start-7">
            <iframe
              title="Map of the area"
              src={map}
              loading="lazy"
              className="block aspect-square w-full border-0 grayscale-[0.85] contrast-[0.95] @4xl:aspect-[5/6]"
            />
          </div>
        )}
      </section>
    );
  },
});

/**
 * What Qloo does with someone's taste, shown before they start: places a
 * buyer named on the left, what was found near the house on the right.
 * The rows come from a real run, so the example is true.
 */
const match = defineComponent({
  type: "match",
  name: "Taste Example",
  description: "Places someone loves, next to what was found near the home for them. From a real run.",
  icon: SparklesIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Same taste, new street" }),
    body: f.longText({ label: "Intro" }),
    items: f.list({
      label: "Rows",
      itemLabel: "Row",
      max: 5,
      fields: {
        yours: f.text({ label: "Their place", placeholder: "Pilot Coffee, Toronto" }),
        near: f.text({ label: "Found nearby", placeholder: "Storm City Coffee" }),
        detail: f.text({ label: "Detail", placeholder: "13 min walk · Kitsilano" }),
        image: f.image({ label: "Photo" }),
      },
    }),
    note: f.text({ label: "Small print" }),
    cta: f.link({ label: "Button", default: { label: "Find yours", href: "#join" } }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} style={deep}>
      <div className={cn(wrap, "flex flex-col gap-14 py-24 @4xl:py-32")}>
        <SectionHead
          title={props.heading}
          aside={props.body && <p className="text-lg leading-relaxed text-pretty opacity-80">{props.body}</p>}
        />
        <ol className="flex flex-col border-t border-current/15">
          {props.items.map((item, i) => (
            <li key={i} className="grid items-center gap-x-10 gap-y-3 border-b border-current/15 py-6 @3xl:grid-cols-12">
              <span className="text-lg opacity-70 @3xl:col-span-4">{item.yours}</span>
              <ArrowRightIcon aria-hidden className="size-5 opacity-50 @max-3xl:hidden @3xl:col-span-1" />
              <span className="flex items-center gap-4 @3xl:col-span-7">
                {item.image && <img src={item.image} alt="" loading="lazy" className="size-14 shrink-0 rounded-(--radius) object-cover" />}
                <span className="flex flex-col gap-0.5">
                  <span className={cn(display, "text-3xl @3xl:text-4xl")}>{item.near}</span>
                  {item.detail && <span className="text-sm opacity-65">{item.detail}</span>}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-6 @3xl:flex-row @3xl:items-center @3xl:justify-between">
          {props.note && <p className="max-w-xl text-sm opacity-60">{props.note}</p>}
          {props.cta.label && (
            <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "self-start bg-[var(--deep-foreground)] text-[var(--deep)]")}>
              {props.cta.label}
              <ArrowRightIcon className="size-4" />
            </CatalogueLink>
          )}
        </div>
      </div>
    </section>
  ),
});

/** Who's selling it, and how to reach them. */
const agent = defineComponent({
  type: "agent",
  name: "Agent",
  description: "Who's selling it, and how to reach them.",
  icon: UserRoundIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Talk to the agent" }),
    name: f.text({ label: "Name" }),
    role: f.text({ label: "Role", placeholder: "Listing agent" }),
    photo: f.image({ label: "Photo" }),
    phone: f.text({ label: "Phone" }),
    email: f.text({ label: "Email" }),
    body: f.longText({ label: "Note" }),
  },
  Component: ({ id, props }) => {
    const initials = props.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("");
    return (
      <section id={id} className={cn(wrap, "grid gap-x-10 gap-y-10 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
        <div className="flex flex-col gap-6 @4xl:col-span-6">
          {props.heading && <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance")}>{props.heading}</h2>}
          {props.body && <p className="max-w-md text-lg leading-relaxed text-pretty text-muted-foreground">{props.body}</p>}
        </div>
        <div className="flex items-start gap-6 border-t border-foreground pt-6 @4xl:col-span-5 @4xl:col-start-8 @4xl:self-end">
          {props.photo ? (
            <img src={props.photo} alt={props.name} className="size-20 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden className={cn(display, "flex size-20 shrink-0 items-center justify-center rounded-full bg-[var(--sand)] text-3xl")}>
              {initials}
            </span>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold tracking-[-0.02em]">{props.name}</span>
            {props.role && <span className={quiet}>{props.role}</span>}
            <div className="mt-3 flex flex-col gap-1">
              {props.phone && (
                <a href={`tel:${props.phone.replace(/[^\d+]/g, "")}`} className="font-medium tabular-nums underline-offset-4 hover:underline">
                  {props.phone}
                </a>
              )}
              {props.email && (
                <a href={`mailto:${props.email}`} className="text-muted-foreground underline-offset-4 hover:underline">
                  {props.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  },
});

/** The lower sign-up: the same form over a photo of the house. */
const optin = defineComponent({
  type: "optin",
  name: "Sign-Up",
  description: "A headline over a photo, and the sign-up in a card with the home at the top.",
  icon: MailIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "See how you'd live here" }),
    body: f.longText({ label: "Intro" }),
    image: f.image({ label: "Photo", help: "Behind the whole section." }),
    home: f.text({ label: "Home", placeholder: "2-3768 West 2nd Avenue", help: "At the top of the form, with the small photo." }),
    homeDetail: f.text({ label: "Under the home", placeholder: "Point Grey · $3,968,000" }),
    thumb: f.image({ label: "Small photo" }),
    formTitle: f.text({ label: "Form heading", default: "Nine questions, then your week here" }),
    formBody: f.longText({ label: "Form intro" }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Button", default: "Start" }),
    note: f.text({ label: "Small print", default: "We'll only email you about this home." }),
  },
  Component: ({ id, props, ctx }) => (
    <section id={id} className="relative isolate scroll-mt-4 overflow-hidden bg-[var(--deep)] text-white">
      {props.image && (
        <>
          <img src={props.image} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-black/70 via-black/40 to-black/10" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-black/30 @4xl:hidden" />
        </>
      )}
      <div className={cn(wrap, "grid gap-12 py-24 @4xl:grid-cols-12 @4xl:items-center @4xl:py-36")}>
        <div className="flex flex-col gap-5 @4xl:col-span-6">
          <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] text-balance")}>{props.headline}</h2>
          {props.body && <p className="max-w-md text-lg leading-relaxed text-pretty opacity-85">{props.body}</p>}
        </div>
        <div className="@4xl:col-span-5 @4xl:col-start-8">
          <SignupForm
            ctx={ctx}
            title={props.formTitle}
            body={props.formBody}
            askName={props.askName}
            label={props.button}
            note={props.note}
            className="mx-auto max-w-md @4xl:mr-0"
            top={
              (props.home || props.thumb) && (
                <div className="flex items-center gap-4">
                  {props.thumb && <img src={props.thumb} alt="" loading="lazy" className="size-14 shrink-0 rounded-(--radius) object-cover" />}
                  <div className="flex min-w-0 flex-col gap-0.5">
                    {props.home && <span className="truncate font-semibold tracking-[-0.015em]">{props.home}</span>}
                    {props.homeDetail && <span className={cn(quiet, "truncate")}>{props.homeDetail}</span>}
                  </div>
                </div>
              )
            }
          />
        </div>
      </div>
    </section>
  ),
});

const faq = defineComponent({
  type: "faq",
  name: "Questions",
  description: "What buyers ask before they start.",
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
    <section id={id} className={cn(wrap, "grid gap-x-10 gap-y-10 py-24 @4xl:grid-cols-12 @4xl:py-32")}>
      {props.heading && <h2 className={cn(display, "text-[clamp(2.75rem,6cqi,5.5rem)] @4xl:col-span-4")}>{props.heading}</h2>}
      <div className="flex flex-col border-t border-foreground @4xl:col-span-7 @4xl:col-start-6">
        {props.items.map((item, i) => (
          <details key={i} className="group border-b border-border py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium tracking-[-0.01em]">
              {item.question}
              <span aria-hidden className="text-2xl font-light text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-2xl pt-3 leading-relaxed text-muted-foreground text-pretty">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  ),
});

export const startComponents = [listing, story, gallery, facts, area, match, agent, optin, faq];
