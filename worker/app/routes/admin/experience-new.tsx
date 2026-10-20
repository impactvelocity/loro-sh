import { useState } from "react";
import { Form, data, redirect, useNavigation } from "react-router";

import type { Route } from "./+types/experience-new";
import { partIds, partNames } from "@core/catalogue/define";
import { listCatalogues } from "@core/catalogue/registry";
import { NAME_MAX } from "@core/funnels";
import { FunnelError, createFunnel } from "@core/funnels.server";
import { FormSection } from "@/admin-components/form-section";
import { PageHeader } from "@/admin-components/page-header";
import { Button } from "@/admin-components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Spinner } from "@/admin-components/ui/spinner";
import { currentWorkspace } from "@/lib/workspace.server";

export function meta() {
  return [{ title: "New Experience · Loro" }];
}

export function loader() {
  return {
    // Basic is the test-bed catalogue; it still renders, it just isn't offered.
    catalogues: listCatalogues()
      .filter((catalogue) => catalogue.id !== "basic")
      .map((catalogue) => ({
      id: catalogue.id,
      name: catalogue.name,
      description: catalogue.description,
      parts: partIds.map((part) => `${catalogue.parts[part].components.length} ${partNames[part].toLowerCase()}`),
    })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const workspace = await currentWorkspace(request);
  const form = await request.formData();
  try {
    const slug = await createFunnel(workspace.id, {
      name: String(form.get("name") ?? ""),
      catalogue: String(form.get("catalogue") ?? ""),
    });
    return redirect(`/admin/experiences/${slug}`);
  } catch (error) {
    if (error instanceof FunnelError) return data({ error: error.message }, { status: 400 });
    throw error;
  }
}

export default function NewExperience({ loaderData, actionData }: Route.ComponentProps) {
  const { catalogues } = loaderData;
  const [catalogue, setCatalogue] = useState(catalogues[0]?.id ?? "");
  const creating = useNavigation().state !== "idle";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <PageHeader back={{ to: "/admin/experiences", label: "Experiences" }} title="New Experience" />

      <Form method="post" className="flex flex-col gap-10">
        <FormSection title="Details">
          <Field data-invalid={Boolean(actionData?.error) || undefined}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" required maxLength={NAME_MAX} placeholder="Weekend Plan" autoFocus />
            {actionData?.error ? (
              <FieldError>{actionData.error}</FieldError>
            ) : (
              <FieldDescription>Also sets the link. You can change both later.</FieldDescription>
            )}
          </Field>
        </FormSection>

        <FormSection title="Catalogue">
          <input type="hidden" name="catalogue" value={catalogue} />
          <div role="radiogroup" aria-label="Catalogue" className="grid gap-3 sm:grid-cols-2">
            {catalogues.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={catalogue === option.id}
                onClick={() => setCatalogue(option.id)}
                className="flex flex-col gap-1 rounded-xl p-4 text-left ring-1 ring-border transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-checked:ring-2 aria-checked:ring-foreground aria-checked:hover:bg-transparent"
              >
                <span className="font-medium">{option.name}</span>
                <span className="text-sm text-muted-foreground">{option.description}</span>
                <span className="mt-2 text-xs text-muted-foreground">Components: {option.parts.join(" · ")}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">It starts as a copy of the catalogue's example, as a draft.</p>
        </FormSection>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={creating || !catalogue}>
            {creating && <Spinner data-icon="inline-start" />}
            Create Experience
          </Button>
        </div>
      </Form>
    </div>
  );
}
