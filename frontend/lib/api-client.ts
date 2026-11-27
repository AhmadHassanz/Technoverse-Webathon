// FRONTEND helpers: call the backend with these instead of raw fetch.
// They unwrap { data } and turn { error, fields } into a thrown ApiClientError.
// status 0 = the request never reached the server (offline / network failure).

export class ApiClientError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fields = fields;
  }
}

/** Calls that may legitimately answer 401 without meaning "your session expired". */
const NO_REDIRECT = ["/api/auth/me", "/api/auth/login", "/api/auth/signup", "/api/verify/"];

type Options = { signal?: AbortSignal; keepalive?: boolean };

async function request<T>(method: string, url: string, payload?: unknown, opts: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: payload === undefined ? undefined : { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      cache: "no-store",
      signal: opts.signal,
      keepalive: opts.keepalive,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiClientError("No connection", 0);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !NO_REDIRECT.some((p) => url.startsWith(p))) {
      // A full reload clears all client state after the session expired.
      window.location.replace(`${window.location.origin}/login`);
    }
    throw new ApiClientError(body?.error ?? `Request failed (${res.status})`, res.status, body?.fields);
  }
  return (body?.data ?? null) as T;
}

export const apiGet = <T>(url: string, opts?: Options) => request<T>("GET", url, undefined, opts);
export const apiPost = <T>(url: string, payload: unknown = {}, opts?: Options) => request<T>("POST", url, payload, opts);
export const apiPut = <T>(url: string, payload: unknown, opts?: Options) => request<T>("PUT", url, payload, opts);
export const apiPatch = <T>(url: string, payload: unknown, opts?: Options) => request<T>("PATCH", url, payload, opts);
export const apiDelete = <T>(url: string, opts?: Options) => request<T>("DELETE", url, undefined, opts);

/** Normalise anything thrown into an ApiClientError. */
export function toApiError(err: unknown): ApiClientError {
  if (err instanceof ApiClientError) return err;
  return new ApiClientError(err instanceof Error ? err.message : "Something went wrong", 500);
}

/** A short, human message for a toast. */
export function errorMessage(err: unknown): string {
  const e = toApiError(err);
  if (e.status === 0) return "No connection. Check your internet and try again.";
  if (e.status >= 500) return "Something went wrong. Please try again.";
  return e.message;
}
