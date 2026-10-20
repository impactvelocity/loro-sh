import { redirect } from "react-router";

import type { Route } from "./+types/logout";
import { signOutCookie } from "@core/admin-auth.server";

export function action({ request }: Route.ActionArgs) {
  return redirect("/login", { headers: { "Set-Cookie": signOutCookie(request) } });
}

export function loader() {
  return redirect("/login");
}
