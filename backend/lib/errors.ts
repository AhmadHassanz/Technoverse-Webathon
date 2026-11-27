// Errors that services throw on purpose, plus the wrapper every handler uses.
// Services never build HTTP responses: they just `throw new HttpError(404, "Exam not found")`.

import { ZodError } from "zod";
import { fail } from "@/backend/lib/api-response";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Turn a zod error into { fieldName: "first message" } for form errors. */
export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

/**
 * Wrap a handler so errors become the contract's { error, fields? } format.
 *  - HttpError  -> its own status + message
 *  - ZodError   -> 400 with per-field messages
 *  - anything else -> logged on the server, client only sees a generic 500
 * It is generic so Next.js still sees the handler's real argument types (e.g. params).
 */
export function withErrors<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.message, error.status, error.fields);
      if (error instanceof ZodError) return fail("Please check the highlighted fields", 400, zodFields(error));
      // Next.js uses special errors (they carry a `digest`) for its own control flow,
      // e.g. connection() telling the build "this route is dynamic". Let those through.
      if (typeof error === "object" && error !== null && "digest" in error) throw error;
      console.error("Unhandled error:", error); // never leak raw database errors to the client
      return fail("Something went wrong", 500);
    }
  };
}
