# Design Document — Secure Examination Management System

> Our evaluation script. Fill in as we build; finalize in Stage 5. Sources: `docs/PROBLEM_STATEMENT.md`, `docs/BACKEND_PLAN.md` sections 2, 3, 6, `backend/db/schema.sql`.

## 1. Requirements analysis
| Requirement (brief §) | How we meet it | Status |
|---|---|---|
| 3.1 Auth & authorization | Supabase Auth behind our API, httpOnly cookie; role + ownership checked in every backend service | ⏳ |
| 3.2 Exam management | Exam CRUD (draft only), derived state, publish-check before publishing | ⏳ |
| 3.3 Question management | Question bank with topics/difficulty, 3 types, marking schemes, shuffling, frozen snapshots | ⏳ |
| 3.4 Candidate management | Enrollment by email/search/CSV, dashboard buckets, availability window enforced on the server | ⏳ |
| 3.5 Exam interface | Server timer, autosave with `clientSeq`, resume, navigator states, auto-submit | ✅ backend |
| 3.6 Monitoring | Monitor view (5 s polling), incidents as indicators, announcements | ✅ backend |
| 3.7 Grading | Auto-grading from snapshot, manual written grading with validation, score recompute | ✅ backend |
| 3.8 Results & analytics | Controlled publish, own results only, stats/distribution/question stats | ✅ backend |
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
13. **Partial multi-select: "selecting everything scores 0" vs the formula** → the plan gives both `marks × max(0, (right − wrong) ÷ totalCorrect)` and "selecting everything scores 0". They disagree when most options are correct (3 of 4 correct, tick all 4 → formula gives 2/3 of the marks). We apply both literally: ticking every option scores 0, otherwise the formula. This stops "tick everything" from ever earning marks. Code: `backend/lib/grading.ts`.
14. **When is an attempt "graded"?** → an all-objective paper is graded automatically at submit, so it becomes `graded` immediately. A paper with written questions stays `submitted` / `auto_submitted` with no score until the examiner grades every written answer.
15. **Offline answers that arrive after the deadline** → the client's own timestamps are never trusted, so we cannot prove an answer was written in time. Sync after the deadline + 5 s marks every item `late` (not saved) and logs one `late_sync` incident for the examiner to see.
16. **Sandbox attempts** → stored in the same tables (flag `is_sandbox`), so preview uses exactly the real exam code, but they are filtered out of every count, enrollment status, result, statistic and the monitor, never create incidents, and can be deleted (reset) by the exam owner. A preview lasts `durationMin` and is not limited by the exam window, so examiners can try a draft or future exam.
17. **Auto-submit time** → an expired attempt is stored with `submitted_at` = its deadline (not the moment someone noticed), so the record shows when time really ran out.
18. **When can results be published?** → the brief only says "controlled publication". We allow it only after the exam window has ended (otherwise a candidate who has not started yet could read the questions and correct answers), when no attempt is still in progress, and when every written answer is graded. Publishing locks grading.
19. **Compensation approval edge cases** → approving adds the measured gap to the attempt (total capped at 10 minutes) and is only possible while the attempt is running; rejecting is always possible. The request is claimed first, so a double click can never add time twice.
20. **"Not enough data" for difficulty statistics** → with fewer than 3 scored answers a question's observed difficulty is `null` and paper fairness uses the question's own label (easy 25, medium 50, hard 75). One or two answers would only show noise.
21. **Candidates who never started in results** → the results table lists attempts only; never-started candidates appear in the enrollment list as "not started" (the result row type has no such status).
22. **When is a verification code created?** -> the first time a PUBLISHED result is downloaded as PDF, then it never changes (a unique row per attempt, so simultaneous downloads share one code). Before publishing the owner can still download a PROVISIONAL report without a code.
23. **Non-Latin text in PDFs** -> the built-in PDF fonts only draw Latin-1, so Urdu/Arabic/emoji in answers appear as "?" in the PDF (the app itself stores and shows them fine). Chosen over embedding a large font file to keep the deploy small and the report reliable; every string is cleaned first so one odd character can never break the whole report.

### Frontend ambiguities and assumptions
24. **Heartbeat in a background tab** -> browsers slow down `setInterval` in hidden tabs (often to once a minute), which would look like an outage. The workspace runs its 15 s heartbeat from a tiny Web Worker timer (not throttled the same way) and also beats immediately when the tab becomes visible again or the network comes back. Code: `frontend/lib/useHeartbeat.ts`.
25. **Which clock does the timer trust?** -> never the device clock alone. Every attempt view, heartbeat and sync returns `serverNow`; the page keeps `offset = serverNow - Date.now()` and shows `endsAt - (now + offset)`. Changing the computer's clock does not change the timer. Code: `frontend/pages/AttemptPage.tsx`.
26. **What happens at 00:00?** -> the page sends the last unsaved answers, then calls submit, and shows "submitted automatically when time ran out". If the device is offline at that moment it says the saved answers will be submitted by the server (the server closes expired attempts by itself). The server stores a timer-triggered submit as `submitted` (it arrives inside the 5 s grace); a never-reconnected attempt becomes `auto_submitted`.
27. **Submit while answers are still only on the device** -> blocked with a clear message ("reconnect, then submit"), so a candidate can never submit an attempt that is missing answers they can see on screen.
28. **Dark and high-contrast themes** -> the Figma only shows the light parchment palette. Dark and contrast are derived from the same tokens (same names, different values), so every component supports all three themes without extra code. Contrast mode also uses thicker borders. Text size (small / medium / large) scales the root font size.
29. **Theme flash on load** -> preferences live in the database, but the first paint happens before the API answers. The last preferences are cached in `localStorage` (`examcore:prefs`) and a tiny inline script in `app/layout.tsx` applies them before the page draws; the server value wins once `/api/auth/me` returns.
30. **Admin "create user" needs a password** -> the Figma form has no password field, but the API requires one (no email service). The form has a password field with the same rules as signup; the admin tells the user their first password.
31. **Indicators wording** -> monitoring items are always called "Indicators", never "cheating", and the monitor says "Indicators are not proof of misconduct. They never change scores".
32. **Results rows** -> the results table lists real attempts only (as the API returns them); candidates who never started are visible in the Candidates tab ("not started"), see ambiguity 21.
33. **Colour is never the only signal** -> every status has text or an icon too (Online/Offline text next to the dot, "Pass"/"Not passed", "! Mismatch" badge, timer label "Under 5 minutes" / "Under 1 minute").

## 3. Assumptions & constraints
- 10-hour build, team of 2, free-tier services only (no paid APIs, per brief §06).
- Server clock is the only source of truth for time; device clocks are used only with a server offset.
- Live updates use polling (5 s monitor, 15 s heartbeat) instead of websockets: simpler and reliable on Vercel serverless.
- CSV import imports the valid rows and reports the bad ones (no all-or-nothing), so one typo does not block 200 good rows.
- A draft exam may be incomplete (marks not adding up); the publish-check checklist is what blocks publishing, so examiners can build step by step.
- Publishing needs the end time in the future, so a finished exam can only come from real time passing (the demo seed in Stage 5 handles this).
- Auto-submit is "lazy": there is no background job. Any request that touches an expired attempt (workspace, dashboard; later the monitor and results) closes it first. The result is the same as a timer job, with nothing extra to run on Vercel.
- One real attempt per candidate per exam is guaranteed by the database (partial unique index), not only by code, so double clicks can never create two attempts.
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

**Frontend layers.** `app/**/page.tsx` are 1-line connectors -> `frontend/pages/*Page.tsx` (one file per screen, reads URL params, owns page state) -> `frontend/components/**` (presentational pieces: `ui/` design system, `shell/` app shell + role guard, `exam/` exam and workspace pieces) -> `frontend/lib/**` (the only place that talks to the API: `api-client.ts`, plus hooks `useApi`, `useOutbox`, `useHeartbeat`, `useIncidents`, `auth.tsx`). Pages never call `fetch` directly, so errors (401 -> login, network -> "No connection", 5xx -> friendly message, 400 -> field errors) are handled the same way everywhere.

**Design system.** Colours are CSS variables in `app/globals.css` (parchment, surface, ink, mute, cobalt, line, tint, sand, danger, warning, success, plus on-cobalt, on-danger, overlay...) mapped into Tailwind with `@theme inline`. Three themes (`data-theme = light | dark | contrast`) and three text sizes (`data-font = sm | md | lg`) on `<html>` redefine the same variables, so components never hard-code colours. Typography: a condensed serif for display headings, a sans for UI text, a monospace for numbers and timers (`.num`).

## 6. Technology choices
| Choice | Why |
|---|---|
| Next.js 16 (one app) | frontend and API in one deploy; no CORS; typed end to end |
| Supabase Postgres | real relational DB with constraints, free tier, built-in auth |
| zod | one set of validation rules shared by frontend forms and backend |
| pdf-lib + qrcode | pure JS, works on Vercel serverless, no paid service |
| Polling over Realtime | fewer moving parts, works through any network |
| Vercel | free, one-command deploys |
| shadcn (Base UI) + Tailwind v4 tokens | accessible primitives (focus, keyboard, ARIA) we style ourselves; themes are just variable swaps |
| No chart library | the histogram and fairness bars are plain divs (10 bars, a few rows): smaller bundle, themeable, accessible labels |
| localStorage outbox + Web Worker timer | browser built-ins only: work offline and in background tabs without a service worker or extra packages |

## 7. Innovation challenges
- **5.3 Failure-resilient exams:** (1) every answer is autosaved with a `clientSeq`; the database function `save_answer()` keeps only the newest, so retries and out-of-order requests are harmless. (2) While offline, the browser keeps changes in an outbox and replays them through `POST /sync` when it reconnects; answers that arrive after the deadline + 5 s are refused (`late`) because device clocks are not trusted. (3) The workspace sends a heartbeat every 15 s. If the server sees a gap of more than 45 s between two heartbeats (server timestamps only), it records an `offline` incident and a **pending** compensation request with the measured gap. (4) The examiner approves or rejects it in the monitor (Stage 4); approved time is added to `compensation_sec`, capped at 10 minutes. Refreshing or changing device never loses time: the deadline is stored on the server. **Trade-offs:** no automatic extra time (prevents abuse by unplugging on purpose), at most 45 s of an outage goes unnoticed, and a human must approve.
- **5.2 Fairness of randomized exams:** (1) the examiner sets a blueprint (e.g. 4 easy, 4 medium, 2 hard) and every paper takes a random sample per difficulty with a crypto shuffle; because marks are equal inside a difficulty, every paper has the same total marks. (2) After the exam, each question's real difficulty is measured from the answers (`100 - correct %`). (3) A paper's difficulty is the marks-weighted average of its questions, and `deviationPct` says how much harder or easier it was than the exam average, so the examiner can see whether random papers stayed fair. Questions labelled easy that candidates found hard are flagged as mismatches. **Trade-offs:** equal marks per difficulty limits how questions can be mixed; with few candidates the numbers are noisy, so below 3 scored answers we fall back to the label; fairness is shown, not corrected automatically (no re-grading or scaling).

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
| Start attempt: enrollment, window, resume, one real attempt per candidate (3.4, 3.5) | `handlers/exams/[id]/attempts.ts` -> `services/attempt.service.ts` (`startAttempt`) -> `data/attempts.ts`; unique index `attempts_one_real_per_candidate` in `db/schema.sql` |
| Paper building: blueprint sampling, shuffling, frozen snapshot (3.3, 5.2, data integrity) | `lib/paper.ts` (`buildPaper`), `lib/shuffle.ts`; stored in `attempt_questions.snapshot` via `data/attempts.ts` (`insertPaper`) |
| Workspace view, never exposes correctness (3.5) | `handlers/attempts/[id].ts` -> `services/attempt.service.ts` (`getAttemptView`, dedicated mapper) |
| Server timer, 5 s grace, lazy auto-submit (3.5, data integrity) | `lib/time.ts` (`effectiveEnd`, `isExpired`), `services/attempt.service.ts` (`finalizeIfExpired`, `assertOpen`); also called by `services/my-exams.service.ts` |
| Autosave, newest-wins, offline outbox sync (3.5, 5.3) | `handlers/attempts/[id]/answers/[aqId].ts`, `handlers/attempts/[id]/sync.ts` -> `services/answer.service.ts` -> `data/answers.ts` (`save_answer()` SQL function) |
| Idempotent submit (no duplicate submissions) | `handlers/attempts/[id]/submit.ts` -> `services/attempt.service.ts` (`submitAttempt`, conditional update in `data/attempts.ts` `finishAttempt`) |
| Auto-grading incl. multi-select schemes (3.7) | pure rules `lib/grading.ts` (`gradeQuestion`, `attemptScore`) applied by `services/grading.service.ts` (reads snapshots only) |
| Heartbeat outage detection + compensation requests (5.3) | `handlers/attempts/[id]/heartbeat.ts` -> `services/heartbeat.service.ts` -> `data/attempts.ts` (`touchHeartbeat`, race-safe) + `data/monitoring.ts` |
| Incidents as indicators only (3.6) | `handlers/attempts/[id]/incidents.ts` -> `services/heartbeat.service.ts` (`reportIncident`, 5 s duplicate filter) -> `data/monitoring.ts` |
| Digital scratchpad (4.8) | `handlers/attempts/[id]/scratchpad.ts` -> `services/answer.service.ts` -> `data/answers.ts`; size rules in `shared/validation.ts` |
| Examination sandbox (4.3) | `startAttempt(..., sandbox)` + `deleteSandboxAttempt` in `services/attempt.service.ts`; `is_sandbox` filters in `data/exams.ts`, `data/enrollments.ts`, `data/attempts.ts` |
| Customizable workspace preferences (4.7) | `handlers/me/preferences.ts` -> `services/users.service.ts` (`updateMyPreferences`) -> `data/users.ts` |
| Live monitor, polled every 5 s (3.6) | `handlers/exams/[id]/monitor.ts` -> `services/monitor.service.ts` (`getMonitor`) -> `data/monitoring.ts` (`attemptProgress`, `listIncidents`) + `data/attempts.ts` |
| Announcements to candidates (3.6) | `handlers/exams/[id]/announcements.ts` -> `services/monitor.service.ts`; delivered through heartbeat + attempt view |
| Incident review, indicators not proof (3.6) | `handlers/incidents/[id].ts` -> `services/monitor.service.ts` (`reviewIncident`) -> `data/monitoring.ts` |
| Outage compensation approve/reject, cap 600 s (5.3) | `handlers/compensations/[id].ts` -> `services/monitor.service.ts` (`decideCompensation`: claim first, optimistic time update) -> `data/monitoring.ts`, `data/attempts.ts` (`setCompensationSec`) |
| Manual grading of written answers (3.7) | `handlers/attempt-questions/[aqId]/grade.ts`, `handlers/exams/[id]/grading.ts` -> `services/results.service.ts` (`gradeAnswer` then `gradeAttempt` recomputes score/status) |
| Results, controlled publishing, own result only (3.8) | `handlers/exams/[id]/results*.ts`, `handlers/me/results/[examId].ts` -> `services/results.service.ts` (`getResults`, `publishResults`, `getMyResult`) -> `data/exam-papers.ts` |
| Statistics, distribution, question stats (3.8) | pure maths `lib/analytics.ts` (`buildStats`, `buildDistribution`, `buildQuestionStats`) used by `services/results.service.ts` (`getAnalytics`) |
| Paper fairness (5.2) | `lib/analytics.ts` (`paperDifficulties`, `buildFairness`); stored at publish in `attempts.paper_difficulty` |
| Exam-wide reads beyond 1000 rows | `data/paging.ts` (`fetchAll`) |
| Verifiable result report: code + public check (secondary feature) | `lib/verification.ts` (alphabet without look-alikes, initials) -> `services/report.service.ts` (`verifyCode`, `getOrCreateCode`) -> `data/reports.ts`; handler `handlers/verify/[code].ts` |
| PDF reports with QR (secondary feature) | `lib/pdf.ts` (pdf-lib wrapper: wrapping, tables, Latin-1 safe text) -> `services/report.service.ts` (`buildAttemptReport`, `buildExamReport`) -> `handlers/reports/*` |
| Demo data | `scripts/seed.ts` (accounts, question bank, 5 exams, simulated attempts graded with the same rules) |
| **Frontend: screen -> page file -> components -> API** | |
| Login / signup, role redirect (3.1) | `pages/LoginPage.tsx`, `pages/SignupPage.tsx` -> `lib/auth.tsx` (`login`, `signup`, `roleHome`) -> `POST /api/auth/login`, `/signup`; forms validated with `loginSchema` / `signupSchema` |
| Role guard on every area | `layouts/RoleLayout.tsx` + `layouts/{Admin,Examiner,Candidate}Layout.tsx` (`app/*/layout.tsx`) -> `GET /api/auth/me`; wrong role -> own home, logged out -> `/login` |
| Admin users + candidate CSV import (3.1, 4.4) | `pages/AdminUsersPage.tsx`, `components/ImportModal.tsx` (dry run -> error table -> import) -> `/api/admin/users*`, `/api/import/candidates` |
| Examiner overview | `pages/ExaminerDashboardPage.tsx` -> `GET /api/exams` |
| Question bank, 3 types, topics (3.3) | `pages/QuestionBankPage.tsx`, `components/exam/QuestionEditor.tsx` -> `/api/questions*`, `/api/topics`, `/api/import/questions`; `questionSchema` |
| Create / edit exam (3.2) | `pages/ExamCreatePage.tsx`, `components/exam/tabs/DetailsTab.tsx`, `components/exam/ExamForm.tsx` -> `POST/PATCH /api/exams`; `examSchema` |
| Exam page with tabs | `pages/ExamPage.tsx` (tab in `?tab=`) -> `GET /api/exams/[id]` |
| Pool + blueprint meter (3.3, 5.2) | `components/exam/tabs/QuestionsTab.tsx` -> `PUT /api/exams/[id]/questions` |
| Enrollment (3.4) | `components/exam/tabs/CandidatesTab.tsx` -> `/api/exams/[id]/enrollments*`, `/api/candidates` |
| Publish review checklist | `components/exam/PublishReviewModal.tsx` -> `GET publish-check`, `POST publish` |
| Sandbox preview (4.3) | Preview button in `pages/ExamPage.tsx` -> `POST /api/exams/[id]/attempts {sandbox:true}`; `components/exam/SandboxBar.tsx` (Reset = DELETE + new attempt) |
| Live monitor every 5 s, paused in hidden tab (3.6, 5.3) | `components/exam/tabs/MonitorTab.tsx` -> `GET monitor`, `PATCH /api/incidents/[id]`, `PATCH /api/compensations/[id]`, `POST announcements` |
| Grading one answer at a time (3.7) | `components/exam/tabs/GradingTab.tsx` -> `GET grading`, `PATCH /api/attempt-questions/[aqId]/grade`; `gradeSchema` + max-marks check |
| Results + controlled publishing + PDFs (3.8) | `components/exam/tabs/ResultsTab.tsx` -> `GET results`, `POST results/publish` (409 reason shown as is), `/api/reports/*` |
| Analytics + paper fairness (3.8, 5.2) | `components/exam/tabs/AnalyticsTab.tsx` (histogram, fairness bars, question table) -> `GET analytics` |
| Candidate dashboard (3.4) | `pages/CandidateDashboardPage.tsx` -> `GET /api/me/exams` (live "opens in" countdown) |
| Instructions + start / resume (3.5) | `pages/ExamInstructionsPage.tsx` -> `POST /api/exams/[id]/attempts` |
| Exam workspace (3.5) | `pages/AttemptPage.tsx` + `components/exam/{TimerPill,SaveStatusPill,Navigator,QuestionView,SubmitDialog,SubmittedScreen,AnnouncementBanner}.tsx` -> `GET /api/attempts/[id]`, `POST submit` |
| Offline outbox + sync (5.3) | `lib/useOutbox.ts` (localStorage `outbox:<attemptId>`, `clientSeq` counter, debounce, flush) -> `PUT answers/[aqId]`, `POST sync`; red offline bar + blue "Reconnected — syncing" bar in `AttemptPage.tsx` |
| Heartbeat + announcements + compensation time (5.3, 3.6) | `lib/useHeartbeat.ts` (Web Worker timer, visibility/online triggers) -> `POST heartbeat` (new `endsAt`, announcements) |
| Monitoring indicators from the browser (3.6) | `lib/useIncidents.ts` (tab hidden, window blur, copy/paste, full-screen exit; not in sandbox) -> `POST incidents` |
| Scratchpad, text + drawing (4.8) | `components/exam/Scratchpad.tsx` (autosave every 5 s, "Not graded") -> `GET/PUT scratchpad` |
| Customizable workspace (4.7) | `components/exam/SettingsPopover.tsx` -> `lib/auth.tsx` `updatePreferences` -> `PATCH /api/me/preferences`; applied instantly via `data-theme` / `data-font` |
| Candidate result (3.8) | `pages/CandidateResultPage.tsx` (table on desktop, cards on phones) -> `GET /api/me/results/[examId]`, `/api/reports/attempts/[id]` |
| Public verification (secondary) | `pages/VerifyPage.tsx` -> `GET /api/verify/[code]` (code normalised, initials only) |
| One API client, same error handling everywhere | `lib/api-client.ts` (`ApiClientError`, 401 -> login, offline -> status 0), `lib/useApi.ts`, `lib/forms.ts` (`zodFields`) |
