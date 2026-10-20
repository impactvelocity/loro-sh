import { redirect } from "react-router";

import { findWorkspace } from "@core/workspaces.server";
import { readPreferences } from "./preferences";

/** The workspace this viewer picked, or null if they haven't or it was deleted. */
export async function selectedWorkspace(request: Request) {
  const { workspaceId } = await readPreferences(request);
  return workspaceId ? findWorkspace(workspaceId) : null;
}

/**
 * The workspace every admin loader scopes its queries by. Without one,
 * the viewer is sent to the Workspaces page to pick.
 */
export async function currentWorkspace(request: Request) {
  const workspace = await selectedWorkspace(request);
  if (!workspace) throw redirect("/admin/workspaces");
  return workspace;
}
