import { createCookie } from "react-router";

/**
 * Per-viewer choices: which workspace they're in and the admin appearance.
 * A cookie rather than localStorage so the server renders the right
 * workspace and mode on the first paint. Workspaces themselves live in D1.
 */

export const modes = ["light", "dark", "q"] as const;
export type Mode = (typeof modes)[number];

export const isMode = (value: unknown): value is Mode => modes.includes(value as Mode);

/** Q, after qloo.com. Light and Dark are the plain admin. */
export const DEFAULT_MODE: Mode = "q";

export type Preferences = {
  /** Null until they pick one on the Workspaces page. */
  workspaceId: string | null;
  mode: Mode;
};

const cookie = createCookie("loro-prefs", {
  path: "/",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
});

export async function readPreferences(request: Request): Promise<Preferences> {
  const value = (await cookie.parse(request.headers.get("Cookie"))) ?? {};
  return {
    workspaceId: typeof value.workspaceId === "string" ? value.workspaceId : null,
    mode: isMode(value.appearance) ? value.appearance : DEFAULT_MODE,
  };
}

/**
 * The mode is only stored when it isn't the default, so a change of default
 * reaches everyone who never picked one. (It used to be stored as `mode`,
 * always, which is why the key is now `appearance`.)
 */
export function savePreferences({ workspaceId, mode }: Preferences) {
  return cookie.serialize({ workspaceId, ...(mode !== DEFAULT_MODE && { appearance: mode }) });
}
