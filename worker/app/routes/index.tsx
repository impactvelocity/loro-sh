import { redirect } from "react-router";

import type { Route } from "./+types/index";

// Keeps the query, so app.loro.sh/?demo=1 still opens the demo workspace.
export function loader({ request }: Route.LoaderArgs) {
  return redirect("/admin" + new URL(request.url).search);
}
