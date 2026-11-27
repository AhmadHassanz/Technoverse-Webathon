# Progress Log

Claude updates this file at the end of every task, so a new session can pick up right where we left off.

## Current status
- Project: **Secure Examination Management System** (`docs/PROBLEM_STATEMENT.md`). Plans: `docs/BACKEND_PLAN.md`, `docs/FRONTEND_PLAN.md`. Contract: `docs/CONTRACT.md`, `shared/types.ts`, `backend/db/schema.sql`.
- Repo: https://github.com/AhmadHassanz/Technoverse-Webathon. Branches: `main` (merged, deployable), `backend` (user), `frontend` (friend).
- Stage: **Stage 0** of BACKEND_PLAN almost done (code finished 27 Nov; first deploy still to do). **Stages 1, 2 and 3 finished and tested locally (27 Nov)**; Stage 4 (monitoring, grading, results, analytics) is next; nothing deployed yet. Supabase project created and `schema.sql` run (user). `.env.local` now has REAL keys (verified 27 Nov: all 15 tables reachable with the secret key; auth works).
- **Commit/push ONLY on the `backend` branch** (user merges into `main` later).
- **Not following the plan's clock times** (only stage order and the 8:00 PM deadline matter).

## Done
- 27 Nov 10:25: `git init`, first commit, pushed `main`.
- 27 Nov 11:09: added problem statement, backend/frontend plans, contract, `shared/types.ts`, `backend/db/schema.sql`; CLAUDE.md filled in.
- 27 Nov: real Supabase keys added and verified; removed stray `env.local`; plan timings declared ignored.
- 27 Nov: created `backend` branch; removed unused boilerplate (3 starter SVGs, personal `.vscode/`, old quick-reference guides); wrote real README and `docs/DESIGN.md` skeleton.
- 27 Nov: Stage 0 code: packages installed (one commit); `backend/lib` = api-response (`fail` takes `fields`), errors (`HttpError`, generic `withErrors`), supabase (`adminClient`, `authClient`), auth (`getCurrentUser`/`requireUser`/`requireRole`), time, shuffle; 21 stub endpoints (Stage 1+2, mock data in `backend/lib/mock.ts`) with 1-line `app/api` connectors. `npm run build` + lint pass; stubs curl-tested.
- 27 Nov: **Stage 1 done**: `shared/validation.ts` (zod, matches CONTRACT rules); auth (signup/login/logout/me); admin users; topics + questions (ownership, replace options, 409 if used); exam CRUD (derived state, draft-only edit/delete, PATCH re-validates the merged exam); seed v1 (`npm run seed`, 5 demo accounts, password `Demo@1234`). Each feature tested with a scripted run against the built app (about 100 checks, all pass).
- 27 Nov: **Stage 2 done**: exam assembly (PUT pool + blueprint, publish-check, publish, unpublish), candidate search + enrollments, `/api/me/exams`, CSV import (candidates + questions, dryRun, row errors), Stage 3 stub endpoints (mock `AttemptView` etc.) for the frontend. About 130 scripted checks pass; the Stage 1 deferred 409 checks now pass too.
- 27 Nov 12:05-12:45: **Stage 3 done (attempt engine)**: start attempt (enrollment + window checks, resume, race-safe via the unique index, sandbox preview), paper building with frozen snapshots (`lib/paper.ts`), `GET /api/attempts/[id]` (dedicated mapper, no correctness), autosave through `save_answer()`, offline sync, idempotent submit, lazy auto-submit (`finalizeIfExpired`, also in `/api/me/exams`), objective auto-grading (pure `lib/grading.ts` + `services/grading.service.ts`), heartbeat outage detection + pending compensation requests (innovation 5.3), incidents (5 s duplicate filter), scratchpad, DELETE sandbox attempt, `PATCH /api/me/preferences`. Stage 4 endpoints added as stubs (`lib/mock.ts` now holds only Stage 4 mocks). Tests: 28 grading unit tests + 200 Stage 3 end-to-end checks (incl. a real 1-minute expiry, 5 parallel starts, 5 parallel submits, parallel heartbeats) + 75 regression checks (Stages 1-2 + stub smoke), all pass.

## Next steps
1. Add the same 3 env vars in Vercel (Production) before the first deploy. Schema may need changes later; keep file + Supabase + docs in sync.
   - Supabase "Confirm email" is still ON (autoconfirm=false). Harmless because signup/admin-create use `email_confirm: true`, but turn it off if login ever says "email not confirmed".
   - Check once after seeding that the publishable key cannot read data (RLS with no policies): `GET {SUPABASE_URL}/rest/v1/profiles` with the publishable key must return `[]`.
2. **Stage 4**: monitor (call `finalizeIfExpired` for every in-progress attempt first; `online` = heartbeat within 45 s; exclude sandbox), announcements (owner or enrolled candidate), incident review, compensation approve/reject (`compensation_sec = min(600, + gap)`, only while in progress, 409 if decided), grading queue + grade (0 ≤ marks ≤ snapshot marks, then call `gradeAttempt` to recompute score/status), results + publish results (409 if attempts in progress or ungraded), analytics, `GET /api/me/results/[examId]`. The Stage 4 stubs have NO auth checks; replace each. Use `AttemptView.totalMarks` definition (sum of the paper's snapshot marks) consistently.
   - Then Stage 5 (PDF reports, verify codes, full demo seed, README) and the first deploy + live URL in README.
   - Test data from Stage 3 runs is prefixed "ZZ Test" (topics, questions, exams) plus one account `zz.examiner2@demo.com`. To clean it, the user runs in the Supabase SQL editor (deleting an exam cascades its attempts, answers, incidents, etc.):
     `delete from public.exams where title like 'ZZ Test%';`
     `delete from public.questions where topic_id in (select id from public.topics where name like 'ZZ Test%');`
     `delete from public.topics where name like 'ZZ Test%';`
     (the account `zz.examiner2@demo.com` can be removed in Supabase → Authentication → Users, or kept for tests).
3. Add friend as GitHub collaborator; friend creates `frontend` branch from `main`.
4. Friend: when replacing `HomePage.tsx`, also delete `public/next.svg` and `public/vercel.svg` (only the starter page uses them).

## Decisions
- Team of 2: user = backend (branch `backend`), friend = frontend (branch `frontend`). Merge into `main`, deploy from `main`.
- Stack: Next.js 16 (App Router) + Tailwind v4 + TypeScript, ONE app, repo root = `webathon/`, no `src/`.
- DB = Supabase Postgres; auth via Supabase behind our API (httpOnly cookie); backend uses the secret key only; RLS on with no policies.
- Plan clock times are ignored by choice; deadline 8:00 PM still applies.
- Polling instead of Realtime; pdf-lib + qrcode for PDFs; zod schemas in `shared/validation.ts`.
- Innovation challenges: 5.3 (outage compensation) + 5.2 (blueprint fairness).
- Folders: `frontend/` (friend), `backend/` (user), `shared/` + `CONTRACT.md` (user owns, both use). `app/` = 1-line connectors only.
- API format: `{ data }` on success, `{ error, fields? }` on failure.
- Commits: no Claude co-author lines. (The first two commits on `main` have one by mistake; left as-is because pushed history must not be rewritten.)
- `withErrors` re-throws Next's internal errors (they carry `digest`), otherwise `connection()` in GET handlers breaks the build.
- Stubs = `backend/handlers/*` returning `backend/lib/mock.ts` data; each real endpoint replaces its stub and flips ⏳ to ✅ in CONTRACT.
- Test accounts for local runs: `admin@demo.com`, `examiner@demo.com`, `ali@demo.com`, `sara@demo.com`, `hamza@demo.com` (all `Demo@1234`). Re-run `npm run seed` any time.
- Shell tip: very large heredocs can break in the terminal tool, so write files with the editor tool instead.
- Cache Components is ON in next.config.ts → no `export const dynamic`; use `await connection()` for live GET data.
- Attempt engine: every attempt endpoint calls `loadOwnAttempt` (404 → 403 → `finalizeIfExpired`). Auto-submit is lazy (no cron); `submitted_at` of an auto-submit = the deadline. Saves allowed until `endsAt + 5 s`.
- Grading reads ONLY `attempt_questions.snapshot`; `gradeAttempt` is idempotent and never overwrites written grades; all-objective papers become `graded` at submit. Partial multi-select: ticking every option = 0, otherwise the formula (ambiguity 13 in DESIGN.md).
- Sandbox attempts: owner/admin only, any exam state, never create incidents/compensation, excluded everywhere; `DELETE /api/attempts/[id]` resets them.
- Heartbeat outage: gap > 45 s between server timestamps → `offline` incident + pending compensation request; optimistic update on `last_heartbeat_at` makes it race-safe.
- Tests run against the built app on port 3111 (`node node_modules/next/dist/bin/next start -p 3111`); stop it by its PID (find it with `Get-NetTCPConnection -LocalPort 3111`), never `taskkill /IM node.exe`.

## Useful commands
| What | Command |
|---|---|
| Open Claude Code in the right folder | `cd D:\TECHNOVERSE_WEBATHON\webathon` then `claude` |
| Start dev server | `npm run dev` → http://localhost:3000 |
| Build (check for errors) | `npm run build` |
| Deploy live (from `main`) | `npx vercel --prod` |
| Save work | `git add . && git commit -m "message"` then `git push` |
| Get the other side's work into your branch | `git pull` then `git merge main` |
| Merge your branch into main | `git switch main && git pull && git merge backend && git push && git switch backend` |

## Live URL
- (not deployed yet)
