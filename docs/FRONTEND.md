# Frontend Guide (owner: friend)

**Your folder: `frontend/`.** Don't edit `backend/`.

## Your files
- `frontend/pages/<Name>Page.tsx`: one component per screen.
- `frontend/components/`: reusable UI pieces (cards, buttons, navbar…).
- `frontend/lib/api-client.ts`: `apiGet` / `apiPost` to call the backend.
- `app/layout.tsx` + `app/globals.css`: shared layout and global styles (also yours).
- Shared with backend (read-only for you; ask before changing): `docs/CONTRACT.md` + `shared/types.ts`.

## How a URL shows your page
Next.js only looks inside `app/` for URLs, so each page needs one tiny **connector** file:
```tsx
// app/dashboard/page.tsx  → URL /dashboard
export { default } from "@/frontend/pages/DashboardPage";
```
All UI stays in `frontend/pages/DashboardPage.tsx`. The home page (`/`) is `frontend/pages/HomePage.tsx`.

## Rules
- Call the backend only through `apiGet` / `apiPost`, typed with `@/shared/types`.
- Read `docs/CONTRACT.md` for what each endpoint returns. If the backend isn't ready, use fake data with the same types, then swap in the real call.
- Components using `useState`, `useEffect` or `onClick` need `"use client";` at the very top.
- Every data screen needs a **loading**, **error** and **empty** state.
- Tailwind for styling. Mobile-first, consistent colors.

## Example
```tsx
"use client";
import { useEffect, useState } from "react";
import { apiGet } from "@/frontend/lib/api-client";
import type { HealthStatus } from "@/shared/types";

export default function StatusBadge() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<HealthStatus>("/api/health").then(setHealth).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!health) return <p>Loading…</p>;
  return <p>Backend is {health.status}</p>;
}
```
