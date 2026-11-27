// Small helpers for handlers: read the JSON body / query string and validate with zod.
import type { z } from "zod";
import { HttpError } from "@/backend/lib/errors";
import { uuid } from "@/shared/validation";

/** Read the JSON body and validate it. A bad shape throws a ZodError (-> 400 with `fields`). */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
  return schema.parse(raw);
}

/** Read ?a=1&b=2 as a plain object and validate it. */
export function parseQuery<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return schema.parse(params);
}

/** A URL id that is not a UUID can never exist, so answer 404 instead of letting Postgres complain. */
export function parseId(value: string, what = "Item"): string {
  const result = uuid.safeParse(value);
  if (!result.success) throw new HttpError(404, `${what} not found`);
  return result.data;
}

/** Postgres "unique violation" (duplicate). */
export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
