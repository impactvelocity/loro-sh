/**
 * What every API route shares: the env types, reading a JSON body against
 * a schema, and turning errors into responses. Core functions throw their
 * own errors (FunnelError, ProfileError…) with messages fit to show, so
 * routes let them through and `errorResponse` maps them once.
 */
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";

import { AgentInputError } from "@core/agent-run.server";
import { ApiKeyError } from "@core/api-keys.server";
import { errorsOf } from "@core/catalogue/flow";
import { FileError } from "@core/files.server";
import { FunnelError } from "@core/funnels.server";
import { ProfileError } from "@core/profiles.server";
import { TestError } from "@core/tests.server";
import type { Workspace } from "@core/workspaces";
import { WorkspaceError } from "@core/workspaces.server";

export type ApiEnv = { Bindings: Env };
/** Routes under /workspaces/:workspace, which only run once it's found. */
export type WorkspaceEnv = { Bindings: Env; Variables: { workspace: Workspace; workspaceId: string } };

/** A response with a status: `{ error }`, or `{ errors }` per field. */
export class ApiError extends Error {
  constructor(
    public status: ContentfulStatusCode,
    message: string,
    public errors?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new ApiError(404, `${what} not found`);

/** The JSON body, checked against `schema`. A bad one is a 422 with an error per field. */
export async function readJson<S extends z.ZodType>(c: Context, schema: S): Promise<z.output<S>> {
  const json: unknown = await c.req.json().catch(() => undefined);
  if (json === undefined) throw new ApiError(400, "Send a JSON body.");
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const errors = errorsOf(parsed.error);
    throw new ApiError(422, Object.values(errors)[0] ?? "Check the request.", errors);
  }
  return parsed.data;
}

/** A whole number from the query string, kept between `min` and `max`. */
export function queryInt(c: Context, name: string, fallback: number, min: number, max: number) {
  const value = Number.parseInt(c.req.query(name) ?? "", 10);
  return Number.isNaN(value) ? fallback : Math.min(max, Math.max(min, value));
}

const userErrors = [WorkspaceError, FunnelError, ProfileError, FileError, ApiKeyError, AgentInputError];

export function errorResponse(error: unknown, c: Context) {
  if (error instanceof ApiError) {
    return c.json(error.errors ? { error: error.message, errors: error.errors } : { error: error.message }, error.status);
  }
  if (error instanceof TestError) return c.json({ error: error.message, errors: error.errors }, 422);
  if (userErrors.some((type) => error instanceof type)) return c.json({ error: (error as Error).message }, 400);
  console.error(error);
  return c.json({ error: "Internal error" }, 500);
}
