import { useState } from "react";
import { CircleHelpIcon, ImageIcon, LayoutGridIcon, MailIcon, QuoteIcon } from "lucide-react";

import { defineComponent, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { CatalogueLink, Logo, brandStyle, button, heading, input } from "./shared";

export const startLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Brand name", default: "Loro" }),
    logo: f.image({ label: "Logo", help: "Shown instead of the brand name." }),
    accent: f.color({ label: "Accent", default: "#1f1f1f" }),
    nav: f.list({
      label: "Navigation",
      itemLabel: "Link",
      max: 4,
      fields: { link: f.link({ label: "Link" }) },
    }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-6 px-5 py-4 @3xl:px-10">
        <Logo brand={settings.brand} logo={settings.logo} />
        {settings.nav.length > 0 && (
          <nav className="flex items-center gap-5 text-sm @max-xl:hidden">
            {settings.nav.map(({ link }, i) => (
              <CatalogueLink key={i} href={link.href} ctx={ctx} className="text-muted-foreground hover:text-foreground">
                {link.label}
              </CatalogueLink>
            ))}
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="flex flex-col gap-1 border-t px-5 py-8 text-sm text-muted-foreground @2xl:flex-row @2xl:justify-between @3xl:px-10">
        <span className="font-medium text-foreground">{settings.brand}</span>
        {settings.footer && <span>{settings.footer}</span>}
      </footer>
    </div>
  ),
});

const hero = defineComponent({
  type: "hero",
  name: "Hero",
  description: "Headline, intro and a photo.",
  icon: ImageIcon,
  fields: {
    eyebrow: f.text({ label: "Eyebrow" }),
    headline: f.text({ label: "Headline", default: "A headline that says what they'll get" }),
    body: f.longText({ label: "Intro" }),
    image: f.image({ label: "Photo" }),
    style: f.segmented({
      label: "Style",
      options: [
        { value: "split", label: "Split" },
        { value: "cover", label: "Cover" },
      ],
    }),
    cta: f.link({ label: "Button", default: { label: "Get Started", href: "#start" } }),
  },
  Component: ({ props, ctx }) => {
    const cover = props.style === "cover" && props.image;
    return (
      <section
        className={cn(
          "relative isolate overflow-hidden",
          cover ? "flex min-h-[32rem] items-end text-white" : "grid gap-8 px-5 py-12 @3xl:grid-cols-2 @3xl:items-center @3xl:px-10 @3xl:py-20",
        )}
      >
        {cover && (
          <>
            <img src={props.image} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
          </>
        )}
        <div className={cn("flex flex-col items-start gap-5", cover && "max-w-2xl px-5 py-12 @3xl:px-10")}>
          {props.eyebrow && (
            <span className={cn("text-sm font-medium", cover ? "text-white/80" : "text-muted-foreground")}>
              {props.eyebrow}
            </span>
          )}
          <h1 className="font-heading text-4xl leading-[1.05] font-medium text-balance @3xl:text-6xl">
            {props.headline}
          </h1>
          {props.body && (
            <p className={cn("text-lg text-pretty", cover ? "text-white/85" : "text-muted-foreground")}>{props.body}</p>
          )}
          {props.cta.label && (
            <CatalogueLink href={props.cta.href} ctx={ctx} className={cn(button, "mt-2")}>
              {props.cta.label}
            </CatalogueLink>
          )}
        </div>
        {!cover && props.image && (
          <img src={props.image} alt="" className="aspect-[4/3] w-full rounded-(--radius) object-cover" />
        )}
      </section>
    );
  },
});

/** The sign-up. Submitting it starts the intake, or goes straight to the outcome. */
const optin = defineComponent({
  type: "optin",
  name: "Sign-Up",
  description: "Name and email, then on to the questions.",
  icon: MailIcon,
  fields: {
    headline: f.text({ label: "Headline", default: "Get yours" }),
    body: f.longText({ label: "Intro" }),
    askName: f.toggle({ label: "Ask for their name", default: true }),
    button: f.text({ label: "Button", default: "Start" }),
    note: f.text({ label: "Small print", default: "We'll only email you about this." }),
  },
  Component: function Optin({ props, ctx }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const { errors, pending } = ctx.optin;

    return (
      <section id="start" className="scroll-mt-4 px-5 py-14 @3xl:px-10 @3xl:py-20">
        <form
          noValidate
          className="mx-auto flex max-w-md flex-col gap-4 rounded-(--radius) bg-card p-6 ring-1 ring-border @2xl:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            ctx.optin.submit({ name, email });
          }}
        >
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-2xl font-medium text-balance">{props.headline}</h2>
            {props.body && <p className="text-muted-foreground text-pretty">{props.body}</p>}
          </div>
          {props.askName && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Name</span>
              <input
                className={cn(input, "h-12")}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <span className="text-sm text-red-600">{errors.name}</span>}
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Email</span>
            <input
              className={cn(input, "h-12")}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <span className="text-sm text-red-600">{errors.email}</span>}
          </label>
          <button type="submit" disabled={pending} className={cn(button, "mt-2 w-full")}>
            {pending ? "One moment…" : props.button}
          </button>
          {errors.form && (
            <p role="alert" className="text-center text-sm text-red-600">
              {errors.form}
            </p>
          )}
          {props.note && <p className="text-center text-xs text-muted-foreground">{props.note}</p>}
        </form>
      </section>
    );
  },
});

const features = defineComponent({
  type: "features",
  name: "Features",
  description: "A few short points, in columns.",
  icon: LayoutGridIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "How it works" }),
    columns: f.segmented({
      label: "Columns",
      options: [
        { value: "2", label: "Two" },
        { value: "3", label: "Three" },
      ],
      default: "3",
    }),
    numbered: f.toggle({ label: "Number them", default: true }),
    items: f.list({
      label: "Points",
      itemLabel: "Point",
      max: 6,
      fields: {
        title: f.text({ label: "Title" }),
        body: f.longText({ label: "Text" }),
      },
      default: [
        { title: "Answer a few questions", body: "" },
        { title: "We put it together", body: "" },
        { title: "It's yours to keep", body: "" },
      ],
    }),
  },
  Component: ({ props }) => (
    <section className="flex flex-col gap-8 px-5 py-14 @3xl:px-10 @3xl:py-20">
      {props.heading && <h2 className={heading}>{props.heading}</h2>}
      <ol className={cn("grid gap-8", props.columns === "3" ? "@3xl:grid-cols-3" : "@2xl:grid-cols-2")}>
        {props.items.map((item, i) => (
          <li key={i} className="flex flex-col gap-2 border-t pt-5">
            {props.numbered && <span className="text-sm text-muted-foreground tabular-nums">0{i + 1}</span>}
            <h3 className="font-heading text-xl font-medium">{item.title}</h3>
            {item.body && <p className="text-muted-foreground text-pretty">{item.body}</p>}
          </li>
        ))}
      </ol>
    </section>
  ),
});

const testimonials = defineComponent({
  type: "testimonials",
  name: "Testimonials",
  description: "What people said about theirs.",
  icon: QuoteIcon,
  fields: {
    heading: f.text({ label: "Heading" }),
    items: f.list({
      label: "Quotes",
      itemLabel: "Quote",
      max: 6,
      fields: {
        quote: f.longText({ label: "Quote" }),
        name: f.text({ label: "Name" }),
        detail: f.text({ label: "Detail", help: "Their city, or when they used it." }),
      },
    }),
  },
  Component: ({ props }) => (
    <section className="flex flex-col gap-8 bg-secondary px-5 py-14 @3xl:px-10 @3xl:py-20">
      {props.heading && <h2 className={heading}>{props.heading}</h2>}
      <ul className="grid gap-5 @3xl:grid-cols-2">
        {props.items.map((item, i) => (
          <li key={i}>
            <figure className="flex h-full flex-col justify-between gap-6 rounded-(--radius) bg-card p-6 ring-1 ring-border">
              <blockquote className="font-heading text-xl leading-snug text-pretty">“{item.quote}”</blockquote>
              <figcaption className="text-sm">
                <span className="font-medium">{item.name}</span>
                {item.detail && <span className="text-muted-foreground"> · {item.detail}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  ),
});

const faq = defineComponent({
  type: "faq",
  name: "Questions",
  description: "What people ask before they sign up.",
  icon: CircleHelpIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "Questions" }),
    items: f.list({
      label: "Questions",
      itemLabel: "Question",
      fields: {
        question: f.text({ label: "Question" }),
        answer: f.longText({ label: "Answer" }),
      },
    }),
  },
  Component: ({ props }) => (
    <section className="flex flex-col gap-6 px-5 py-14 @3xl:px-10 @3xl:py-20">
      {props.heading && <h2 className={heading}>{props.heading}</h2>}
      <div className="divide-y border-y">
        {props.items.map((item, i) => (
          <details key={i} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.question}
              <span aria-hidden className="text-xl text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pt-2 text-muted-foreground text-pretty">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  ),
});

export const startComponents = [hero, optin, features, testimonials, faq];
