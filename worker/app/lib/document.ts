import { useMatches } from "react-router";

export type Surface = "admin" | "experience";

/** Route modules export `handle` to tell the document which surface it is. */
export type RouteHandle = { surface?: Surface };

/**
 * The surface and theme are set on <html> rather than a wrapper div so that
 * portalled UI (dialogs, menus, tooltips) picks up the same tokens.
 */
export function useDocumentAttributes() {
  const matches = useMatches();
  const surface = matches
    .map((match) => (match.handle as RouteHandle | undefined)?.surface)
    .findLast(Boolean);
  const theme = matches
    .map((match) => (match.loaderData as { theme?: string } | undefined)?.theme)
    .findLast(Boolean);

  // Only the admin layout returns a mode, so experience pages keep their theme.
  const mode = matches
    .map((match) => (match.loaderData as { mode?: string } | undefined)?.mode)
    .findLast(Boolean);

  return { "data-surface": surface, "data-theme": theme, "data-mode": mode };
}
