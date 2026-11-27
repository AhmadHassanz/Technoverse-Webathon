// BACKEND helpers: use these in every backend/handlers/*.ts
// so all responses follow the format in docs/CONTRACT.md.

import type { ApiError, ApiSuccess } from "@/shared/types";

/** Send a success response: { data: ... } */
export function ok<T>(data: T, status = 200) {
  return Response.json({ data } satisfies ApiSuccess<T>, { status });
}

/** Send an error response: { error: "message" } */
export function fail(message: string, status = 400) {
  return Response.json({ error: message } satisfies ApiError, { status });
}
