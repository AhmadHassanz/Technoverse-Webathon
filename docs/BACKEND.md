# Backend Guide (owner: user)

**Your folder: `backend/`.** Don't edit `frontend/`.

## Your files
- `backend/handlers/<name>.ts`: the real code for each endpoint (export `GET`, `POST`, …).
- `backend/lib/`: helpers, database code. `api-response.ts` has `ok()` / `fail()`.
- `backend/data/`: sample data (e.g. `events.ts` exporting an array).
- Shared with frontend (change together, tell your teammate): `docs/CONTRACT.md` + `shared/types.ts`.

## How a URL reaches your code
Next.js only looks inside `app/` for URLs, so each endpoint needs one tiny **connector** file:
```ts
// app/api/events/route.ts  → URL /api/events
export { GET, POST } from "@/backend/handlers/events";
```
All logic stays in `backend/handlers/events.ts`.

## Rules
- Always respond with `ok(data)` or `fail("message", status)` from `@/backend/lib/api-response`.
- Validate input; return `fail("...", 400)` for bad input, `404` when not found.
- Secrets (API keys, DB URLs) go in `.env.local`, read with `process.env.NAME`. Never in code.
- **Cache Components is ON** (`next.config.ts`): never use `export const dynamic = ...` (build fails). For live GET data (dates, random, DB reads), start the handler with `await connection()` from `next/server`.
- Dynamic URL (`app/api/events/[id]/route.ts`): in Next.js 16, `params` is a Promise. In the handler:
  `export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; ... }`

## Adding an endpoint (checklist)
1. Write it in `docs/CONTRACT.md` (copy the template).
2. Add its types to `shared/types.ts`.
3. Write `backend/handlers/<name>.ts`.
4. Add the 1-line connector `app/api/<name>/route.ts`.
5. Test: open `http://localhost:3000/api/<name>` (GET) or `curl` for POST.
6. Commit + push, tell frontend it's ready.
