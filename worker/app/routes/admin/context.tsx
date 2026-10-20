import { useEffect, useRef, useState } from "react";
import { useFetcher, useRevalidator, useSearchParams } from "react-router";
import {
  AudioLinesIcon,
  FilmIcon,
  ImageIcon,
  PlusIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";

import type { Route } from "./+types/context";
import {
  type ImageAsset,
  type MediaAsset,
  type MediaKind,
  type Skill,
  mediaKinds,
} from "@core/context";
import { deleteSkill, listContextFiles, listSkills, saveSkill } from "@core/context.server";
import { deleteFile, updateFile } from "@core/files.server";
import { ConfirmDeleteButton } from "@/admin-components/confirm-delete";
import { PageHeader } from "@/admin-components/page-header";
import { Button } from "@/admin-components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/admin-components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/admin-components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin-components/ui/table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/admin-components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { Textarea } from "@/admin-components/ui/textarea";
import { daysAgo, duration, fileSize } from "@/lib/format";
import { uploadFile } from "@/lib/upload";
import { currentWorkspace } from "@/lib/workspace.server";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "Context · Loro" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const workspace = await currentWorkspace(request);
  const [skills, { images, media }] = await Promise.all([
    listSkills(workspace.id),
    listContextFiles(workspace.id),
  ]);
  return { workspaceId: workspace.id, skills, images, media };
}

// Uploads go through /api (see lib/upload.ts) so they can report progress.
export async function action({ request }: Route.ActionArgs) {
  const { id: workspaceId } = await currentWorkspace(request);
  const form = await request.formData();
  const field = (name: string) => String(form.get(name) ?? "");

  switch (field("intent")) {
    case "save-skill":
      await saveSkill(workspaceId, {
        id: field("id") || undefined,
        title: field("title"),
        description: field("description"),
      });
      break;
    case "delete-skill":
      await deleteSkill(workspaceId, field("id"));
      break;
    case "save-file":
      await updateFile(workspaceId, field("id"), {
        name: field("name").trim() || "Untitled",
        alt: form.has("alt") ? field("alt").trim() : undefined,
      });
      break;
    case "delete-file":
      await deleteFile(workspaceId, field("id"));
      break;
  }
  return null;
}

const views = ["skills", "images", "media"] as const;
type View = (typeof views)[number];

const contextDocs: Record<View, { slug: string; tooltip: string }> = {
  skills: { slug: "skills", tooltip: "How skills shape every experience" },
  images: { slug: "media", tooltip: "How images are used in experiences" },
  media: { slug: "media", tooltip: "How media is used in experiences" },
};

const kindFilter = { all: "All types", ...mediaKinds };

/** A file on its way up, shown until the list reloads with it. */
type Upload = { id: string; name: string; progress: number; error: string | null };

function UploadList({ uploads }: { uploads: Upload[] }) {
  if (uploads.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {uploads.map((upload) => (
        <li key={upload.id} className="flex items-center justify-between gap-4 text-sm">
          <span className="min-w-0 truncate">{upload.name}</span>
          {upload.error ? (
            <span className="shrink-0 text-destructive">{upload.error}</span>
          ) : (
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {upload.progress < 1 ? `${Math.round(upload.progress * 100)}%` : "Saving"}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const mediaStatus: Record<Exclude<MediaAsset["status"], "ready">, string> = {
  uploading: "Uploading",
  processing: "Processing",
  error: "Failed",
};

/** Dashed drop target that also opens the file picker on click. */
function Dropzone({
  accepts,
  title,
  hint,
  onBrowse,
  onFiles,
}: {
  accepts: (file: File) => boolean;
  title: string;
  hint: string;
  onBrowse: () => void;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <button
      type="button"
      onClick={onBrowse}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const files = [...event.dataTransfer.files].filter(accepts);
        if (files.length) onFiles(files);
      }}
      className={cn(
        "flex w-full flex-col items-center gap-1 rounded-xl border border-dashed px-6 py-8 text-center transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        over && "border-primary bg-secondary",
      )}
    >
      <UploadIcon className="mb-2 size-5" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </button>
  );
}

function NothingFound({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}

/* Skills */

function SkillForm({
  skill,
  onSave,
  onDelete,
}: {
  skill: Skill | null;
  onSave: (fields: Pick<Skill, "title" | "description">) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(skill?.title ?? "");
  const [description, setDescription] = useState(skill?.description ?? "");

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ title: title.trim(), description: description.trim() });
      }}
    >
      <SheetHeader>
        <SheetTitle>{skill ? "Edit Skill" : "New Skill"}</SheetTitle>
        {/* <SheetDescription>
          The workflow reads every skill and follows the ones that apply to the person and the experience.
        </SheetDescription> */}
      </SheetHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-2">
        <FieldGroup className="flex-1">
          <Field>
            <FieldLabel htmlFor="skill-title">Title</FieldLabel>
            <Input
              id="skill-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Pre-Show Dinner"
              autoFocus
            />
          </Field>
          <Field className="flex-1">
            <FieldLabel htmlFor="skill-description">Description</FieldLabel>
            <Textarea
              id="skill-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Pick one restaurant near the venue that seats before 6:30pm. Use when the itinerary covers the evening before doors."
              className="min-h-64 flex-1 resize-none"
            />
            <FieldDescription>Say what to do, then when to use it.</FieldDescription>
          </Field>
        </FieldGroup>
      </div>
      <SheetFooter className="flex-row items-center justify-between">
        {skill ? (
          <ConfirmDeleteButton
            label="Delete Skill"
            confirmTitle="Delete this skill?"
            confirmDescription={
              <>
                Experiences generated from now on won't use <strong>{skill.title}</strong>.
                Ones already sent keep what they have.
              </>
            }
            onConfirm={onDelete}
          />
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <SheetClose render={<Button variant="ghost" size="sm" />}>Cancel</SheetClose>
          <Button type="submit" size="sm" disabled={!title.trim() || !description.trim()}>
            {skill ? "Save Changes" : "Add Skill"}
          </Button>
        </div>
      </SheetFooter>
    </form>
  );
}

function Skills({
  skills,
  onOpen,
}: {
  skills: Skill[];
  onOpen: (skill: Skill) => void;
}) {
  if (skills.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SparklesIcon />
          </EmptyMedia>
          <EmptyTitle>No Skills Yet</EmptyTitle>
          <EmptyDescription>
            Skills teach the workflow your way of doing things: your voice, the places you
            partner with and anything to steer clear of.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }


  return (
    <Table interactive>
      <TableBody>
        {skills.map((skill) => (
          <TableRow key={skill.id} onClick={() => onOpen(skill)}>
            <TableCell className="h-22 w-full max-w-0">
              <button
                type="button"
                className="flex w-full flex-col gap-1 text-left outline-none"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(skill);
                }}
              >
                <span className="text-base font-medium">{skill.title}</span>
                <span className="truncate text-sm text-muted-foreground" title={skill.description}>
                  {skill.description}
                </span>
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* Images */

function ImageForm({
  image,
  onSave,
  onDelete,
}: {
  image: ImageAsset;
  onSave: (fields: Pick<ImageAsset, "name" | "alt">) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(image.name);
  const [alt, setAlt] = useState(image.alt);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name: name.trim(), alt: alt.trim() });
      }}
    >
      <DialogHeader>
        <DialogTitle className="truncate pr-8">{image.name}</DialogTitle>
        <DialogDescription>
          {image.width} × {image.height} · {fileSize(image.bytes)} · Added{" "}
          {daysAgo(image.addedDaysAgo).toLowerCase()}
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center rounded-lg bg-secondary">
        <img src={image.url} alt={image.alt} className="max-h-80 rounded-lg object-contain" />
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="image-name">File name</FieldLabel>
          <Input id="image-name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="image-alt">Alt text</FieldLabel>
          <Input
            id="image-alt"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="What's in the picture"
          />
          <FieldDescription>
            Read aloud by screen readers. The workflow also uses it to decide where the image fits.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <DialogFooter className="sm:justify-between">
        <ConfirmDeleteButton
          label="Delete Image"
          confirmTitle="Delete this image?"
          confirmDescription={
            <>
              <strong>{image.name}</strong> will be removed from Context and from any experience
              that shows it.
            </>
          }
          onConfirm={onDelete}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <DialogClose render={<Button variant="ghost" size="sm" />}>Cancel</DialogClose>
          <Button type="submit" size="sm" disabled={!name.trim()}>
            Save Changes
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

function Images({
  images,
  uploads,
  onBrowse,
  onFiles,
  onOpen,
}: {
  images: ImageAsset[];
  uploads: Upload[];
  onBrowse: () => void;
  onFiles: (files: File[]) => void;
  onOpen: (image: ImageAsset) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <Dropzone
        accepts={(file) => file.type.startsWith("image/")}
        title="Drop images here, or click to browse"
        hint="JPG, PNG, WebP or GIF, up to 10 MB"
        onBrowse={onBrowse}
        onFiles={onFiles}
      />
      <UploadList uploads={uploads} />
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => onOpen(image)}
                className="group flex w-full flex-col gap-3 text-left outline-none"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-secondary group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
                  <img
                    src={image.url}
                    alt={image.alt}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium" title={image.name}>
                    {image.name}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {image.width} × {image.height} · {fileSize(image.bytes)}
                    {!image.alt && " · No alt text"}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Media */

function MediaForm({
  item,
  onSave,
  onDelete,
}: {
  item: MediaAsset;
  onSave: (fields: Pick<MediaAsset, "name">) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name);
  const label = mediaKinds[item.kind];

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ name: name.trim() });
      }}
    >
      <DialogHeader>
        <DialogTitle className="truncate pr-8">{item.name}</DialogTitle>
        <DialogDescription>
          {label} · {item.seconds ? `${duration(item.seconds)} · ` : ""}
          {fileSize(item.bytes)} · Added{" "}
          {daysAgo(item.addedDaysAgo).toLowerCase()}
        </DialogDescription>
      </DialogHeader>
      {item.embed ? (
        <iframe
          src={item.embed}
          title={item.name}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-lg bg-black"
        />
      ) : item.url ? (
        <audio src={item.url} controls className="w-full" />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg bg-secondary text-muted-foreground">
          {item.kind === "video" ? <FilmIcon className="size-6" /> : <AudioLinesIcon className="size-6" />}
          <span className="text-sm">
            {item.status === "ready"
              ? "Sample file, so there's nothing to play"
              : item.status === "error"
                ? "Stream couldn't process this video"
                : "Stream is still processing this video"}
          </span>
        </div>
      )}
      <Field>
        <FieldLabel htmlFor="media-name">File name</FieldLabel>
        <Input id="media-name" value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <DialogFooter className="sm:justify-between">
        <ConfirmDeleteButton
          label={`Delete ${label}`}
          confirmTitle={`Delete this ${label.toLowerCase()}?`}
          confirmDescription={
            <>
              <strong>{item.name}</strong> will be removed from Context and from any experience
              that plays it.
            </>
          }
          onConfirm={onDelete}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <DialogClose render={<Button variant="ghost" size="sm" />}>Cancel</DialogClose>
          <Button type="submit" size="sm" disabled={!name.trim()}>
            Save Changes
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

function Media({
  media,
  uploads,
  kind,
  onBrowse,
  onFiles,
  onOpen,
}: {
  media: MediaAsset[];
  uploads: Upload[];
  kind: MediaKind | "all";
  onBrowse: () => void;
  onFiles: (files: File[]) => void;
  onOpen: (item: MediaAsset) => void;
}) {
  const rows = media.filter(
    (item) => kind === "all" || item.kind === kind,
  );

  return (
    <div className="flex flex-col gap-8">
      <Dropzone
        accepts={(file) => file.type.startsWith("video/") || file.type.startsWith("audio/")}
        title="Drop video or audio here, or click to browse"
        hint="Video up to 200 MB, audio up to 50 MB"
        onBrowse={onBrowse}
        onFiles={onFiles}
      />
      <UploadList uploads={uploads} />
      {media.length > 0 && rows.length === 0 && <NothingFound>No media matches.</NothingFound>}
      {rows.length > 0 && (
        <Table interactive>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead className="text-right">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => {
              const Icon = item.kind === "video" ? FilmIcon : AudioLinesIcon;
              return (
                <TableRow key={item.id} onClick={() => onOpen(item)}>
                  <TableCell className="h-16 w-full max-w-0">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 text-left outline-none"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(item);
                      }}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                        {item.poster ? (
                          <img src={item.poster} alt="" className="size-full object-cover" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </span>
                      <span className="truncate font-medium" title={item.name}>
                        {item.name}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{mediaKinds[item.kind]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.status === "ready" ? (
                      duration(item.seconds)
                    ) : (
                      <span className={cn("text-muted-foreground", item.status === "error" && "text-destructive")}>
                        {mediaStatus[item.status]}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {fileSize(item.bytes)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                    {daysAgo(item.addedDaysAgo)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/* Page */

type Selection =
  | { view: "skills"; item: Skill | null }
  | { view: "images"; item: ImageAsset }
  | { view: "media"; item: MediaAsset };

export default function Context({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("view");
  const view: View = views.find((v) => v === param) ?? "skills";

  const { workspaceId, skills, images, media } = loaderData;
  const [kind, setKind] = useState<MediaKind | "all">("all");
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const save = (fields: Record<string, string>) => {
    fetcher.submit(fields, { method: "post" });
    setOpen(false);
  };

  // Kept after closing so the dialog doesn't empty out while it animates away.
  const [selection, setSelection] = useState<Selection | null>(null);
  const [open, setOpen] = useState(false);
  const show = (next: Selection) => {
    setSelection(next);
    setOpen(true);
  };

  const imageInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);

  const [uploads, setUploads] = useState<{ images: Upload[]; media: Upload[] }>({ images: [], media: [] });

  /** Uploads one at a time, then reloads the list. Failed ones stay listed with the reason. */
  async function upload(view: "images" | "media", files: File[]) {
    const queued = files.map((file) => ({ id: crypto.randomUUID(), name: file.name, progress: 0, error: null }));
    const patch = (id: string, fields: Partial<Upload>) =>
      setUploads((current) => ({
        ...current,
        [view]: current[view].map((u) => (u.id === id ? { ...u, ...fields } : u)),
      }));
    setUploads((current) => ({ ...current, [view]: [...current[view].filter((u) => !u.error), ...queued] }));

    for (const [i, file] of files.entries()) {
      const { id } = queued[i];
      try {
        await uploadFile(workspaceId, file, (progress) => patch(id, { progress }));
        await revalidator.revalidate();
        setUploads((current) => ({ ...current, [view]: current[view].filter((u) => u.id !== id) }));
      } catch (error) {
        patch(id, { error: error instanceof Error ? error.message : "Upload failed" });
      }
    }
  }

  // Stream takes a minute or so to encode, so check back until it's done.
  const waiting = media.some((item) => item.status === "uploading" || item.status === "processing");
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => revalidator.revalidate(), 5000);
    return () => clearInterval(timer);
  }, [waiting]);

  const action = {
    skills: (
      <Button size="sm" onClick={() => show({ view: "skills", item: null })}>
        <PlusIcon data-icon="inline-start" />
        New Skill
      </Button>
    ),
    images: (
      <Button size="sm" onClick={() => imageInput.current?.click()}>
        <UploadIcon data-icon="inline-start" />
        Upload Images
      </Button>
    ),
    media: (
      <Button size="sm" onClick={() => mediaInput.current?.click()}>
        <UploadIcon data-icon="inline-start" />
        Upload Media
      </Button>
    ),
  }[view];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <PageHeader
        title="Context"
        docs={contextDocs[view]}
        // description="What Loro knows about your brand. Every experience draws on it, alongside each person's profile and Qloo."
        actions={action}
      />

      <div className="flex flex-col gap-6">
        <Tabs
          value={view}
          onValueChange={(value) => {
            setSearchParams(value === "skills" ? {} : { view: value }, {
              preventScrollReset: true,
            });
          }}
        >
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="skills">
              Skills
              <span className="text-muted-foreground tabular-nums">{skills.length}</span>
            </TabsTrigger>
            <TabsTrigger value="images">
              Images
              <span className="text-muted-foreground tabular-nums">{images.length}</span>
            </TabsTrigger>
            <TabsTrigger value="media">
              Media
              <span className="text-muted-foreground tabular-nums">{media.length}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {view === "media" && (
          <div className="flex">
            <Select
              items={kindFilter}
              value={kind}
              onValueChange={(value) => setKind(value as MediaKind | "all")}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(kindFilter).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {view === "skills" && (
          <Skills skills={skills} onOpen={(item) => show({ view: "skills", item })} />
        )}
        {view === "images" && (
          <Images
            images={images}
            uploads={uploads.images}
            onBrowse={() => imageInput.current?.click()}
            onFiles={(files) => upload("images", files)}
            onOpen={(item) => show({ view: "images", item })}
          />
        )}
        {view === "media" && (
          <Media
            media={media}
            uploads={uploads.media}
            kind={kind}
            onBrowse={() => mediaInput.current?.click()}
            onFiles={(files) => upload("media", files)}
            onOpen={(item) => show({ view: "media", item })}
          />
        )}
      </div>

      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) upload("images", [...event.target.files]);
          event.target.value = "";
        }}
      />
      <input
        ref={mediaInput}
        type="file"
        accept="video/*,audio/*"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) upload("media", [...event.target.files]);
          event.target.value = "";
        }}
      />

      <Sheet open={open && selection?.view === "skills"} onOpenChange={setOpen}>
        <SheetContent className="gap-0 data-[side=right]:sm:max-w-2xl">
          {selection?.view === "skills" && (
            <SkillForm
              key={selection.item?.id ?? "new"}
              skill={selection.item}
              onSave={(fields) => save({ intent: "save-skill", id: selection.item?.id ?? "", ...fields })}
              onDelete={() => save({ intent: "delete-skill", id: selection.item?.id ?? "" })}
            />
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={open && (selection?.view === "images" || selection?.view === "media")}
        onOpenChange={setOpen}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          {selection?.view === "images" && (
            <ImageForm
              key={selection.item.id}
              image={selection.item}
              onSave={(fields) => save({ intent: "save-file", id: selection.item.id, ...fields })}
              onDelete={() => save({ intent: "delete-file", id: selection.item.id })}
            />
          )}
          {selection?.view === "media" && (
            <MediaForm
              key={selection.item.id}
              item={selection.item}
              onSave={(fields) => save({ intent: "save-file", id: selection.item.id, ...fields })}
              onDelete={() => save({ intent: "delete-file", id: selection.item.id })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
