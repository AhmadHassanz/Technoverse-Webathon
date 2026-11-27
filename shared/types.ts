// Shared types: the TypeScript version of docs/CONTRACT.md.
// Frontend and backend both import from here, so they always agree.

/** Every successful API response looks like this. */
export type ApiSuccess<T> = { data: T };

/** Every failed API response looks like this. */
export type ApiError = { error: string };

// ---- GET /api/health ----
export type HealthStatus = {
  status: "ok";
  time: string; // ISO date
};
