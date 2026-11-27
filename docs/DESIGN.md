# Design Document — Secure Examination Management System

> Our evaluation script. Fill in as we build; finalize in Stage 5. Sources: `docs/PROBLEM_STATEMENT.md`, `docs/BACKEND_PLAN.md` sections 2, 3, 6, `backend/db/schema.sql`.

## 1. Requirements analysis
| Requirement (brief §) | How we meet it | Status |
|---|---|---|
| 3.1 Auth & authorization | Supabase Auth behind our API, httpOnly cookie; role + ownership checked in every backend service | ⏳ |
| 3.2 Exam management | Exam CRUD (draft only), derived state, publish-check before publishing | ⏳ |
| 3.3 Question management | Question bank with topics/difficulty, 3 types, marking schemes, shuffling, frozen snapshots | ⏳ |
| 3.4 Candidate management | Enrollment by email/search/CSV, dashboard buckets, availability window enforced on the server | ⏳ |
| 3.5 Exam interface | Server timer, autosave with `clientSeq`, resume, navigator states, auto-submit | ⏳ |
| 3.6 Monitoring | Monitor view (5 s polling), incidents as indicators, announcements | ⏳ |
| 3.7 Grading | Auto-grading from snapshot, manual written grading with validation, score recompute | ⏳ |
| 3.8 Results & analytics | Controlled publish, own results only, stats/distribution/question stats | ⏳ |
| 4.1–4.8 Secondary features | See README feature list | ⏳ |
| 5.3 + 5.2 Innovation | Heartbeat outage compensation; difficulty blueprint + paper fairness | ⏳ |

## 2. Ambiguities in the brief and how we resolved them
1. **Random papers vs fixed total marks** → blueprint requires equal marks inside each difficulty, so every paper has the same total.
2. **"Ongoing" and "completed" states** → derived from the schedule, so they can never be out of sync.
3. **Multi-select marking** → configurable per question: all-or-nothing or partial with wrong-pick penalty.
4. **"Answers accepted within the permitted period"** → server deadline + 5 s network grace for in-flight saves only.
5. **Outages without unfair extra time** → outage measured by server heartbeats, examiner-approved, capped at 10 minutes.
6. **Monitoring "not conclusive evidence"** → incidents are labelled indicators, need human review, never change scores.
7. **Who can register** → public signup creates candidates only; examiners and admins are created by an admin.
8. **Editing a question already used** → allowed; active and past attempts keep their snapshot.
9. **Sandbox** → separate attempts flagged `is_sandbox`, excluded from every statistic and result.
10. **Verification privacy** → the public page shows initials, exam, score and date only.
11. **Showing correct answers** → candidates see correct options only after results are published.
12. **Candidates who never started** → results can still be published; they appear as "not started".

## 3. Assumptions & constraints
- 10-hour build, team of 2, free-tier services only (no paid APIs, per brief §06).
- Server clock is the only source of truth for time; device clocks are used only with a server offset.
- Live updates use polling (5 s monitor, 15 s heartbeat) instead of websockets: simpler and reliable on Vercel serverless.
- CSV import imports the valid rows and reports the bad ones (no all-or-nothing), so one typo does not block 200 good rows.
- A draft exam may be incomplete (marks not adding up); the publish-check checklist is what blocks publishing, so examiners can build step by step.
- Publishing needs the end time in the future, so a finished exam can only come from real time passing (the demo seed in Stage 5 handles this).
- _Add more as we build._

## 4. Database design
Postgres (Supabase). Full DDL: `backend/db/schema.sql`. RLS is on for every table with no policies, so the public key can read nothing; only the backend (secret key) can query.

| Table | Purpose |
|---|---|
| `profiles` | one row per auth user: name, role, active flag, workspace preferences |
| `topics`, `questions`, `question_options` | reusable question bank |
| `exams`, `exam_questions` | exam settings, blueprint, question pool |
| `enrollments` | which candidates may take which exam |
| `attempts` | one real attempt per candidate per exam (partial unique index), sandbox flag, deadline, compensation |
| `attempt_questions` | frozen paper: snapshot of question + marking scheme + option order per attempt |
| `answers` | latest answer per question, `client_seq` keeps only the newest save |
| `incidents`, `announcements`, `compensation_requests` | monitoring and outage handling |
| `scratchpads`, `report_verifications` | workspace scratchpad, verifiable report codes |

Key integrity rules in the database: `exam_state` view (derived state), `save_answer()` function (atomic newest-wins save), check constraints matching the validation rules.

## 5. Architecture
```
Browser (frontend/)  →  /api/... (app/api connectors)
                          → backend/handlers   parse request, call service, send { data } / { error }
                          → backend/services   business rules + permission checks
                          → backend/data       the only Supabase queries, snake_case ↔ camelCase
                          → Supabase Postgres
shared/types.ts + shared/validation.ts are used by both sides, so the contract can't drift.
```

## 6. Technology choices
| Choice | Why |
|---|---|
| Next.js 16 (one app) | frontend and API in one deploy; no CORS; typed end to end |
| Supabase Postgres | real relational DB with constraints, free tier, built-in auth |
| zod | one set of validation rules shared by frontend forms and backend |
| pdf-lib + qrcode | pure JS, works on Vercel serverless, no paid service |
| Polling over Realtime | fewer moving parts, works through any network |
| Vercel | free, one-command deploys |

## 7. Innovation challenges
- **5.3 Failure-resilient exams:** _describe outbox + heartbeat + compensation flow and trade-offs._
- **5.2 Fairness of randomized exams:** _describe blueprint + paper difficulty + deviation and trade-offs._

## 8. Design → code map
| Design item | Files |
|---|---|
| Response format `{ data }` / `{ error, fields? }` | `backend/lib/api-response.ts` (`ok`, `fail`) |
| Error handling (one place, no leaked DB errors) | `backend/lib/errors.ts` (`HttpError`, `withErrors`) |
| Server-only DB access (secret key) + login cookie | `backend/lib/supabase.ts` (`adminClient`, `authClient`) |
| Backend permission checks (3.1) | `backend/lib/auth.ts` (`requireUser`, `requireRole`) |
| Server-side timing (data integrity) | `backend/lib/time.ts` (`effectiveEnd`, `isExpired`, 5 s grace) |
| Fair randomization (3.3, 5.2) | `backend/lib/shuffle.ts` (`crypto.randomInt`) |
| Thin URL connectors | `app/api/**/route.ts` -> `backend/handlers/**` (stubs for now, see `backend/lib/mock.ts`) |
| Validation, same rules both sides (brief 06) | `shared/validation.ts` (zod), used by handlers via `backend/lib/http.ts` `parseBody` |
| Signup / login / logout / me (3.1) | `handlers/auth/*` -> `services/auth.service.ts` -> `data/users.ts` |
| Admin manages users and roles (3.1); no self-demotion | `handlers/admin/users*` -> `services/users.service.ts` -> `data/users.ts` |
| Reusable question bank, topics, 3 question types (3.3) | `handlers/topics.ts`, `handlers/questions*` -> `services/questions.service.ts` -> `data/topics.ts`, `data/questions.ts` |
| Ownership: examiner sees only own, admin all | `assertOwner` in `lib/auth.ts`, used by every service |
| Exam CRUD, derived state, draft-only edit (3.2) | `handlers/exams*` -> `services/exams.service.ts` -> `data/exams.ts`; `examState` in `lib/time.ts` |
| Demo accounts | `backend/scripts/seed.ts` (`npm run seed`) |
| Exam assembly: pool, blueprint, publish-check, publish (3.2, 5.2) | `handlers/exams/[id]/{questions,publish-check,publish,unpublish}.ts` -> `services/assembly.service.ts` (`buildCheck` = the 5 publish problems) -> `data/exams.ts` |
| Enrollment + candidate search (3.4) | `handlers/candidates.ts`, `handlers/exams/[id]/enrollments*` -> `services/enrollment.service.ts` -> `data/enrollments.ts` |
| Candidate dashboard buckets, availability window (3.4) | `handlers/me/exams.ts` -> `services/my-exams.service.ts` -> `data/enrollments.ts`, `data/attempts.ts` |
| Bulk CSV import with validation and row errors (4.4) | `handlers/import/*` -> `services/import.service.ts`; CSV limits + header check in `lib/csv.ts` |
| _remaining rows: fill in as features land_ | |
