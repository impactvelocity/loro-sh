/**
 * A workspace is one brand's Loro: its profiles, experiences and Context.
 * All of them share one D1 database, keyed by workspace_id; reads and
 * writes are in workspaces.server.ts. This file is safe for the browser.
 */
export const verticals = {
  events: "Events",
  real_estate: "Real estate",
  retail: "Retail",
  other: "Other",
} as const;
export type Vertical = keyof typeof verticals;

export type Workspace = {
  id: string;
  name: string;
  /** One line on what the brand does, shown under the name. */
  tagline: string;
  vertical: Vertical;
  location: string;
  host: string | null;
  cover: string | null;
  /** Read-only examples. None are made yet; the column is ready for them. */
  demo: boolean;
  experiences: number;
  segments: number;
  profiles: number;
  updatedAt: number;
};

export const NAME_MAX = 60;
export const TAGLINE_MAX = 120;

/** "Real estate · Austin, TX", leaving out whatever isn't set. */
export function workspaceSubtitle(workspace: Pick<Workspace, "vertical" | "location">) {
  return [workspace.vertical === "other" ? "" : verticals[workspace.vertical], workspace.location]
    .filter(Boolean)
    .join(" · ");
}

/** A URL-safe id from a name, unique among the ones given. */
export function workspaceId(name: string, taken: string[]) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_]+/g, "-")
      .slice(0, 40)
      .replace(/^-+|-+$/g, "") || "workspace";
  let id = base;
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`;
  return id;
}
