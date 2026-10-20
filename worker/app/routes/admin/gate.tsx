import { redirect } from "react-router";

import type { Route } from "./+types/gate";
import { hasAdminSession } from "@core/admin-auth.server";

/**
 * Wraps every admin route. With ADMIN_PASSWORD set, a request without a
 * session goes to /login, whether it's a page load, a loader or an action,
 * and comes back here after signing in.
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request }) => {
    if (await hasAdminSession(request)) return;
    const url = new URL(request.url);
    // Data requests carry a .data suffix and a _routes param; send them back to the page itself.
    url.searchParams.delete("_routes");
    const next = url.pathname.replace(/\.data$/, "") + url.search;
    throw redirect(`/login?next=${encodeURIComponent(next)}`);
  },
];
