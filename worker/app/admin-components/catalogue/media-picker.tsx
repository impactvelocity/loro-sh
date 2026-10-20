/**
 * Image and media fields. The field shows what's picked; the library
 * drawer picks from Context, uploads a new file or takes a pasted link.
 */
import { createContext, use, useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";
import { CheckIcon, FilmIcon, ImageIcon, UploadIcon } from "lucide-react";

import type { Media } from "@core/catalogue/fields";
import type { ImageAsset, MediaAsset } from "@core/context";
import { Button } from "@/admin-components/ui/button";
import { Input } from "@/admin-components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/admin-components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { duration } from "@/lib/format";
import { uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";

/**
 * Context's images, videos and skills, offered by image, media and skills
 * fields. Without a workspace (the catalogue playground) there's nowhere
 * to upload to, and no skills.
 */
export type Library = {
  images: ImageAsset[];
  videos: MediaAsset[];
  workspaceId: string | null;
  skills?: { id: string; title: string; description: string }[];
};
export const EditorLibrary = createContext<Library>({ images: [], videos: [], workspaceId: null });

type Kind = Media["type"];

/** One tile in the drawer, image or video. */
type Item = { id: string; name: string; url: string | null; thumb: string | null; detail: string };

const kindNames: Record<Kind, { one: string; many: string }> = {
  image: { one: "Image", many: "Images" },
  video: { one: "Video", many: "Videos" },
};

const videoStatus: Record<MediaAsset["status"], string> = {
  uploading: "Uploading",
  processing: "Processing",
  error: "Failed",
  ready: "",
};

function itemsOf(library: Library, kind: Kind): Item[] {
  if (kind === "image") {
    return library.images.map((image) => ({
      id: image.id,
      name: image.name,
      url: image.url,
      thumb: image.url,
      detail: `${image.width} × ${image.height}`,
    }));
  }
  return library.videos.map((video) => ({
    id: video.id,
    name: video.name,
    // Only a finished video can be placed.
    url: video.status === "ready" ? video.url : null,
    thumb: video.poster,
    detail: video.status === "ready" ? duration(video.seconds) : videoStatus[video.status],
  }));
}

/** The library entry for a picked URL, if it came from Context. */
function findItem(library: Library, kind: Kind, url: string) {
  return url ? itemsOf(library, kind).find((item) => item.url === url) : undefined;
}

/** A pasted link's file name, for the caption under the preview. */
function nameFromUrl(url: string) {
  try {
    const { pathname, hostname } = new URL(url);
    const last = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
    return last.includes(".") ? last : hostname;
  } catch {
    return url;
  }
}

/** A file on its way up, shown as a tile until the library reloads with it. */
type Upload = { id: string; name: string; progress: number; error: string | null };

/**
 * The library on its own, for pickers outside the experience editor. Wrap
 * it in EditorLibrary. `links` off keeps the choice to Context's files.
 */
export function LibraryDrawer({
  open,
  onOpenChange,
  kinds,
  value,
  onPick,
  links = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kinds: readonly Kind[];
  value: Media;
  onPick: (media: Media) => void;
  links?: boolean;
}) {
  const library = use(EditorLibrary);
  const revalidator = useRevalidator();
  const [tab, setTab] = useState<Kind>(kinds.includes(value.type) ? value.type : kinds[0]);
  const [link, setLink] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const items = itemsOf(library, tab);
  const names = kindNames[tab];
  const title = kinds.length > 1 ? "Choose Media" : `Choose ${names.one}`;
  const workspaceId = library.workspaceId;

  // Start on what's picked each time it opens.
  useEffect(() => {
    if (!open) return;
    setTab(kinds.includes(value.type) ? value.type : kinds[0]);
    setLink(findItem(library, value.type, value.url) ? "" : value.url);
  }, [open]);

  // Stream takes a minute or so to encode, so check back while the drawer is open.
  const waiting = library.videos.some((video) => video.status === "uploading" || video.status === "processing");
  useEffect(() => {
    if (!open || !waiting) return;
    const timer = setInterval(() => revalidator.revalidate(), 5000);
    return () => clearInterval(timer);
  }, [open, waiting]);

  const pick = (media: Media) => {
    onPick(media);
    onOpenChange(false);
  };

  /** One at a time. A single image is picked as soon as it's stored; video waits for Stream. */
  async function upload(files: File[]) {
    if (!workspaceId) return;
    const kind = tab;
    const queued = files.map((file) => ({ id: crypto.randomUUID(), name: file.name, progress: 0, error: null }));
    const patch = (id: string, fields: Partial<Upload>) =>
      setUploads((current) => current.map((u) => (u.id === id ? { ...u, ...fields } : u)));
    setUploads((current) => [...current.filter((u) => !u.error), ...queued]);

    for (const [i, file] of files.entries()) {
      const { id } = queued[i];
      try {
        const saved = await uploadFile(workspaceId, file, (progress) => patch(id, { progress }));
        await revalidator.revalidate();
        setUploads((current) => current.filter((u) => u.id !== id));
        if (files.length === 1 && saved?.url) pick({ type: kind, url: saved.url });
      } catch (error) {
        patch(id, { error: error instanceof Error ? error.message : "Upload failed" });
      }
    }
  }

  const accepts = (file: File) => file.type.startsWith(`${tab}/`);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-6 pr-16">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {workspaceId && (
            <Button size="sm" onClick={() => fileInput.current?.click()}>
              <UploadIcon data-icon="inline-start" />
              Upload {names.one}
            </Button>
          )}
        </div>

        {kinds.length > 1 && (
          <Tabs value={tab} onValueChange={(next) => setTab(next as Kind)} className="shrink-0 px-6 pt-4">
            <TabsList variant="line" className="w-full justify-start">
              {kinds.map((kind) => (
                <TabsTrigger key={kind} value={kind}>
                  {kindNames[kind].many}
                  <span className="text-muted-foreground tabular-nums">{itemsOf(library, kind).length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div
          onDragOver={(event) => {
            if (!workspaceId) return;
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            if (!workspaceId) return;
            event.preventDefault();
            setOver(false);
            const files = [...event.dataTransfer.files].filter(accepts);
            if (files.length) upload(files);
          }}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto p-6 transition-colors",
            over && "bg-secondary ring-2 ring-primary ring-inset",
          )}
        >
          {items.length === 0 && uploads.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed px-6 py-12 text-center">
              <span className="text-sm font-medium">No {names.many.toLowerCase()} in Context yet</span>
              <span className="text-sm text-muted-foreground">
                {workspaceId
                  ? "Upload one, or drop it here. It's saved to Context for every experience."
                  : links
                    ? "Paste a link below."
                    : "Add images in Context first."}
              </span>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              {uploads.map((upload) => (
                <li key={upload.id} className="flex flex-col gap-2">
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-secondary px-3 text-center text-xs">
                    {upload.error ? (
                      <span className="text-destructive">{upload.error}</span>
                    ) : (
                      <span className="text-muted-foreground tabular-nums">
                        {upload.progress < 1 ? `${Math.round(upload.progress * 100)}%` : "Saving"}
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs" title={upload.name}>
                    {upload.name}
                  </span>
                </li>
              ))}
              {items.map((item) => {
                const selected = value.type === tab && item.url !== null && value.url === item.url;
                const Placeholder = tab === "image" ? ImageIcon : FilmIcon;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!item.url}
                      aria-pressed={selected}
                      onClick={() => item.url && pick({ type: tab, url: item.url })}
                      className="group flex w-full flex-col gap-2 text-left outline-none disabled:cursor-not-allowed"
                    >
                      <span
                        className={cn(
                          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-secondary group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2",
                          selected && "ring-2 ring-primary ring-offset-2",
                        )}
                      >
                        {item.thumb ? (
                          <img
                            src={item.thumb}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-300 ease-out group-enabled:group-hover:scale-[1.03] group-disabled:opacity-50"
                          />
                        ) : (
                          <Placeholder className="size-5 text-muted-foreground" />
                        )}
                        {selected && (
                          <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <CheckIcon className="size-3" />
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-medium" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">{item.detail}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {links && (
          <div className="shrink-0 border-t p-6">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (link.trim()) pick({ type: tab, url: link.trim() });
              }}
            >
              <Input
                aria-label={`${names.one} link`}
                placeholder={tab === "image" ? "Or paste an image link" : "Or paste a video link (.mp4)"}
                value={link}
                onChange={(event) => setLink(event.target.value)}
                className="h-9 text-sm"
              />
              <Button type="submit" variant="secondary" size="sm" disabled={!link.trim()}>
                Use Link
              </Button>
            </form>
          </div>
        )}

        <input
          ref={fileInput}
          type="file"
          accept={`${tab}/*`}
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) upload([...event.target.files]);
            event.target.value = "";
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

/** What's picked: a preview that reopens the drawer, its name, and a way to clear it. */
function Picked({
  id,
  kinds,
  value,
  onChange,
}: {
  id: string;
  kinds: readonly Kind[];
  value: Media;
  onChange: (media: Media) => void;
}) {
  const library = use(EditorLibrary);
  const [open, setOpen] = useState(false);
  const item = findItem(library, value.type, value.url);
  const noun = kinds.length > 1 ? "Media" : kindNames[kinds[0]].one;

  return (
    <>
      {value.url ? (
        <div className="flex flex-col gap-2">
          <button
            id={id}
            type="button"
            aria-label={`Replace ${noun.toLowerCase()}`}
            onClick={() => setOpen(true)}
            className="group relative aspect-video w-full overflow-hidden rounded-lg bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {value.type === "image" ? (
              <img src={value.url} alt="" className="size-full object-cover" />
            ) : item?.thumb ? (
              <img src={item.thumb} alt="" className="size-full object-cover" />
            ) : (
              <video src={value.url} muted playsInline preload="metadata" className="size-full object-cover" />
            )}
            {value.type === "video" && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white">
                <FilmIcon className="size-3" />
                Video
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Replace
            </span>
          </button>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm text-muted-foreground" title={item?.name ?? value.url}>
              {item?.name ?? nameFromUrl(value.url)}
            </span>
            <Button variant="ghost" size="sm" className="-mr-3 shrink-0" onClick={() => onChange({ ...value, url: "" })}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          id={id}
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {kinds.length > 1 ? <FilmIcon className="size-4" /> : <ImageIcon className="size-4" />}
          Choose {noun}
        </button>
      )}
      <LibraryDrawer open={open} onOpenChange={setOpen} kinds={kinds} value={value} onPick={onChange} />
    </>
  );
}

const imageOnly = ["image"] as const;
const imageOrVideo = ["image", "video"] as const;

export function ImagePicker({ id, value, onChange }: { id: string; value: string; onChange: (url: string) => void }) {
  return (
    <Picked id={id} kinds={imageOnly} value={{ type: "image", url: value }} onChange={(media) => onChange(media.url)} />
  );
}

export function MediaPicker({ id, value, onChange }: { id: string; value: Media; onChange: (media: Media) => void }) {
  return <Picked id={id} kinds={imageOrVideo} value={value} onChange={onChange} />;
}
