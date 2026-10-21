import { useRouteLoaderData } from "react-router";

import type { loader } from "@/routes/admin/gate";

/**
 * True when the admin has a password and this browser hasn't unlocked it.
 * Pages hide what would change something; the gate stops it either way.
 */
export function useReadOnly() {
  return useRouteLoaderData<typeof loader>("routes/admin/gate")?.readOnly ?? false;
}
