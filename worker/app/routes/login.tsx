import { Form, Link, data, redirect, useNavigation } from "react-router";

import type { Route } from "./+types/login";
import { Logo } from "@/admin-components/logo";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import { Field, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Spinner } from "@/admin-components/ui/spinner";
import type { RouteHandle } from "@/lib/document";
import { readPreferences } from "@/lib/preferences";
import { adminLocked, checkPassword, hasAdminSession, safeNext, signInCookie } from "@core/admin-auth.server";

export const handle: RouteHandle = { surface: "admin" };

export const meta: Route.MetaFunction = () => [{ title: "Unlock Admin · Loro" }];

export async function loader({ request }: Route.LoaderArgs) {
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  // No password, or already unlocked: nothing to do here.
  if (!adminLocked() || (await hasAdminSession(request))) throw redirect(next);
  return { mode: (await readPreferences(request)).mode, next };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (!(await checkPassword(String(form.get("password") ?? "")))) {
    return data({ error: "That password isn't right." }, { status: 401 });
  }
  return redirect(next, { headers: { "Set-Cookie": await signInCookie(request) } });
}

export default function Login({ loaderData, actionData }: Route.ComponentProps) {
  const busy = useNavigation().state !== "idle";
  const error = actionData?.error;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Logo className="h-7 w-auto self-start" />
        <Form method="post" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-[2rem] font-medium">Unlock Admin</h1>
            <p className="text-muted-foreground">Without the password, the admin is view only.</p>
          </div>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={error ? true : undefined}
              required
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </Field>
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={busy} aria-busy={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              Unlock
            </Button>
            <Link to={loaderData.next} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Cancel
            </Link>
          </div>
        </Form>
      </div>
    </main>
  );
}
