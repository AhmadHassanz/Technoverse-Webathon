# Backend Build Guide — Secure Exam System (Zoro)

> Markdown copy of "Backend Build Guide — Secure Exam System (Zoro).pdf" (27 Nov 2026). This is the final backend plan. If it disagrees with older docs, **this doc wins**. Contract = `docs/CONTRACT.md` + `shared/types.ts` + `backend/db/schema.sql`.

## 1. How to use this doc

**Setup (do first):**
1. This plan lives in the repo as `docs/BACKEND_PLAN.md`.
2. The 3 contract files are in the repo: `docs/CONTRACT.md`, `shared/types.ts`, `backend/db/schema.sql`. Both sides build against them.
3. Commit + push; teammate runs `git pull`.
4. `CLAUDE.md` problem statement + database (Supabase Postgres) are filled in.

**How to work with Claude (one feature at a time):**
- Start each task with the stage prompt from section 7. Always say which endpoints from `docs/CONTRACT.md` you are building.
- After each endpoint: test it (browser for GET, curl or the frontend for POST), then commit. Small commits, clear messages.
- When an endpoint works, change its status in `docs/CONTRACT.md` from ⏳ to ✅, commit, and tell your teammate.

**Repo rules that still apply (CLAUDE.md):**
- Deadline 8:00 PM. Aim to finish by 7:30 PM. No commit, push or deploy after 7:45 PM.
- Never rewrite git history: no `--amend` on pushed commits, no rebase, no force-push. Use plain `git pull` (merge).
- No "Co-Authored-By: Claude" lines in commits.
- You own `backend/`, `shared/types.ts`, `docs/CONTRACT.md`, `package.json`, `.env.local`, Vercel deploys. Don't edit `frontend/`.
- `app/` holds only 1-line connector files. All logic lives in `backend/`.

## 2. Final technical decisions

| Topic | Decision | Changed from general plan? |
|---|---|---|
| Auth | Supabase Auth, but only the backend talks to Supabase. `POST /api/auth/login` signs in with `@supabase/ssr` and sets an httpOnly cookie. Frontend just calls `/api/...` | Yes (frontend no longer uses Supabase) |
| Authorization | Every service checks role + ownership in TypeScript before any query. RLS is on for all tables with no policies = the public key can read nothing. Backend uses the secret (service role) key, server-only | Yes (simpler than writing RLS policies, same security) |
| Live updates | Polling, no Supabase Realtime. Monitor polls every 5 s; workspace heartbeat every 15 s also returns announcements | Yes |
| PDF | `pdf-lib` + `qrcode` (pure JS, works on Vercel) | Yes (was react-pdf) |
| Error format | Keep the repo's `{ error: "msg" }`, add optional `fields` for form errors | Yes |
| Validation | zod schemas in `shared/validation.ts` (backend writes, frontend imports for forms) | No |
| Timing | Server clock only. `ends_at` stored on the attempt; every response returns `serverNow` + `endsAt` | No |
| Paper integrity | `attempt_questions.snapshot` freezes questions, option order and marking scheme per attempt | No |
| Auto-submit | Lazy: any request on an expired attempt finalizes it first (+ monitor and dashboard reads finalize expired ones). No cron needed | Simplified |
| Atomic saves | One SQL function `save_answer` (already in `schema.sql`) keeps only the newest `clientSeq` | No |
| Deploy | Vercel CLI from your machine: `npx vercel --prod`. Only you deploy | No |

**Environment variables** (`.env.local` locally + Vercel Project Settings → Environment Variables, Production):
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=...   # "Publishable" key (or legacy "anon" key)
SUPABASE_SECRET_KEY=...        # "Secret" key (or legacy "service_role" key) -- NEVER in frontend code
```
None start with `NEXT_PUBLIC_`, so they can never leak into the browser bundle. `.gitignore` already ignores `.env*`.

**Packages** — you install everything for both of you in Stage 0, in one commit (avoids `package-lock.json` conflicts):
```
npm i @supabase/supabase-js @supabase/ssr zod pdf-lib qrcode papaparse lucide-react
npm i -D @types/qrcode @types/papaparse
```

**Next.js 16 gotchas:**
- Cache Components is ON: never write `export const dynamic = ...` (build fails). Start every GET handler with `await connection()`.
- Dynamic routes: `params` is a Promise — `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params`.
- `cookies()` from `next/headers` is async: `const cookieStore = await cookies()`.
- Run `npm run build` before every deploy; Vercel runs the same type check.

## 3. Backend folder structure and layers

Three layers, as the judges' rubric asks: **handlers → services → data**. Handlers parse and respond, services hold the rules and permission checks, data files are the only place that queries Supabase.

```
backend/
  db/schema.sql            # given -- run once in Supabase SQL editor
  lib/
    api-response.ts        # ok(), fail(message, status, fields?)  (extend existing)
    errors.ts              # class HttpError(status, message, fields?) + withErrors(handler) wrapper
    supabase.ts            # adminClient() (secret key) + authClient() (@supabase/ssr + cookies)
    auth.ts                # getCurrentUser(), requireUser(), requireRole(...roles)
    time.ts                # effectiveEnd(attempt), isExpired(attempt), GRACE_MS = 5000
    shuffle.ts             # crypto-based shuffle + sample
    csv.ts                 # papaparse wrapper -> rows + header check
    pdf.ts                 # pdf-lib helpers + safe text (strip non-Latin chars)
  data/                    # ONLY place with supabase queries; maps snake_case <-> camelCase
    users.ts topics.ts questions.ts exams.ts enrollments.ts attempts.ts
    answers.ts monitoring.ts grading.ts analytics.ts reports.ts
  services/                # business rules + permission checks, no HTTP stuff
    auth.service.ts users.service.ts questions.service.ts exams.service.ts
    enrollment.service.ts import.service.ts attempt.service.ts grading.service.ts
    monitor.service.ts results.service.ts analytics.service.ts report.service.ts
  handlers/                # one file per URL, exports GET/POST/PUT/PATCH/DELETE
    auth/login.ts, exams/[id]/publish.ts ... (mirror the URL)
  scripts/seed.ts          # demo data (Stage 1 = accounts, Stage 5 = full)
shared/
  types.ts                 # given
  validation.ts            # zod schemas, one per *Input type (you write, frontend imports)
app/api/**/route.ts        # 1-line connectors: export { GET, POST } from "@/backend/handlers/..."
```

**The handler pattern (every endpoint looks like this):**
```ts
// backend/handlers/exams/[id]/publish.ts
import { withErrors } from "@/backend/lib/errors";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { publishExam } from "@/backend/services/exams.service";

export const POST = withErrors(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("examiner", "admin"); // throws HttpError(401/403)
  const { id } = await params;
  return ok(await publishExam(user, id));               // service throws HttpError(404/409)
});
```
```ts
// app/api/exams/[id]/publish/route.ts
export { POST } from "@/backend/handlers/exams/[id]/publish";
```

`withErrors` does: `HttpError` → `fail(message, status, fields)`; `ZodError` → 400 with `fields` built from issues (first path segment → message); anything else → `console.error` + 500 "Something went wrong". **Never leak raw database errors to the client.**

`fail` signature change: `fail(message: string, status = 400, fields?: Record<string, string>)` → `{ error, fields }`. Matches `ApiError` in `shared/types.ts`.

**Auth helpers:**
- `authClient()` = `createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { cookies: { getAll, setAll } })` using `await cookies()`. Used only for `signInWithPassword`, `signOut`, `getUser`.
- `adminClient()` = `createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } })`. Used for every table query and `auth.admin.createUser`.
- `getCurrentUser()` = `authClient().auth.getUser()` → load profile with admin client → `null` if no session or `is_active = false`.
- Signup and admin create both use `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })` so no confirmation email is needed. The DB trigger makes the profile; admin create then sets the role. Signup then signs in to set the cookie.

## 4. API contract summary — full version in `docs/CONTRACT.md`

| # | Group | Endpoints | Stage |
|---|---|---|---|
| 1 | Auth & profile | POST `/api/auth/signup` · POST `/api/auth/login` · POST `/api/auth/logout` · GET `/api/auth/me` · PATCH `/api/me/preferences` | 1 (preferences: 3) |
| 2 | Admin | GET, POST `/api/admin/users` · PATCH `/api/admin/users/[id]` | 1 |
| 3 | Question bank | GET, POST `/api/topics` · GET, POST `/api/questions` · GET, PATCH, DELETE `/api/questions/[id]` | 1 |
| 4 | Exams | GET, POST `/api/exams` · GET, PATCH, DELETE `/api/exams/[id]` | 1 |
| 4 | Exams (assembly) | PUT `/api/exams/[id]/questions` · GET `/api/exams/[id]/publish-check` · POST `/api/exams/[id]/publish` · POST `/api/exams/[id]/unpublish` | 2 |
| 5 | Enrollment & import | GET `/api/candidates` · GET, POST `/api/exams/[id]/enrollments` · DELETE `/api/exams/[id]/enrollments/[candidateId]` · POST `/api/import/candidates` · POST `/api/import/questions` | 2 |
| 6 | Candidate | GET `/api/me/exams` (stage 2) · GET `/api/me/results/[examId]` (stage 4) | 2, 4 |
| 7 | Attempts | POST `/api/exams/[id]/attempts` · GET, DELETE `/api/attempts/[id]` · PUT `/api/attempts/[id]/answers/[aqId]` · POST `.../sync` · POST `.../heartbeat` · POST `.../incidents` · PUT `.../scratchpad` · POST `.../submit` | 3 |
| 8 | Monitoring | GET `/api/exams/[id]/monitor` · GET, POST `/api/exams/[id]/announcements` · PATCH `/api/incidents/[id]` · PATCH `/api/compensations/[id]` | 4 |
| 9 | Grading & results | GET `/api/exams/[id]/grading` · PATCH `/api/attempt-questions/[aqId]/grade` · GET `/api/exams/[id]/results` · POST `/api/exams/[id]/results/publish` · GET `/api/exams/[id]/analytics` | 4 |
| 10 | Reports | GET `/api/reports/attempts/[attemptId]` (PDF) · GET `/api/reports/exams/[examId]` (PDF) · GET `/api/verify/[code]` (public) | 5 |
| 11 | Health | GET `/api/health` (exists) | done |

**Contract rules to never break:**
- Success = `{ data }`, error = `{ error, fields? }`, status codes 400 / 401 / 403 / 404 / 409 / 410 / 500 exactly as the table in CONTRACT.md.
- JSON is camelCase. Your `data/` files convert from the DB's snake_case.
- Candidate-facing responses **never** include `isCorrect` or the snapshot. `AttemptView` uses `AttemptQuestion`, which has no correctness field.
- Frontend builds against mock data shaped exactly like these types, so a field you rename breaks their page. **Don't rename — add.**

## 5. Stages with clock times

Seven stages, matched minute-for-minute with the frontend doc. If a stage runs 20+ minutes late, use the cut list at the end of this section; don't skip the checkpoint.

| Stage | Time | Your focus | Checkpoint (both of you, on the live URL) |
|---|---|---|---|
| 0 | 10:50 – 11:30 | Setup, DB, helpers, contract in repo | Deployed; `/api/health` works live |
| 1 | 11:30 – 13:00 | Auth, admin, question bank, exam CRUD | Examiner logs in, creates questions + a draft exam |
| 2 | 13:00 – 14:15 | Exam assembly, publish, enrollment, import, candidate dashboard | Exam published with candidates enrolled; candidate sees it |
| 3 | 14:15 – 16:00 | Attempt engine (the core) | **Sacred:** candidate takes + submits; refresh keeps answers + time |
| 4 | 16:00 – 17:30 | Monitoring, grading, results, analytics | Grade → publish → candidate sees result; monitor is live |
| 5 | 17:30 – 18:45 | PDF, verification, demo seed, DESIGN.md, README | All features clickable with realistic data |
| 6 | 18:45 – 19:45 | Freeze, bug bash, final deploy | Submitted. Nothing after 19:45 |

### Stage 0 — Setup (10:50 – 11:30)
- Create Supabase project (free tier, region closest: Singapore or Mumbai). Auth → Providers → Email: turn OFF "Confirm email".
- SQL Editor → paste `backend/db/schema.sql` → Run. Check 15 tables appear in Table Editor.
- `.env.local` with the 3 variables; add the same 3 in Vercel (Production).
- Install all packages (section 2), commit `package.json` + `package-lock.json` alone, push, tell teammate to pull + `npm i`.
- Commit the 3 given files + this plan.
- `backend/lib/`: extend `api-response.ts` (`fields`), `errors.ts` (`HttpError`, generic `withErrors<A extends unknown[]>(fn: (...args: A) => Promise<Response>)` so Next's route type check still sees the real signature), `supabase.ts`, `auth.ts`, `time.ts`, `shuffle.ts`.
- Stub handlers for Stage 1 + 2 endpoints returning mock data shaped like `shared/types.ts` (so frontend never waits).
- `npm run build` → `npx vercel --prod` → put live URL in README + `docs/PROGRESS.md`.

**Done when:** live URL loads, `/api/health` returns `{ data: { status: "ok" } }`, teammate has pulled the contract.

### Stage 1 — Auth, admin, question bank, exams (11:30 – 13:00)
- `shared/validation.ts`: zod schemas for `SignupInput`, `LoginInput`, `CreateUserInput`, `UpdateUserInput`, `TopicInput`, `QuestionInput` (with the option rules), `ExamInput` (with date + duration rules). Push early — frontend imports them.
- Auth: signup, login, logout, me (preferences waits for Stage 3).
- Admin: list/search users, create user with role, change role / deactivate (block self-demotion and self-deactivation).
- Topics: list (with `questionCount`), create.
- Questions: list with filters, create, get, update (replace options), delete (409 if used in an exam).
- Exams: list (with counts + derived `state`), create (draft), get detail, update (draft only), delete (draft only).
- `backend/scripts/seed.ts` v1: create `admin@demo.com`, `examiner@demo.com`, `ali@demo.com`, `sara@demo.com`, `hamza@demo.com`, password `Demo@1234`, set roles. Run: `node --env-file=.env.local backend/scripts/seed.ts` (Node 24 runs TS directly; keep the script self-contained, import only `@supabase/supabase-js`). Add `"seed"` to `package.json` scripts.
- Update CONTRACT.md statuses, deploy.

**Done when:** with curl or the frontend: login as examiner → create topic → create 1 question of each type → create draft exam. A candidate calling `/api/exams` gets 403.

### Stage 2 — Assembly, publish, enrollment, import, candidate dashboard (13:00 – 14:15)
- PUT exam questions (pool + blueprint, draft only).
- publish-check (the 5 problems in CONTRACT.md), publish, unpublish.
- Candidates search; enrollments list / add by emails / remove (409 if attempt exists).
- `GET /api/me/exams`: bucket into available / upcoming / completed with `canStart` + `blockedReason` (rules in section 6).
- Import candidates + questions: header check, per-row zod validation, `dryRun` returns errors without writing, real run creates rows. Max 500 rows / 1 MB.
- Stub handlers for Stage 3 endpoints with mock `AttemptView` (teammate starts the workspace at 14:15).
- Deploy.

**Done when:** examiner builds an exam with a 4/4/2 blueprint, enrolls 3 candidates (one via CSV), publish-check shows problems until fixed, publishes; candidate's `/api/me/exams` shows it under available or upcoming.

### Stage 3 — Attempt engine (14:15 – 16:00) — the most important stage
- `POST /api/exams/[id]/attempts`: checks (enrolled, published, inside window, no finished real attempt), resume if in progress (log `resumed` incident), else build paper (section 6), insert attempt + `attempt_questions` snapshots. Sandbox: owner only, any state, resumes its own open sandbox attempt.
- `GET /api/attempts/[id]`: owner only, finalize if expired, return `AttemptView` with options stripped of correctness.
- Save answer: owner, in progress, `now <= effectiveEnd + 5 s grace`, validate options belong to the question (single = max 1), call `rpc('save_answer')`.
- Sync: loop the batch through the same save logic; late items → `reason: "late"` + one `late_sync` incident.
- Heartbeat: outage detection + compensation request (section 6); return announcements.
- Incidents (ignore same type from same attempt within 5 s), scratchpad, submit (idempotent), DELETE sandbox attempt.
- Auto-grading of objective questions on submit/finalize (section 6). Written answers stay `null`.
- `PATCH /api/me/preferences`.
- Stub handlers for Stage 4 endpoints. Deploy.

**Done when (test all on live URL):** start → answer → refresh (answers + time kept) → submit twice (same result, no error) → candidate opens another candidate's attempt ID (403) → set an exam with 1-minute duration and wait (auto-submitted on next request) → GET response contains no `isCorrect`.

### Stage 4 — Monitoring, grading, results, analytics (16:00 – 17:30)
- Monitor view (summary, attempts with `online`, incidents, compensations); finalize expired attempts when building it.
- Announcements list + create; incident review; compensation approve/reject (approve adds to `compensation_sec`, cap 600 total, only if attempt in progress).
- Grading queue + grade (0 ≤ marks ≤ question marks; recompute score; status `graded` when no nulls left).
- Results view + publish results (409 if attempts in progress or ungraded answers). On publish, store `paper_difficulty` on each attempt.
- Analytics: stats, 10-bucket distribution, question stats, paper fairness (formulas in section 6).
- `GET /api/me/results/[examId]` (403 until published). Deploy.

**Done when:** grade a written answer (11/10 → 400), publish, candidate sees own result, other candidate gets 403, analytics numbers match a manual check of 3 attempts.

### Stage 5 — Reports, seed, docs (17:30 – 18:45)
- Verification codes (10 chars, alphabet without 0/O/1/I), `GET /api/verify/[code]` with initials only.
- PDF: candidate result (header, score, pass/fail, per-question table, QR to `${origin}/verify/${code}`, code printed) and exam report (stats + score table). Sanitise text to Latin-1 before drawing (Helvetica crashes on other characters).
- Full seed: same 5 accounts + 15 more candidates, 3 topics (Networking, Databases, OOP), ~40 questions, 20 candidates, 4 exams (completed with graded + published results, ongoing, upcoming, draft), some incidents. Script must be re-runnable (delete demo rows first).
- `docs/DESIGN.md` (required by CLAUDE.md): requirements analysis, the ambiguity list from section 6, assumptions, DB schema (paste table list), architecture (3 layers), tech choices, design → code map (feature → files).
- README: problem, live URL, test credentials per role, features, innovation 5.3 + 5.2 with trade-offs, setup steps, tech stack.
- Security pass: call every examiner endpoint as a candidate, every attempt endpoint as another candidate → all 403. Deploy.

### Stage 6 — Freeze and ship (18:45 – 19:45)
- 18:45 feature freeze. Run the 15-minute demo script together on the live URL, all 3 roles, twice. Fix bugs only.
- Run the seed one last time so demo data is clean.
- 19:30 final `npm run build` + `npx vercel --prod`. Check live URL in an incognito window.
- Final commit + push before 19:45. After 19:45: no commits, pushes or deploys.

### If you fall behind (cut in this order)
1. Exam PDF report (keep candidate PDF)
2. Question import (keep candidate import)
3. `mostChosenWrong` + fairness chart data (keep stats + correct %)
4. Unpublish endpoint
5. Incident rate-limiting

**Never cut:** server permission checks, server timer + auto-submit, snapshots, idempotent submit, results only after publish, deploy, README.

## 6. Business rules reference

Give Claude the relevant part of this section with each task. These rules are what judges will test.

### Exam state (derived, never stored)
| State | Condition |
|---|---|
| draft | `status = 'draft'` |
| published | published and `now < start_at` |
| ongoing | published and `start_at ≤ now < end_at` |
| completed | published and `now ≥ end_at` |

Use the `exam_state` view or compute the same in TypeScript. Only drafts can be edited, have questions changed, or be deleted.

### Candidate dashboard buckets (`/api/me/exams`)
- Only exams the candidate is enrolled in and that are not draft.
- **completed:** their real attempt is submitted / auto_submitted / graded, or the exam is completed.
- **available:** exam ongoing and no finished attempt. `canStart = true`. Button says "Continue" if an attempt is in progress.
- **upcoming:** exam published, not started. `canStart = false`, `blockedReason = "Opens at <startAt>"`.

### Building a paper (start attempt)
1. `ends_at = min(now + duration_min, exam.end_at)` — a late starter does not get past the exam window.
2. No blueprint → paper = whole pool. Blueprint → for each difficulty, take a random sample of the required count from the pool questions of that difficulty.
3. `shuffle_questions` → shuffle the paper order; otherwise keep pool position order.
4. `shuffle_options` → shuffle each question's options.
5. Insert one `attempt_questions` row per question with `snapshot = { type, stem, marks, difficulty, multiScheme, negativeMarks, options: [{ id, label, isCorrect }] }` in the final order. **All grading reads the snapshot.**
6. Use `crypto.randomInt` for shuffling (not `Math.random`).

### Time rules
- `effectiveEnd = ends_at + compensation_sec`. This is the `endsAt` sent to the frontend.
- Saves are accepted while `now ≤ effectiveEnd + 5 s` (network grace for a save already in flight; explain this in DESIGN.md). After that → 410.
- `finalizeIfExpired(attempt)`: if in progress and `now > effectiveEnd + 5 s` → status `auto_submitted`, `submitted_at = effectiveEnd`, run grading. Call it at the start of every attempt endpoint, the monitor, `/api/me/exams` and results.
- Submit: `update attempts set status='submitted', submitted_at=now() where id=? and status='in_progress' returning *`. No row returned → read the attempt and return its current status (idempotent, never an error).

### Outage handling (innovation 5.3)
- Heartbeat: if `last_heartbeat_at` exists and `now − last_heartbeat_at > 45 s` and attempt in progress → create incident `offline` (detail: "No connection for about N s") and a `compensation_request` with `gap_sec = N`. Then set `last_heartbeat_at = now`.
- Approve: `compensation_sec = min(600, compensation_sec + gap_sec)`. Only while attempt is in progress (else 409). Reject: just mark rejected.
- Never trust client timestamps. The gap is measured from server heartbeats only.

### Grading
| Type | Rule |
|---|---|
| mcq_single | Correct option selected → full marks. Wrong option → −negativeMarks. Nothing selected → 0 |
| mcq_multi, all_or_nothing | Selected set equals correct set → full marks. Anything else selected → −negativeMarks. Nothing → 0 |
| mcq_multi, partial | `marks × max(0, (correctPicked − wrongPicked) ÷ totalCorrect)`, rounded to 2 decimals. No negative marking (wrong picks already cost). Selecting everything scores 0 |
| written | `null` until examiner grades; 0 ≤ marksAwarded ≤ marks |

- Attempt `score` = sum of `marks_awarded`, floored at 0, set only when no `null` remains; then status = `graded`.
- Grading can be changed until results are published (then 409).

### Analytics formulas (real attempts only: `is_sandbox = false`, submitted or graded)
- **Stats:** count, average, median, highest, lowest of `score`; pass rate = % with `score ≥ pass_marks`; average percentage = average of `score / total_marks × 100`.
- **Distribution:** 10 buckets of percentage: `0-9`, `10-19`, … `80-89`, `90-100`.
- **Question stats** (group `attempt_questions` by `question_id`): `timesShown`; `skippedPct` = no answer or empty answer; objective `correctPct` = % with full marks; written `correctPct` = average `marks_awarded / marks × 100`; `mostChosenWrong` = most selected incorrect option label with its %.
- `observedDifficulty`: `correctPct ≥ 70` → easy, `≥ 40` → medium, else hard; `null` if shown fewer than 3 times. `mismatch` = observed ≠ labelled.
- **Paper fairness (innovation 5.2):** question difficulty `d_q = 100 − correctPct_q`; if the question has no data yet, use the label (easy 25, medium 50, hard 75). `paperDifficulty` = marks-weighted average of `d_q` over the attempt's questions. `deviationPct = (paper − exam average paper) ÷ exam average × 100`, rounded.

### Ambiguities in the brief and how we resolved them (copy into DESIGN.md)
1. Random papers vs fixed total marks → blueprint requires equal marks inside each difficulty, so every paper has the same total.
2. "Ongoing" and "completed" states → derived from the schedule, so they can never be out of sync.
3. Multi-select marking → configurable per question: all-or-nothing or partial with wrong-pick penalty.
4. "Answers accepted within the permitted period" → server deadline + 5 s network grace for in-flight saves only.
5. Outages without unfair extra time → outage measured by server heartbeats, examiner-approved, capped at 10 minutes.
6. Monitoring "not conclusive evidence" → incidents are labelled indicators, need human review, never change scores.
7. Who can register → public signup creates candidates only; examiners and admins are created by an admin.
8. Editing a question already used → allowed; active and past attempts keep their snapshot.
9. Sandbox → separate attempts flagged `is_sandbox`, excluded from every statistic and result.
10. Verification privacy → the public page shows initials, exam, score and date only.
11. Showing correct answers → candidates see correct options only after results are published.
12. Candidates who never started → results can still be published; they appear as "not started".

## 7. Prompts to give Claude, per stage

Paste one prompt, let Claude finish and test it, commit, then the next.

**Stage 0**
> Read docs/BACKEND_PLAN.md sections 2–3, docs/CONTRACT.md and shared/types.ts. Build backend/lib: extend api-response.ts so fail() takes optional fields; create errors.ts (HttpError + a generic withErrors wrapper that keeps the handler's argument types), supabase.ts (adminClient + authClient with @supabase/ssr and await cookies()), auth.ts (getCurrentUser, requireUser, requireRole), time.ts, shuffle.ts. Then create stub handlers + 1-line app/api connectors for every Stage 1 and Stage 2 endpoint returning realistic mock data typed with shared/types.ts. Remember: Next.js 16, Cache Components on, await connection() in GET handlers, params is a Promise. Run npm run build.

**Stage 1** (one prompt per line)
> Create shared/validation.ts with zod schemas for every Input type used in Stage 1, following the "Validation rules" table in docs/CONTRACT.md exactly.

> Implement the 4 auth endpoints from docs/CONTRACT.md section 1 (not preferences) using the layers in docs/BACKEND_PLAN.md section 3. Signup uses auth.admin.createUser with email_confirm true, then signs in to set the cookie. Login returns 403 if the profile is inactive.

> Implement admin user endpoints (CONTRACT section 2) with data/users.ts + services/users.service.ts. Block an admin from changing their own role or deactivating themselves.

> Implement topics and questions endpoints (CONTRACT section 3). Updates replace all options. Delete returns 409 if the question is in any exam. Examiners see only their own; admins see all.

> Implement exam CRUD (CONTRACT section 4, first 5 rows). state is derived as in BACKEND_PLAN section 6. Include questionCount, enrolledCount, attemptCount (sandbox excluded). Only drafts can be edited or deleted.

> Write backend/scripts/seed.ts v1 (self-contained, only @supabase/supabase-js, reads env vars) creating the 5 demo accounts from BACKEND_PLAN Stage 1 and setting their roles. Re-runnable. Add an npm script "seed": node --env-file=.env.local backend/scripts/seed.ts

**Stage 2**
> Implement PUT /api/exams/[id]/questions, publish-check, publish and unpublish (CONTRACT section 4 + "Publish-check problems" + blueprint validation rule).

> Implement candidates search and the 3 enrollment endpoints (CONTRACT section 5) and GET /api/me/exams using the bucket rules in BACKEND_PLAN section 6.

> Implement the 2 import endpoints with papaparse using the exact CSV formats in CONTRACT section 5. Validate every row with the zod schemas, return row errors (row 1 = first data row), dryRun writes nothing. Then add stubs for all Stage 3 endpoints.

**Stage 3**
> Implement POST /api/exams/[id]/attempts and GET /api/attempts/[id] following "Building a paper" and "Time rules" in BACKEND_PLAN section 6. The GET response must never contain isCorrect. Add finalizeIfExpired in services/attempt.service.ts and use it in every attempt endpoint.

> Implement save answer, sync, submit (idempotent conditional update) and objective auto-grading exactly as the Grading table in BACKEND_PLAN section 6. Save uses rpc('save_answer').

> Implement heartbeat (with the outage rule), incidents (5 s duplicate filter), scratchpad, DELETE sandbox attempt, and PATCH /api/me/preferences. Then add stubs for all Stage 4 endpoints.

**Stage 4**
> Implement monitor, announcements, incident review and compensation decisions (CONTRACT section 8, outage rules in BACKEND_PLAN section 6).

> Implement grading queue, grade, results, publish results and GET /api/me/results/[examId] (CONTRACT section 9 + 6). Recompute score and status after every grade.

> Implement GET /api/exams/[id]/analytics using the "Analytics formulas" in BACKEND_PLAN section 6. Exclude sandbox attempts.

**Stage 5**
> Implement verification codes, GET /api/verify/[code], and the two PDF endpoints with pdf-lib + qrcode (CONTRACT section 10). Sanitise all text to characters Helvetica can encode. Return new Response(bytes, { headers: { "Content-Type": "application/pdf" } }); wrap bytes in a Blob if TypeScript complains.

> Extend backend/scripts/seed.ts into the full demo dataset described in BACKEND_PLAN Stage 5. It must be re-runnable.

> Write docs/DESIGN.md as required by CLAUDE.md, using BACKEND_PLAN sections 2, 3 and 6 (including the 12 ambiguities) and backend/db/schema.sql. Then update README.md with live URL, test credentials per role, features, innovation 5.3 + 5.2 and setup steps.

**When something breaks:** paste the exact error + the file name and say "fix only this, don't change the contract". If a bug takes more than 20 minutes, tell your teammate and decide together whether to cut it.
