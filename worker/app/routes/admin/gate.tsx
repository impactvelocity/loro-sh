import { redirect } from "react-router";

import type { Route } from "./+types/gate";
import { hasAdminSession } from "@core/admin-auth.server";
import { findWorkspace } from "@core/workspaces.server";
import { readPreferences, savePreferences } from "@/lib/preferences";

/** The showcase workspace a `?demo` link opens, for judges and the sales page. */
const DEMO_WORKSPACE_ID = "demo-experiences";

/**
 * What a visitor who hasn't unlocked the admin may still post: picking a
 * workspace and a mode, which only set their own cookie.
 */
const preferenceIntents: Record<string, string> = {
  "/admin/workspaces": "switch",
  "/admin/settings": "mode",
};

async function choosesPreference(request: Request, path: string) {
  const intent = preferenceIntents[path];
  if (!intent) return false;
  try {
    return (await request.clone().formData()).get("intent") === intent;
  } catch {
    return false;
  }
}

/**
 * `?demo` on any admin page (app.loro.sh/admin?demo=1) switches the viewer
 * to the Demo Experiences workspace and drops the param, so one link opens
 * the showcase without picking a workspace first.
 */
async function openDemo(request: Request) {
  const url = new URL(request.url);
  if (!url.searchParams.has("demo")) return;
  url.searchParams.delete("demo");
  url.searchParams.delete("_routes");
  const to = url.pathname.replace(/\.data$/, "") + url.search;
  if (!(await findWorkspace(DEMO_WORKSPACE_ID))) throw redirect(to);
  const preferences = await readPreferences(request);
  preferences.workspaceId = DEMO_WORKSPACE_ID;
  throw redirect(to, { headers: { "Set-Cookie": await savePreferences(preferences) } });
}

/**
 * Wraps every admin route. With ADMIN_PASSWORD set, anyone can look: page
 * loads and loaders run as usual, view only. Any other change (an action)
 * without the unlock cookie goes to /login, and comes back here after.
 * The pages hide what would change something (`useReadOnly`); this is what
 * actually stops it.
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request }) => {
    if (request.method === "GET" || request.method === "HEAD") return openDemo(request);
    if (await hasAdminSession(request)) return;
    const url = new URL(request.url);
    // Data requests carry a .data suffix and a _routes param; send them back to the page itself.
    url.searchParams.delete("_routes");
    url.searchParams.delete("index");
    const path = url.pathname.replace(/\.data$/, "");
    if (await choosesPreference(request, path)) return;
    throw redirect(`/login?next=${encodeURIComponent(path + url.search)}`);
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  return { readOnly: !(await hasAdminSession(request)) };
}
