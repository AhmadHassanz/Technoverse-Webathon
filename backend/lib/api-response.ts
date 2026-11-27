// BACKEND helpers: use these in every backend/handlers/*.ts
// so all responses follow the format in docs/CONTRACT.md.

import type { ApiError, ApiSuccess } from "@/shared/types";

/** Send a success response: { data: ... } */
export function ok<T>(data: T, status = 200) {
  return Response.json({ data } satisfies ApiSuccess<T>, { status });
}

/** Send an error response: { error: "message", fields?: { input: "message" } } */
export function fail(message: string, status = 400, fields?: Record<string, string>) {
  const body: ApiError = fields ? { error: message, fields } : { error: message };
  return Response.json(body, { status });
}
