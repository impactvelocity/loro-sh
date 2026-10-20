/**
 * Which host serves what. With `APP_HOST` and `PAGES_HOST` set, the admin,
 * API and MCP server live on one host and the public experience pages on
 * the other. Any other host (localhost, workers.dev, a fork without its
 * own domains) serves everything, as before.
 */
import { env } from "cloudflare:workers";

function hosts() {
  return { app: env.APP_HOST || null, pages: env.PAGES_HOST || null };
}

/** Where public pages are linked from a request: the pages host, if this request came in on the app host. */
export function pagesOrigin(requestUrl: string): string {
  const url = new URL(requestUrl);
  const { app, pages } = hosts();
  return app && pages && url.hostname === app ? `https://${pages}` : url.origin;
}

/** Where the admin, API and MCP server are linked from a request. */
export function appOrigin(requestUrl: string): string {
  const url = new URL(requestUrl);
  const { app, pages } = hosts();
  return app && pages && url.hostname === pages ? `https://${app}` : url.origin;
}

/** Public pages: everything under /f. */
function isPage(pathname: string) {
  return pathname.startsWith("/f/");
}

/** Only the admin: the pages host still serves /api (the pages stream runs from it) and /files. */
function isAdmin(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/login" ||
    pathname === "/mcp"
  );
}

/**
 * Sends a page load to the host that serves it, or null to carry on. Only
 * GET and HEAD move: a redirected POST would lose its body.
 */
export function hostRedirect(request: Request): Response | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const { app, pages } = hosts();
  if (!app || !pages) return null;
  const to =
    url.hostname === app && isPage(url.pathname) ? pages : url.hostname === pages && isAdmin(url.pathname) ? app : null;
  if (!to) return null;
  return Response.redirect(`https://${to}${url.pathname}${url.search}`, 302);
}
