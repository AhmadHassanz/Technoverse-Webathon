# API Contract

The agreement between **frontend** (pages) and **backend** (`app/api/`).
If you change an endpoint, update this file **in the same commit** and tell your teammate.

> Status: only `GET /api/health` exists. Real endpoints get added here once the problem statement is known.

## Rules for every endpoint

- **Base URL:** same app, so the frontend just calls `/api/...` (no domain, no CORS setup).
- **Format:** JSON in, JSON out.
- **Success:** HTTP `200` (or `201` when something is created), body:
  ```json
  { "data": <the result> }
  ```
- **Error:** HTTP `400` (bad input), `404` (not found) or `500` (server bug), body:
  ```json
  { "error": "Short human-readable message" }
  ```
- **Dates:** ISO strings, e.g. `"2026-11-27T10:30:00Z"`.
- **IDs:** strings, e.g. `"evt_001"`.
- TypeScript types for every request/response live in `shared/types.ts`. Frontend and backend both import from there.

## Endpoints

| Method | URL | What it does | Status |
|---|---|---|---|
| GET | `/api/health` | Checks the backend is alive | ✅ Done |

---

### GET `/api/health`
Checks that the backend is running.

**Request:** nothing.

**Response 200:**
```json
{ "data": { "status": "ok", "time": "2026-11-27T10:30:00.000Z" } }
```

**Frontend usage:**
```ts
import { apiGet } from "@/frontend/lib/api-client";
import type { HealthStatus } from "@/shared/types";

const health = await apiGet<HealthStatus>("/api/health");
```

---

## Template for a new endpoint (copy this)

### METHOD `/api/thing`
One line: what it does.

**Request body / query params:**
```json
{ "field": "type and example" }
```

**Response 200:**
```json
{ "data": { } }
```

**Errors:** `400` when ..., `404` when ...
