"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, toApiError, type ApiClientError } from "./api-client";

type State<T> = { key: string; data: T | null; error: ApiClientError | null };

/**
 * Load `url` with GET and keep { data, error, loading }.
 * - `reload()` fetches again (the old data stays visible meanwhile).
 * - `url = null` = don't load yet.
 * - `setData` lets a page update the cached data after a mutation.
 */
export function useApi<T>(url: string | null) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T>>({ key: "", data: null, error: null });
  const key = `${url}#${version}`;

  useEffect(() => {
    if (!url) return;
    let alive = true;
    apiGet<T>(url).then(
      (data) => alive && setState({ key, data, error: null }),
      (err) => alive && setState((s) => ({ key, data: s.data, error: toApiError(err) })),
    );
    return () => {
      alive = false;
    };
  }, [url, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (fn: (current: T | null) => T | null) => setState((s) => ({ ...s, data: fn(s.data) })),
    [],
  );

  const loading = url !== null && state.key !== key;
  return { data: state.data, error: loading ? null : state.error, loading, reload, setData };
}
