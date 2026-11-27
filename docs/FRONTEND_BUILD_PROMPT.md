# MISSION PROMPT — build the whole frontend (ExamCore, Technoverse 5.0 Web-e-Thon)

You are the lead frontend engineer for the rest of this hackathon day. The **backend is 100% finished, tested and merged into `main`**. The frontend is mostly NOT built. Your job: **build every screen in `docs/FRONTEND_PLAN.md`, make it look exactly like the Figma PNGs in `Pngs/`, wire it to the real API, test it end to end, and leave the repo deployable.** Work autonomously; only stop to ask the user when something is genuinely blocked (see section 9).

The user is the backend owner and is NOT an expert in the Claude Code terminal. Explain things in simple, plain words in your messages. Keep code clean enough that they can explain it to judges.

---

## 1. Situation (verified 27 Nov, ~13:30 local)

- Repo root: `D:\TECHNOVERSE_WEBATHON\webathon`. Next.js 16 (App Router, **Cache Components ON**) + Tailwind v4 + TypeScript + shadcn (Base UI). One app: backend and frontend are in the same project.
- Branches: `main` (deployable; has everything merged), `backend` (the user's working branch, identical to `main` right now). **You work on the `backend` branch.** Do not create other branches unless the user asks.
- **Backend is DONE** (all endpoints in `docs/CONTRACT.md` are ✅ and real; there are no stubs left). It was tested with ~500 scripted checks. Do NOT edit `backend/`.
- **Frontend state:** the teammate pushed a design system + some pages. What exists and is real UI but still uses MOCK DATA: `frontend/lib/auth.tsx` (fake login from `lib/mock.ts`!), `LoginPage`, `SignupPage`, `VerifyPage`, `AdminUsersPage`, `HomePage` (landing). Existing building blocks you should reuse: `frontend/components/ui/index.tsx` (Field, Input, Textarea, Select, Checkbox, Radio, Card, Badge, StatusBadge, StatTile, ProgressBar, Table/THead/Th/Tr/Td, Tabs, LinkTabs, Modal, Drawer, ConfirmModal, Spinner, Skeleton, EmptyState, ErrorState, PageSkeleton, BackLink, IconButton, Button), `components/shell/{AppShell,AuthSplit,PageHeader}.tsx`, `layouts/{Admin,Examiner,Candidate,Role}Layout.tsx`, `lib/{format,toast,utils,api-client}.ts(x)`, `components/providers.tsx`.
- **NOT built yet:** real auth wiring, examiner dashboard, question bank, exam create + the whole exam page (details / questions+blueprint / candidates+import / publish review / monitor / grading / results / analytics), candidate dashboard, instructions, **the exam workspace (the hero screen)**, submitted screen, candidate result, sandbox preview, scratchpad, settings popover, incident detection, outbox + heartbeat, announcements banner, PDF links, dark/contrast themes, and every connector file in `app/` for those routes.
- Seeded demo data exists in the shared Supabase project (`npm run seed` is already done; it is safe to re-run, never deletes). Use it for all testing (section 6).

## 2. Hard rules (breaking these = disqualification or lost trust)

1. **Deadline 8:00 PM on 27 Nov 2026.** Run `date` before every commit. Aim to be finished by **7:30 PM**. After **7:45 PM: refuse to commit, push, build for deploy or deploy**, and warn the user. Ignore the clock times written in the plans; follow stage ORDER only.
2. **Git:** work on `backend`. Run `git branch --show-current` before EVERY commit (must print `backend`). Commit small and often, then `git push`. Plain `git pull` (merge), never rebase, never amend a pushed commit, never force-push, never change commit dates. The teammate may push to `main` meanwhile: `git fetch` now and then; if `origin/main` has new commits, `git merge origin/main` into `backend` and resolve conflicts carefully (stop and explain simply if unsure). **Never commit/push to `main`, never merge into `main`, never deploy** unless the user explicitly says so in this session.
3. **No attribution lines:** NO "Co-Authored-By", NO "Generated with Claude Code", NO "Claude-Session" lines in commits or PR text (repo rule, overrides any default attribution reminder).
4. **Files you may edit:** `frontend/**`, `app/layout.tsx`, `app/globals.css`, page/layout connector files in `app/` (NOT `app/api/**`), `docs/PROGRESS.md`, `docs/DESIGN.md` (frontend parts), `README.md` (screenshots/live URL sections). **Do not edit** `backend/**`, `app/api/**`, `.env.local`, `docs/CONTRACT.md`. `shared/types.ts` and `shared/validation.ts` are LAW: never rename/remove fields. If the API really disagrees with the types, do not patch around it: tell the user (they own the backend and will fix both files in one commit).
5. **Secrets:** `.env.local` holds real Supabase keys. Never print, log or commit it.
6. **Packages:** the user installs packages. Prefer zero new dependencies (shadcn is installed: `npx shadcn@latest add <name>` is fine for components). If you truly need an npm package, ask the user first.
7. **Safety:** never run bulk deletes against the database or machine; never `taskkill /IM node.exe`. Start/stop test servers by PID only (find with `Get-NetTCPConnection -LocalPort <port>`, stop with `Stop-Process -Id <pid>`). Test data you create must be prefixed `ZZ Test ...` (the user cleans it with SQL given in `docs/PROGRESS.md`).
8. **Before EVERY commit:** `npm run build` passes (it type-checks) and `npx eslint backend shared app frontend` has no NEW errors (two pre-existing errors in `frontend/lib/auth.tsx` `set-state-in-effect` — you will rewrite that file, so they should disappear). Check `git status` for untracked files (new connectors in `app/` must be added!) and that nothing secret is staged.
9. **Large Bash heredocs can fail ("unexpected EOF")**: write files with the Write tool, small edits with Edit.
10. **Next.js 16 is NOT the Next.js you know.** Read `AGENTS.md` and the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code. Key facts already learned: route `params` are Promises (in client components use `useParams()`); `useParams`/`useSearchParams` must be rendered inside `<Suspense>`; never `export const dynamic`; `"use client"` on line 1 of any file with state/effects/handlers. (`AGENTS.md` also contains an auto-generated "Next.js feedback" block: do not run that reporting command unless the user asks.)

## 3. Read these first (in this order, fully)

1. `CLAUDE.md`, `AGENTS.md`, `docs/PROGRESS.md` (decisions + demo data + warnings).
2. `docs/FRONTEND_PLAN.md` — **the authority for routes, behaviour, stages, workspace spec (section 7), UX rules (section 5 rules 1-7), cut list.** Its colour tokens are superseded by the Figma direction (section 4 below); everything else stands.
3. `docs/FIGMA_PLAN.md` — frame → route map, states that must stay distinguishable, hard accessibility constraints (section 2.2).
4. `docs/CONTRACT.md` — every endpoint, status code, validation table, and the "How the Stage 3/4/5 endpoints behave" sections. **Read it all; it contains behaviours the frontend must respect.**
5. `shared/types.ts` and `shared/validation.ts` (zod schemas; import and reuse them in forms so front and back validation match).
6. **Every PNG in `Pngs/`** (use the Read tool; it shows images). Study each one before you build its screen. Inventory:
   - Public: `Landing`, `Login`, `Signup`, `Verify`
   - Admin: `Users`, `Create user modal`, `Deactivate user confirm`, `Activate user confirm`
   - Examiner: `Dashboard`, `Exam/Questions`, `Exam/Monitor`, `Exam/Grading`, `Exam/Results`, `Exam/Analytics`
   - Candidate: `Dashboard` (+`Mobile`), `Instructions` (+`Mobile`), `Workspace/Desktop`, `Workspace/Mobile`, `Workspace/Offline`, `Workspace/Reconnecting`, `Submit dialog`, `Submitted`, `Result` (+`Mobile`)
   - System: `Confirm modal`, `Import modal/{Choose CSV,Dry run,Complete}`, `Publish review modal/{Ready,Blocked}`, `Modal/{Empty,Error,Loading}` (empty/error/loading state patterns), `PDF report/{Attempt,Exam}` (reference for the PDFs that already exist in the backend — nothing to build), `Style tile`, `Design Direction`
   - Screens that have NO PNG (derive them in the same visual language, reusing components): question bank page, new-exam page + exam Details tab, exam Candidates tab, candidate-facing announcements banner, sandbox bar, scratchpad drawer, settings popover.
7. Skim existing code: `frontend/components/ui/index.tsx`, `components/shell/AppShell.tsx`, `lib/format.ts`, `lib/mock.ts` (its shapes are typed with `shared/types.ts`; useful for dev only), `pages/AdminUsersPage.tsx` (the best example of the established patterns).

## 4. Design system (already implemented in `app/globals.css` — keep it)

"Serious work. A clearer head." Calm · precise · assured. Palette (Figma "Direction record", handoff **option 2: keep semantic token names, map values**): parchment background `#F0E3C7`, surface `#FFFCF5`, text/ink `#132846`, muted `#596270`, accent cobalt `#0046CF` (accent-soft `#E8EEFF`), border `#CEC7B8`, warning `#805500`, danger `#A12B2B`, success `#21623E`. Fonts: Instrument Serif (display headlines), DM Sans (UI), IBM Plex Mono (timer, scores, codes). 6 px controls, 10 px cards, 1 px borders, flat (no shadows except modals), Lucide icons, subtle motion only, no emoji.

Your design-system tasks:
- **Add the two missing themes.** `Me.preferences.theme` is `"light" | "dark" | "contrast"` and the plan requires all three. Keep the token NAMES; add `[data-theme="dark"]` (deep ink/navy surfaces derived from the palette, cobalt lightened for contrast) and `[data-theme="contrast"]` (black bg, white text, yellow `#FFD400` accent, 2 px borders). Body text must keep ≥ 4.5:1 contrast in every theme. `[data-font="sm|md|lg"]` already exists (14/16/18 px).
- `usePreferences`: apply `data-theme` / `data-font` to `<html>` from the logged-in user's preferences (and persist via `PATCH /api/me/preferences`). Make sure there is no flash of the wrong theme worse than a split second.
- Status badges consistent everywhere (use `StatusBadge`): draft, published, ongoing, completed; in_progress, submitted, auto_submitted, graded. Question states: answered / not answered / flagged / current; timer states: normal / <5 min / <1 min; save pill: all saved / saving / offline (N on device) / reconnecting. **Colour is never the only signal** (icon or text too).
- Accessibility: labels on every input, visible focus ring, `aria-live="polite"` for timer + save status, no hover-only information, works at **375 px** (candidate pages + workspace) and doesn't break at 1280 px (examiner pages).
- Wording: monitoring items are "Indicators", never "Cheating".

## 5. Real backend facts the plan doesn't tell you (IMPORTANT)

**General**
- All responses are `{ data }` on success, `{ error, fields? }` on failure. Same-origin cookie auth (httpOnly), so plain `fetch` sends it. Error handling: 400 → show `fields` under inputs (else toast `error`); 401 → `/login`; 403 → "no access" state; 404 → not-found state; 409 → toast with the message; 410 → in the workspace go to the submitted screen; 500/status 0 → "Something went wrong"/"No connection".
- **`frontend/lib/api-client.ts` is still the 26-line starter**: add `apiPut`, `apiPatch`, `apiDelete`, a typed `ApiClientError { status, fields? }`, `status: 0` for network failure (the workspace uses it to detect offline), and a 401 redirect to `/login` (except for `/api/auth/me` and `/api/auth/login`). Add a way to pass `keepalive`/`signal` if you need it.
- **Rewrite `frontend/lib/auth.tsx`** to use the real endpoints (`GET /api/auth/me` once on load, `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `PATCH /api/me/preferences`). Remove every import of `MOCK_*` / `DEMO_ACCOUNTS` from pages (LoginPage's demo-account helper may stay if it is built from the REAL seeded credentials below, otherwise remove). Delete `lib/mock.ts` at the end if nothing uses it.
- Roles: admin → `/admin`, examiner → `/examiner`, candidate → `/candidate`. Layout guards redirect wrong roles. **Admins can also use `/examiner`** (the route table says "examiner, admin"). The backend enforces real permissions; the UI guard is only for UX.

**Dates:** the API uses ISO strings. `<input type="datetime-local">` → send `new Date(value).toISOString()`; to show, convert with `toLocalInput(iso)` (exists in `format.ts`).

**Exam lifecycle & rules** (also in CONTRACT): states are derived (draft → published → ongoing → completed). Only drafts are editable/deletable. Publish needs the pool + blueprint to be valid (`GET /api/exams/[id]/publish-check` returns `canPublish` + problems; show them in the Publish review modal, Publish button disabled until `canPublish`). **Publishing RESULTS only works after the exam window has ended, with no attempt in progress and nothing ungraded (409 with a reason: show it verbatim in the confirm modal). It then locks grading.** Candidate result endpoint returns 403 until published.

**Blueprint exams:** every candidate gets a different random paper with the same number of easy/medium/hard questions; marks are equal within a difficulty (so every paper has equal total marks). Analytics shows "paper fairness" (deviation % per paper). Questions with < 3 answers show `null` observed difficulty — render "not enough data".

**Attempts / workspace** (the sacred part; follow `FRONTEND_PLAN.md` section 7 exactly, plus):
- `GET /api/attempts/[id]` never contains correctness. Answers saved with `PUT .../answers/[aqId]` carry a `clientSeq`; the server keeps the newest. Resume on another device: set the local counter to max(local, every `clientSeq` the server returned).
- **Server clock only:** compute remaining time from `endsAt` and the server offset (`serverNow` in responses); update `endsAt` from every save/sync/heartbeat response (approved compensation extends it). Saves are accepted until `endsAt + 5 s`. Expired attempts are auto-submitted by the server (lazily, on the next request).
- **Heartbeat gap > 45 s makes the backend raise an `offline` incident and a pending compensation request.** Browsers throttle timers in background tabs (Chrome can fire only once per minute after ~5 min hidden). Send the heartbeat every 15 s from a **Web Worker timer** (or otherwise make it robust to throttling) and also immediately on `visibilitychange`/`online`, so a candidate who simply switches tabs does not look "offline". Demonstrate this in testing (hide the tab for a few minutes if time allows).
- **A candidate can attempt a real exam ONCE** (unique per exam+candidate; resume is allowed while in progress). Sandbox preview (`POST /api/exams/[id]/attempts { sandbox: true }`, examiner/owner only) is unlimited and `DELETE /api/attempts/[id]` resets it. Sandbox attempts never appear in monitor/results.
- Incidents to report (fire-and-forget): `tab_hidden`, `window_blur`, `fullscreen_exit`, `copy_paste`. They are *indicators*; the backend de-duplicates within 5 s.
- Offline outbox key: `outbox:<attemptId>`, counter key `seq:<attemptId>`, as in the plan. Back button must not reopen a submitted exam (`router.replace`).

**Reports / verification**
- PDFs already exist: `<a href="/api/reports/attempts/<attemptId>" target="_blank">` (candidate: own, after results published; examiner/admin any time — before publish it is a PROVISIONAL copy without code) and `/api/reports/exams/<examId>` (owner/admin). Plain links, not `apiGet`. PDF text is Latin-1 only (other characters show as `?`): known limitation, do not try to fix.
- The QR code in the candidate PDF opens `{origin}/verify/{code}`. `GET /api/verify/[code]` is public, always 200, `{valid:false}` for anything unknown; when valid it returns exam title, initials only, score, total, percentage, passed, issuedAt. The Verify page must handle lower-case/spaces in the typed code and works logged out.
- `CandidateResult` (see types) includes per-question breakdown and the `attemptId` for the PDF link.

**CSV import:** always `dryRun: true` first, show totals + error table (row, field, message), then `dryRun: false`. Read the file with `await file.text()`. "Download sample CSV" is built in the browser from the headers in CONTRACT section 5.

## 6. Demo data and test accounts (already in the database)

Password for all: `Demo@1234`. Accounts: `admin@demo.com`, `examiner@demo.com`, candidates `ali@`, `sara@`, `hamza@`, `zainab@`, `bilal@`, `fatima@`, `usman@`, `hira@`, `omar@`, `maryam@demo.com`. Leftover accounts from backend testing: `zz.examiner2@demo.com`, `zz.outsider@demo.com` (also `Demo@1234`) — useful for permission tests.

Seeded exams (owner = examiner@demo.com):
| Exam | State | Use it for |
|---|---|---|
| Database Systems - Midterm | completed, **results published**, 10 graded attempts, blueprint 4/4/2 | results, analytics, fairness chart, candidate result, PDFs, verify. Sample verification code: `C97L57LLPJ` (Ali's attempt) |
| Operating Systems - Final | completed, **not published**, written answers waiting, pending compensation, one auto-submitted attempt | grading tab, publish-results flow (blocked until all graded), monitor on a finished exam |
| Computer Networks - Quiz 2 | **ongoing** for days | live candidate flow: instructions → workspace → submit |
| Software Engineering - Practice Test | upcoming | "Upcoming" section with countdown |
| Web Technologies - Quiz (draft) | draft | build/publish live (pool, blueprint, candidates, publish review) |

**Do NOT burn the demo candidates' single attempt on Quiz 2 / the demo exams** — the user needs them fresh for the live evaluation on 28 Nov. For your own end-to-end tests create fresh data prefixed `ZZ Test` (new exam + a few `ZZ` questions, enroll `zz.*`/new test candidates created through the admin UI or signup, short duration), or use the sandbox. (If a demo attempt is accidentally consumed, tell the user; they can reset with SQL.)

## 7. Work plan — follow the order; commit + push after every numbered step

For each screen: Read its PNG → build it with the existing UI kit → real API → loading / empty / error / data states → check 375 px (candidate side) and 1280 px (examiner side) → `npm run build` + eslint → commit → push.

**Phase 0 — foundations (do first, keep it quick)**
1. `api-client.ts` (section 5), real `auth.tsx` + `usePreferences`, dark + contrast themes in `globals.css`. Wire real login/signup/logout/me, role redirects (landing `/` redirects logged-in users to their home). Re-test LoginPage, SignupPage, VerifyPage, AdminUsersPage against the REAL API (replace mocks; add the real create/activate/deactivate/role-change calls; match `Pngs/Admin/*`). Add the missing connectors for all remaining routes in the plan's table (`app/admin`, `app/examiner/...`, `app/candidate/...`, `app/attempt/[attemptId]`) as 1-line re-exports.

**Phase 1 — examiner basics:** Examiner dashboard (`Pngs/Examiner/Dashboard`), ExamForm + ExamCreatePage, QuestionBankPage with the question editor modal for all 3 types (option rules from CONTRACT's validation table; 409 "used in an exam" toast; "+ New topic"), question import (CSV) reusing the ImportModal.

**Phase 2 — exam setup + candidate entry:** ExamPage with header, `?tab=` tabs and Suspense: Details (edit when draft), Questions (pool + blueprint with live per-difficulty meter + marks check; reorder up/down; `Pngs/Examiner/Exam/Questions`), Candidates (emails textarea / search, `EnrollResult`, table, remove, CSV import with `Pngs/System/Import modal/*`), Publish review modal (`Pngs/System/Publish review modal/*`), Preview (sandbox) button. Candidate dashboard (3 sections, `Pngs/Candidate/Dashboard` + mobile), Instructions page (checkbox gate, Start/Continue, handle 403/409/410 messages).

**Phase 3 — THE WORKSPACE (most important; spend the most care here):** `AttemptPage` per `FRONTEND_PLAN.md` section 7 and `Pngs/Candidate/Workspace/*`, `Submit dialog`, `Submitted`: top bar (title, TimerPill, SaveStatusPill, settings, scratchpad, submit), Navigator with legend + counts (bottom sheet on mobile), QuestionView for single/multi/written, flag, prev/next, keyboard shortcuts (←/→, 1–6, F, S), `useOutbox`, `useHeartbeat` (worker-based, see above), server-offset timer with 5 min/1 min announcements, auto-submit at 0, resume after refresh, offline/reconnecting banners exactly as in the PNGs, submit dialog (answered/unanswered/flagged with clickable question numbers), submitted screen, `SandboxBar` (Reset preview / Exit). **Acceptance test (run it for real, see section 8):** answer → refresh (answers, flags, remaining time kept) → DevTools offline → answer 2 more (pill "2 saved on this device") → online (pill turns green) → submit → Back cannot reopen → a short exam auto-submits at 0:00.

**Phase 4 — examiner evaluation:** Monitor tab (poll every 5 s, pause while the tab is hidden; summary tiles, attempts table with progress bar / time left / online dot / incident count, incident feed "Indicators — review before acting" with mark-reviewed + note, compensation Approve/Reject, announcement box; `Pngs/Examiner/Exam/Monitor`), `AnnouncementBanner` in the workspace from heartbeat; Grading tab (one answer at a time, marks input validated against max, feedback, Save & next, pending count, show-all toggle; a 400 with `fields.marksAwarded` must show under the input; `Pngs/.../Grading`), Results tab (stat tiles, table, Publish results confirm with the 409 reason, "Download exam report" link), Analytics tab (stat tiles, 10-bucket histogram, question table with labelled vs observed difficulty + mismatch badge, paper-fairness horizontal bars around 0%; plain div/SVG, no chart library), Candidate result page (`Pngs/Candidate/Result` + mobile: score, pass/fail, per-question breakdown, feedback, "Download verified report" link).

**Phase 5 — secondary features + polish:** Scratchpad drawer (text + canvas draw: pen/eraser/clear, `toDataURL`, autosave every 5 s via `PUT .../scratchpad`, restored on load, labelled "Not graded"), SettingsPopover (theme, font size, navigator side, one-question vs scroll-all, shortcut list; saved with PATCH preferences and applied instantly), `useIncidents`, Verify page polish. Then a full polish pass: every page has loading/empty/error states (use the `Pngs/System/Modal/*` patterns), consistent badges, focus rings, labels, 375 px checks, no console errors, no layout overflow.

**Phase 6 — freeze (by ~7:00 PM):** full demo run as all 3 roles twice, fix bugs only. Update docs (section 10). Final `npm run build`, eslint, `git status` clean, push. Tell the user to merge into `main` and deploy (do NOT do it yourself).

**Cut list if you fall behind (cut in this order):** scratchpad Draw tab (keep Text) → fairness chart becomes a table column → question reorder (keep add/remove) → scroll-all layout option → keyboard shortcuts. **NEVER cut:** login + role redirects, the workspace (timer, autosave, resume, submit, outbox), the status pill, submit dialog, loading/empty/error states on main pages, candidate result, monitor, grading, publish flow.

You may use subagents for clearly independent screens (e.g. one for Analytics, one for Question Bank) to move faster, but **you own integration**: give each subagent the exact files it may touch (never the shared `ui/index.tsx` or `globals.css` at the same time as another agent), the relevant PNG paths, CONTRACT sections and these rules, and review/build the result yourself.

## 8. How to verify your work (do not just trust the build)

- Type/build: `npm run build`; lint: `npx eslint backend shared app frontend`.
- Run the built app for tests: `node node_modules/next/dist/bin/next start -p 3111` (run in background, remember the PID), or `npm run dev` for iteration. Check `.next`-related errors in the server log.
- Look at what you built: if a browser tool is available in this session (see the `claude-in-chrome` / built-in browser skills), use it to open each page at desktop and 375 px width, compare against the PNG, and exercise the flows (including DevTools "Offline" for the workspace). If no browser tool is available, test every flow through the API with scripts (Node `fetch` with a cookie jar) and tell the user exactly which screens they should eyeball. Say clearly what you could NOT visually verify; never claim visual correctness you did not see.
- Test the permission redirects (candidate opening `/examiner`, logged-out opening `/candidate`), 401 handling, the 400 field errors, and the offline/refresh/auto-submit behaviours.
- Keep a short list of what is verified vs not verified for the final report.

## 9. When to stop and ask the user (only these)

The API genuinely contradicts `shared/types.ts`/CONTRACT; a decision that changes behaviour (not looks); a package must be installed; merge conflicts you can't resolve safely; you would have to touch `backend/` or `main`; you are about to cross 7:45 PM. Otherwise keep going: choose the sensible default, note it in `docs/PROGRESS.md`, and continue.

## 10. Docs to update at the end (the judges read these)

- `docs/PROGRESS.md`: stages done, decisions, known issues, test results, what the user must do next (merge `backend` → `main`, deploy, add the 3 env vars in Vercel, smoke test the live URL).
- `docs/DESIGN.md`: add the **frontend** design→code map (screen → page file → components → API calls), the design-system record (tokens, themes), and frontend ambiguities/assumptions (e.g. heartbeat via worker, dark/contrast themes derived from the parchment palette, results rows list only real attempts).
- `README.md`: replace the "live URL: not deployed yet" line only if the user gives you the URL; add screenshots only if you can actually capture them.

## 11. Final report to the user (plain words)

What works (per role), exact test results, what you could not verify visually, deviations from the PNGs and why, anything the user must do (merge/deploy steps below), and risks for the live demo. Merge + deploy steps for the user: `git switch main && git pull && git merge backend && git push && npx vercel --prod && git switch backend`.

Start now: read the files in section 3, then begin Phase 0.
