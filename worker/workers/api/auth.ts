/**
 * Writes need an API key for the workspace, sent as a bearer token:
 *
 *   Authorization: Bearer loro_sk_…
 *
 * Reads and the public experience flow (sign-up, answers after a sign-up,
 * feedback, runs) stay open, like the admin and the pages. Keys are made
 * under Connect → Keys, or come back from POST /api/workspaces.
 *
 * With ADMIN_PASSWORD set, everything but the public experience flow also
 * needs a key or the admin's sign-in cookie (`adminGate`), so the password
 * covers what the admin shows, not just its pages.
 */
import { createMiddleware } from "hono/factory";

import { adminLocked, hasAdminSession } from "@core/admin-auth.server";
import { verifyApiKey } from "@core/api-keys.server";
import { ApiError, type WorkspaceEnv } from "./http";

export function bearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

/** True when the request carries a valid key for this workspace. Throws on a wrong one. */
export async function hasKey(workspaceId: string, header: string | undefined) {
  const token = bearerToken(header);
  if (!token) return false;
  if (!(await verifyApiKey(workspaceId, token))) throw new ApiError(401, "That API key isn't valid for this workspace.");
  return true;
}

export const requireKey = createMiddleware<WorkspaceEnv>(async (c, next) => {
  const workspace = c.get("workspace");
  if (workspace.demo) throw new ApiError(403, "Demo workspaces are read-only.");
  if (!(await hasKey(workspace.id, c.req.header("authorization")))) {
    throw new ApiError(401, "Send an API key as a bearer token. Make one under Connect → Keys.");
  }
  await next();
});

/** What a public experience page calls, open with or without a password. Paths are under /workspaces/:workspace. */
const publicRoutes: [method: string, path: RegExp][] = [
  ["GET", /^\/experiences\/[^/]+(\/questions)?$/],
  ["POST", /^\/experiences\/[^/]+\/(optin|submissions|feedback)$/],
  ["GET", /^\/experiences\/[^/]+\/runs\/[^/]+(\/events)?$/],
];

const signInMessage = "Sign in to the admin, or send an API key as a bearer token.";

/** Routes under /workspaces/:workspace, once it's found. */
export const adminGate = createMiddleware<WorkspaceEnv>(async (c, next) => {
  if (adminLocked()) {
    const path = c.req.path.replace(/^.*?\/workspaces\/[^/]+/, "");
    const open = publicRoutes.some(([method, pattern]) => method === c.req.method && pattern.test(path));
    if (!open && !(await hasAdminSession(c.req.raw)) && !(await hasKey(c.get("workspaceId"), c.req.header("authorization")))) {
      throw new ApiError(401, signInMessage);
    }
  }
  await next();
});

/** Routes above any one workspace (listing and making them): only the admin's sign-in. */
export const requireAdmin = createMiddleware(async (c, next) => {
  if (!(await hasAdminSession(c.req.raw))) throw new ApiError(401, "Sign in to the admin first.");
  await next();
});
