// FRONTEND helpers: call the backend with these instead of raw fetch.
// They unwrap { data } and turn { error } into a thrown Error.

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

/** GET /api/... and return the `data` part. */
export async function apiGet<T>(url: string): Promise<T> {
  return handle<T>(await fetch(url));
}

/** POST /api/... with a JSON body and return the `data` part. */
export async function apiPost<T>(url: string, payload: unknown): Promise<T> {
  return handle<T>(
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}
