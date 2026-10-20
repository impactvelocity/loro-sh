import { useState } from "react";
import {
  ArchiveIcon,
  CopyIcon,
  ExternalLinkIcon,
  MapIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react";

import type { ExperienceMeta } from "@core/experiences";
import {
  type ExperienceStatus,
  type PersonExperience,
  experienceStatusLabels,
} from "@core/profiles";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/admin-components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import { Spinner } from "@/admin-components/ui/spinner";
import { Switch } from "@/admin-components/ui/switch";
import { minutesAgo } from "@/lib/format";

const badgeVariant: Record<ExperienceStatus, "default" | "secondary" | "outline"> = {
  generating: "secondary",
  review: "default",
  delivered: "outline",
  opened: "secondary",
};

function activity(item: PersonExperience) {
  const created = minutesAgo(item.createdMinutesAgo);
  switch (item.status) {
    case "generating":
      return `Started ${created}`;
    case "review":
      return `Ready ${created}, waiting for you to send it`;
    case "delivered":
      return `Sent ${created}, not opened yet`;
    case "opened":
      return `Opened ${item.opens} ${item.opens === 1 ? "time" : "times"}, last ${minutesAgo(item.lastOpenedMinutesAgo ?? 0)}`;
  }
}

function ExperienceRow({
  item,
  type,
  onSend,
}: {
  item: PersonExperience;
  type?: ExperienceMeta;
  onSend: () => void;
}) {
  const href = `/f/${item.experience}`;

  return (
    <li className="flex items-start gap-4 p-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
        {item.status === "generating" ? <Spinner className="size-5" /> : <MapIcon className="size-5" />}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-medium text-pretty">{item.title}</span>
        <span className="text-sm text-muted-foreground">
          {type?.name ?? item.experience} · {item.anchor.name}
          {item.anchor.date && `, ${item.anchor.date}`}
          {item.anchor.place && ` · ${item.anchor.place}`}
        </span>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <Badge variant={badgeVariant[item.status]}>{experienceStatusLabels[item.status]}</Badge>
          <span className="text-xs text-muted-foreground">{activity(item)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-center">
        {item.status === "review" ? (
          <Button size="sm" onClick={onSend}>
            <SendIcon data-icon="inline-start" />
            Review & Send
          </Button>
        ) : item.status !== "generating" ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            View
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label={`More for ${item.title}`} />}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              disabled={item.status === "generating"}
              onClick={() => navigator.clipboard?.writeText(new URL(href, location.origin).href)}
            >
              <CopyIcon />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem disabled={item.status === "generating" || item.status === "review"}>
              <SendIcon />
              Resend
            </DropdownMenuItem>
            <DropdownMenuItem disabled={item.status === "generating"}>
              <RefreshCwIcon />
              Regenerate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ArchiveIcon />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function NewExperience({
  types,
  onCreate,
}: {
  types: ExperienceMeta[];
  onCreate: (input: { experience: string; anchor: string; review: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [experience, setExperience] = useState(types[0]?.slug ?? "");
  const [anchor, setAnchor] = useState("");
  const [review, setReview] = useState(true);
  const items = Object.fromEntries(types.map((type) => [type.slug, type.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        New Experience
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!anchor.trim()) return;
            onCreate({ experience, anchor: anchor.trim(), review });
            setAnchor("");
            setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>New Experience</DialogTitle>
            <DialogDescription>
              Built from their intake, taste signals and segment.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Experience</FieldLabel>
              <Select items={items} value={experience} onValueChange={(value) => setExperience(String(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.slug} value={type.slug}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="anchor">Built around</FieldLabel>
              <Input
                id="anchor"
                value={anchor}
                onChange={(event) => setAnchor(event.target.value)}
                placeholder="An event, booking or product"
                autoFocus
              />
              <FieldDescription>For example: Black Pumas, Fri 4 Dec, Stubb's</FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Switch id="review" checked={review} onCheckedChange={setReview} />
              <FieldLabel htmlFor="review">Let me review it before it's sent</FieldLabel>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm" />}>Cancel</DialogClose>
            <Button type="submit" size="sm" disabled={!anchor.trim()}>
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Every experience generated for one person, newest first. */
export function PersonExperiences({
  initial,
  types,
  canCreate,
}: {
  initial: PersonExperience[];
  types: ExperienceMeta[];
  /** False until intake is finished (owner-created profiles can always). */
  canCreate: boolean;
}) {
  const [items, setItems] = useState(initial);
  const typeFor = (slug: string) => types.find((type) => type.slug === slug);

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 ? (
        <ul className="flex flex-col divide-y rounded-xl ring-1 ring-border">
          {items.map((item) => (
            <ExperienceRow
              key={item.id}
              item={item}
              type={typeFor(item.experience)}
              onSend={() =>
                setItems((current) =>
                  current.map((entry) =>
                    entry.id === item.id ? { ...entry, status: "delivered", createdMinutesAgo: 0 } : entry,
                  ),
                )
              }
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Nothing yet. Their first experience is generated when they finish intake.
        </div>
      )}
      {canCreate && (
        <div>
          <NewExperience
            types={types}
            onCreate={({ experience, anchor, review }) => {
              const [name, date = "", place = ""] = anchor.split(",").map((part) => part.trim());
              const id = `exp-new-${Date.now()}`;
              setItems((current) => [
                {
                  id,
                  experience,
                  title: `${typeFor(experience)?.name ?? "Experience"} for ${name}`,
                  anchor: { name, date, place },
                  status: "generating",
                  createdMinutesAgo: 0,
                  opens: 0,
                },
                ...current,
              ]);
              // Mock generation: settle after a moment.
              setTimeout(() => {
                setItems((current) =>
                  current.map((entry) =>
                    entry.id === id ? { ...entry, status: review ? "review" : "delivered" } : entry,
                  ),
                );
              }, 2500);
            }}
          />
        </div>
      )}
    </div>
  );
}
