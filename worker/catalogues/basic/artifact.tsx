import { ArrowRightIcon, FilmIcon, HeadingIcon, ListIcon, MegaphoneIcon, NotebookTextIcon, PilcrowIcon } from "lucide-react";

import { defineComponent, defineLayout } from "@core/catalogue/define";
import { f } from "@core/catalogue/fields";
import { cn } from "@/lib/utils";
import { generatedComponents } from "./generated";
import { RunFooter } from "./run-footer";
import { CatalogueLink, Logo, brandStyle, button, heading } from "./shared";

const tokens = "Use {{first_name}}, {{name}} or {{answers.<id>}} to fill in from their profile.";

export const artifactLayout = defineLayout({
  fields: {
    brand: f.text({ label: "Brand name", default: "Loro" }),
    logo: f.image({ label: "Logo" }),
    accent: f.color({ label: "Accent", default: "#1f1f1f" }),
    width: f.segmented({
      label: "Width",
      options: [
        { value: "narrow", label: "Narrow" },
        { value: "wide", label: "Wide" },
      ],
    }),
    footer: f.text({ label: "Footer note" }),
  },
  Layout: ({ settings, ctx, children }) => (
    <div style={brandStyle(settings.accent)} className="flex flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 px-5 py-4 @3xl:px-10">
        <Logo brand={settings.brand} logo={settings.logo} />
        {ctx.person && <span className="truncate text-sm text-muted-foreground">For {ctx.person.name || ctx.person.email}</span>}
      </header>
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-14 px-5 pt-8 pb-20 @3xl:px-10",
          settings.width === "narrow" ? "max-w-2xl" : "max-w-5xl",
        )}
      >
        {children}
      </main>
      {settings.footer && (
        <footer className="border-t px-5 py-8 text-sm text-muted-foreground @3xl:px-10">{settings.footer}</footer>
      )}
      <RunFooter ctx={ctx} />
    </div>
  ),
});

const header = defineComponent({
  type: "header",
  name: "Header",
  description: "Title and intro at the top.",
  icon: HeadingIcon,
  fields: {
    eyebrow: f.text({ label: "Eyebrow", default: "Made for {{first_name}}", help: tokens }),
    title: f.text({ label: "Title", default: "Here's yours, {{first_name}}" }),
    intro: f.longText({ label: "Intro" }),
    image: f.image({ label: "Photo" }),
  },
  Component: ({ props, ctx }) => (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {props.eyebrow && <span className="text-sm font-medium text-muted-foreground">{ctx.fill(props.eyebrow)}</span>}
        <h1 className="font-heading text-4xl leading-[1.05] font-medium text-balance @3xl:text-6xl">
          {ctx.fill(props.title)}
        </h1>
        {props.intro && <p className="text-lg text-muted-foreground text-pretty">{ctx.fill(props.intro)}</p>}
      </div>
      {props.image && <img src={props.image} alt="" className="aspect-[16/9] w-full rounded-(--radius) object-cover" />}
    </header>
  ),
});

const text = defineComponent({
  type: "text",
  name: "Text",
  description: "A heading and a few paragraphs.",
  icon: PilcrowIcon,
  fields: {
    heading: f.text({ label: "Heading" }),
    body: f.longText({ label: "Text", help: tokens }),
  },
  Component: ({ props, ctx }) => (
    <section className="flex flex-col gap-4">
      {props.heading && <h2 className={heading}>{ctx.fill(props.heading)}</h2>}
      {ctx
        .fill(props.body)
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i} className="text-lg leading-relaxed text-pretty">
            {paragraph}
          </p>
        ))}
    </section>
  ),
});

/** Their intake answers, as saved on the profile. */
const answers = defineComponent({
  type: "answers",
  name: "Their Answers",
  description: "What they told you in the intake.",
  icon: NotebookTextIcon,
  fields: {
    heading: f.text({ label: "Heading", default: "What you told us" }),
    style: f.segmented({
      label: "Style",
      options: [
        { value: "list", label: "List" },
        { value: "cards", label: "Cards" },
      ],
    }),
  },
  Component: ({ props, ctx }) => {
    const rows = ctx.profile.filter((row) => row.answer);
    if (rows.length === 0) return null;
    return (
      <section className="flex flex-col gap-6">
        {props.heading && <h2 className={heading}>{ctx.fill(props.heading)}</h2>}
        {props.style === "cards" ? (
          <dl className="grid gap-3 @2xl:grid-cols-2">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-1 rounded-(--radius) bg-secondary p-5">
                <dt className="text-sm text-muted-foreground">{row.question}</dt>
                <dd className="font-heading text-xl">{row.answer}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <dl className="divide-y border-y">
            {rows.map((row) => (
              <div key={row.id} className="grid gap-1 py-4 @2xl:grid-cols-[2fr_3fr] @2xl:gap-6">
                <dt className="text-muted-foreground">{row.question}</dt>
                <dd className="font-medium">{row.answer}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    );
  },
});

const list = defineComponent({
  type: "list",
  name: "List",
  description: "Steps, picks or recommendations.",
  icon: ListIcon,
  fields: {
    heading: f.text({ label: "Heading" }),
    numbered: f.toggle({ label: "Number them", default: true }),
    items: f.list({
      label: "Items",
      itemLabel: "Item",
      fields: {
        title: f.text({ label: "Title" }),
        body: f.longText({ label: "Text" }),
        link: f.link({ label: "Link" }),
      },
    }),
  },
  Component: ({ props, ctx }) => (
    <section className="flex flex-col gap-6">
      {props.heading && <h2 className={heading}>{ctx.fill(props.heading)}</h2>}
      <ol className="flex flex-col divide-y border-y">
        {props.items.map((item, i) => (
          <li key={i} className="flex gap-5 py-5">
            {props.numbered && (
              <span className="w-6 shrink-0 pt-0.5 font-heading text-xl text-muted-foreground tabular-nums">{i + 1}</span>
            )}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-heading text-xl font-medium">{ctx.fill(item.title)}</h3>
              {item.body && <p className="text-muted-foreground text-pretty">{ctx.fill(item.body)}</p>}
              {item.link.label && (
                <CatalogueLink
                  href={item.link.href}
                  ctx={ctx}
                  className="mt-1 inline-flex items-center gap-1.5 self-start text-sm font-medium underline-offset-4 hover:underline"
                >
                  {item.link.label}
                  <ArrowRightIcon className="size-3.5" />
                </CatalogueLink>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  ),
});

const callout = defineComponent({
  type: "callout",
  name: "Callout",
  description: "One thing to do next, with a button.",
  icon: MegaphoneIcon,
  fields: {
    tone: f.select({
      label: "Tone",
      options: [
        { value: "soft", label: "Soft" },
        { value: "accent", label: "Accent" },
        { value: "outline", label: "Outline" },
      ],
    }),
    title: f.text({ label: "Title", default: "One more thing" }),
    body: f.longText({ label: "Text" }),
    link: f.link({ label: "Button" }),
  },
  Component: ({ props, ctx }) => (
    <aside
      className={cn(
        "flex flex-col items-start gap-4 rounded-(--radius) p-6 @2xl:p-8",
        props.tone === "soft" && "bg-secondary",
        props.tone === "accent" && "bg-[var(--brand)] text-[var(--brand-foreground)]",
        props.tone === "outline" && "ring-1 ring-border",
      )}
    >
      <h2 className="font-heading text-2xl font-medium text-balance">{ctx.fill(props.title)}</h2>
      {props.body && <p className="text-pretty opacity-80">{ctx.fill(props.body)}</p>}
      {props.link.label && (
        <CatalogueLink
          href={props.link.href}
          ctx={ctx}
          className={cn(button, props.tone === "accent" && "bg-[var(--brand-foreground)] text-[var(--brand)]")}
        >
          {props.link.label}
        </CatalogueLink>
      )}
    </aside>
  ),
});

const media = defineComponent({
  type: "media",
  name: "Media",
  description: "A photo or video, with a caption.",
  icon: FilmIcon,
  fields: {
    media: f.media({ label: "Image or video" }),
    shape: f.select({
      label: "Shape",
      options: [
        { value: "wide", label: "Wide" },
        { value: "square", label: "Square" },
        { value: "tall", label: "Tall" },
      ],
    }),
    caption: f.text({ label: "Caption" }),
  },
  Component: ({ props, ctx }) => {
    if (!props.media.url) return null;
    const shape = { wide: "aspect-video", square: "aspect-square", tall: "aspect-[4/5]" }[props.shape];
    return (
      <figure className="flex flex-col gap-3">
        {props.media.type === "video" ? (
          <video src={props.media.url} controls playsInline className={cn("w-full rounded-(--radius) object-cover", shape)} />
        ) : (
          <img src={props.media.url} alt={props.caption} className={cn("w-full rounded-(--radius) object-cover", shape)} />
        )}
        {props.caption && <figcaption className="text-sm text-muted-foreground">{ctx.fill(props.caption)}</figcaption>}
      </figure>
    );
  },
});

export const artifactComponents = [header, text, answers, list, callout, media, ...generatedComponents];
