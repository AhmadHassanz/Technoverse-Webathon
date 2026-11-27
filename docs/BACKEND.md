# Backend Quick Reference (owner: user / Zoro)

**Full plan: `docs/BACKEND_PLAN.md`** (stages, business rules, prompts). Contract: `docs/CONTRACT.md` + `shared/types.ts` + `backend/db/schema.sql`.

## Your files
- `backend/handlers/...` — one file per URL (mirror the URL), exports `GET`/`POST`/…, wrapped in `withErrors`.
- `backend/services/*.service.ts` — business rules + role/ownership checks. No HTTP stuff.
- `backend/data/*.ts` — the ONLY place that queries Supabase; maps snake_case ↔ camelCase.
- `backend/lib/` — `api-response.ts` (`ok`, `fail`), `errors.ts`, `supabase.ts`, `auth.ts`, `time.ts`, `shuffle.ts`, `csv.ts`, `pdf.ts`.
- `backend/db/schema.sql` — run once in the Supabase SQL editor.
- `backend/scripts/seed.ts` — demo data (`npm run seed`).
- `shared/types.ts`, `shared/validation.ts`, `docs/CONTRACT.md` — yours; change together, tell your teammate.

## How a URL reaches your code
```ts
// app/api/exams/[id]/publish/route.ts  → URL /api/exams/:id/publish
export { POST } from "@/backend/handlers/exams/[id]/publish";
```

## Rules
- Respond only with `ok(data)` or `fail(message, status, fields?)`; status codes exactly as CONTRACT.md.
- Check role + ownership in the service before every query. Never send `isCorrect`/snapshots to candidates.
- Validate every input with zod from `shared/validation.ts`.
- Secrets in `.env.local` (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), never `NEXT_PUBLIC_`.
- **Cache Components is ON:** never `export const dynamic = ...`; start GET handlers with `await connection()`.
- Dynamic routes: `params` is a Promise → `const { id } = await params`. `cookies()` is async.
- After an endpoint works: test it, mark ✅ in CONTRACT.md, commit, tell your teammate.
