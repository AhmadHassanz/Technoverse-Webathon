# Frontend Build Guide — Secure Exam System

> Markdown copy of "Frontend Build Guide — Secure Exam System.pdf" (27 Nov 2026). This is the final frontend plan. If it disagrees with older docs, **this doc wins**. Contract = `docs/CONTRACT.md` + `shared/types.ts`.

## 1. How to use this doc

**Setup (do first):**
1. `git pull` and `npm i` (Zoro installs every package for both of you in Stage 0 — don't run `npm i <package>` yourself; ask him, so `package-lock.json` never conflicts).
2. This plan lives in the repo as `docs/FRONTEND_PLAN.md`.
3. Check you have `docs/CONTRACT.md` and `shared/types.ts`. These two files are the contract: every request and response you use is defined there.

**How to work with Claude (one feature at a time):** start each task with the prompt from section 8 for that stage.
- Build every page against mock data typed with `shared/types.ts` first. When Zoro marks an endpoint ✅ in CONTRACT.md, swap the mock for the real call. Because the types are identical, nothing else changes.
- After each page works: run it, check loading / empty / error states, commit, push.

**Rules from the repo (CLAUDE.md + FRONTEND.md):**
- Deadline 8:00 PM. Aim to finish by 7:30 PM. No commit or push after 7:45 PM.
- Before work and before push: `git pull` (plain merge, never rebase). Never force-push, never amend pushed commits.
- No "Co-Authored-By: Claude" lines in commits.
- You own `frontend/`, `app/layout.tsx`, `app/globals.css`, and the page/layout connector files in `app/` (not `app/api`). Don't edit `backend/`.
- `shared/types.ts`, `shared/validation.ts` and `docs/CONTRACT.md` are read-only for you. Need a field changed? Ask Zoro; he changes both files in one commit.
- `app/` only holds 1-line connector files. All UI lives in `frontend/`.

## 2. Final technical decisions for the frontend

The frontend only ever talks to `/api/...`. No Supabase in the browser, no Realtime, no extra libraries beyond `lucide-react`. Fewer moving parts = fewer things to break at 7 PM.

| Topic | Decision |
|---|---|
| Data fetching | `"use client"` pages that call `apiGet` / `apiPost` / `apiPut` / `apiPatch` / `apiDelete` from `frontend/lib/api-client.ts`, typed with `shared/types.ts` |
| Auth | `POST /api/auth/login` sets a cookie (same-origin fetch sends it automatically). An `AuthProvider` loads `GET /api/auth/me` once; role layouts redirect if not allowed. Real security is on the backend |
| Live updates | Polling: monitor every 5 s; workspace heartbeat every 15 s (also brings announcements) |
| UI components | shadcn (Base UI, Nova preset) in `frontend/components/ui/`. Add with `npx shadcn@latest add <name>`. Keep the `@import "tw-animate-css"` and `@import "shadcn/tailwind.css"` lines in `globals.css`. |
| Icons | `lucide-react` (installed by Zoro in Stage 0) |
| Charts | Plain divs / inline SVG with Tailwind (histogram, bars). No chart library |
| Forms | Controlled inputs + zod schemas from `shared/validation.ts` for the same rules as the backend; also show backend `fields` errors under inputs |
| Themes | CSS variables in `globals.css` switched by `data-theme` and `data-font` attributes on `<html>` (light / dark / contrast, sm / md / lg). Remove the `prefers-color-scheme` block so the user's choice wins |
| Offline outbox | localStorage key `outbox:<attemptId>` |
| PDF | Plain links: `<a href="/api/reports/attempts/<id>" target="_blank">` |

**`api-client.ts` changes (Stage 0, yours):** add `apiPut`, `apiPatch`, `apiDelete` next to `apiGet` / `apiPost`. Throw a typed error: `class ApiClientError extends Error { status: number; fields?: Record<string, string> }` built from `{ error, fields }`. On 401 from any call except `/api/auth/me` and `/api/auth/login`, redirect to `/login`. If `fetch` itself fails (no network), throw `ApiClientError` with `status: 0` and message "No connection". The workspace uses `status === 0` to know it is offline.

**Next.js 16 gotchas:**
- Components using `useState`, `useEffect`, `onClick` need `"use client";` on line 1.
- Pages that read the URL with `useParams()` or `useSearchParams()` must render that part inside `<Suspense>` (Cache Components is on): `export default function ExamPage() { return <Suspense fallback={<PageSkeleton />}><ExamPageInner /></Suspense>; }`.
- After adding any page with `[param]` in its URL, run `npm run build` once to catch errors early.
- Navigation: `useRouter` from `next/navigation`, links with `next/link`.
- Dates: `<input type="datetime-local">` gives local time without timezone. Send `new Date(value).toISOString()`. To show an ISO date in that input, convert it back to local `YYYY-MM-DDTHH:mm` with a helper `toLocalInput(iso)` in `frontend/lib/format.ts`. Display dates with `toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })`.

## 3. Folder structure, routes and connector files

Every URL is a 1-line connector in `app/` pointing at a component in `frontend/`. Layouts use the same trick, which is how role protection works without logic in `app/`.

```
frontend/
  lib/
    api-client.ts       # extend (section 2)
    auth.tsx            # AuthProvider + useAuth() { me, loading, refresh, logout }
    format.ts           # dates, percentages, toLocalInput, durations (mm:ss)
    mock.ts             # mock data typed with shared/types.ts, used until endpoints are live
    useOutbox.ts        # offline answer queue (workspace)
    useHeartbeat.ts     # 15 s heartbeat + announcements
    useIncidents.ts     # tab/blur/fullscreen/paste detection
    usePreferences.ts   # apply data-theme / data-font to <html>
  components/
    ui/       # Button Input Textarea Select Checkbox Card Badge Modal Drawer Tabs Table
              # Toast Spinner Skeleton EmptyState ErrorState StatTile ProgressBar
    shell/    # AppShell Sidebar Topbar UserMenu
    exam/     # Navigator QuestionView TimerPill SaveStatusPill SubmitDialog
              # Scratchpad SettingsPopover AnnouncementBanner SandboxBar
    charts/   # Histogram HBar
  layouts/
    AdminLayout.tsx ExaminerLayout.tsx CandidateLayout.tsx   # guard + shell
  pages/      # one file per screen (table below)
```

**Routes** (create the connector at the path, export default from the frontend file):

| URL | Connector file | Frontend file | Who |
|---|---|---|---|
| `/` | `app/page.tsx` (exists) | `pages/HomePage.tsx` — landing; if logged in, redirect to role home | public |
| `/login` | `app/login/page.tsx` | `pages/LoginPage.tsx` | public |
| `/signup` | `app/signup/page.tsx` | `pages/SignupPage.tsx` | public |
| `/verify/[code]` | `app/verify/[code]/page.tsx` | `pages/VerifyPage.tsx` | public |
| `/admin` | `app/admin/page.tsx` + `app/admin/layout.tsx` | `pages/AdminUsersPage.tsx` + `layouts/AdminLayout.tsx` | admin |
| `/examiner` | `app/examiner/page.tsx` + `app/examiner/layout.tsx` | `pages/ExaminerDashboardPage.tsx` + `layouts/ExaminerLayout.tsx` | examiner, admin |
| `/examiner/questions` | `app/examiner/questions/page.tsx` | `pages/QuestionBankPage.tsx` | examiner, admin |
| `/examiner/exams/new` | `app/examiner/exams/new/page.tsx` | `pages/ExamCreatePage.tsx` | examiner, admin |
| `/examiner/exams/[examId]?tab=…` | `app/examiner/exams/[examId]/page.tsx` | `pages/ExamPage.tsx` (tabs: details, questions, candidates, monitor, grading, results, analytics) | examiner, admin |
| `/candidate` | `app/candidate/page.tsx` + `app/candidate/layout.tsx` | `pages/CandidateDashboardPage.tsx` + `layouts/CandidateLayout.tsx` | candidate |
| `/candidate/exams/[examId]` | `app/candidate/exams/[examId]/page.tsx` | `pages/ExamInstructionsPage.tsx` | candidate |
| `/candidate/results/[examId]` | `app/candidate/results/[examId]/page.tsx` | `pages/CandidateResultPage.tsx` | candidate |
| `/attempt/[attemptId]` | `app/attempt/[attemptId]/page.tsx` | `pages/AttemptPage.tsx` (full-screen workspace, own guard; also used for sandbox) | candidate, examiner (sandbox) |

Connector examples:
```tsx
// app/examiner/layout.tsx
export { default } from "@/frontend/layouts/ExaminerLayout";
// app/examiner/exams/[examId]/page.tsx
export { default } from "@/frontend/pages/ExamPage";
```

- Role homes after login: admin → `/admin`, examiner → `/examiner`, candidate → `/candidate`. A layout that gets the wrong role redirects to that user's home; no user → `/login`.
- `app/layout.tsx` (yours): set `metadata.title` to the product name, keep the font setup, wrap children in `<AuthProvider>` and a `<ToastProvider>`. Change `<html>` to include `data-theme="light" data-font="md"` as defaults.

## 4. API contract summary — full version in `docs/CONTRACT.md`

| # | Group | Endpoints | Live by end of stage |
|---|---|---|---|
| 1 | Auth & profile | POST `/api/auth/signup` · POST `/api/auth/login` · POST `/api/auth/logout` · GET `/api/auth/me` · PATCH `/api/me/preferences` | 1 (preferences: 3) |
| 2 | Admin | GET, POST `/api/admin/users` · PATCH `/api/admin/users/[id]` | 1 |
| 3 | Question bank | GET, POST `/api/topics` · GET, POST `/api/questions` · GET, PATCH, DELETE `/api/questions/[id]` | 1 |
| 4 | Exams | GET, POST `/api/exams` · GET, PATCH, DELETE `/api/exams/[id]` | 1 |
| 4 | Exams (assembly) | PUT `/api/exams/[id]/questions` · GET `.../publish-check` · POST `.../publish` · POST `.../unpublish` | 2 |
| 5 | Enrollment & import | GET `/api/candidates` · GET, POST `/api/exams/[id]/enrollments` · DELETE `.../enrollments/[candidateId]` · POST `/api/import/candidates` · POST `/api/import/questions` | 2 |
| 6 | Candidate | GET `/api/me/exams` (stage 2) · GET `/api/me/results/[examId]` (stage 4) | 2, 4 |
| 7 | Attempts | POST `/api/exams/[id]/attempts` · GET, DELETE `/api/attempts/[id]` · PUT `.../answers/[aqId]` · POST `.../sync` · POST `.../heartbeat` · POST `.../incidents` · PUT `.../scratchpad` · POST `.../submit` | 3 |
| 8 | Monitoring | GET `/api/exams/[id]/monitor` · GET, POST `.../announcements` · PATCH `/api/incidents/[id]` · PATCH `/api/compensations/[id]` | 4 |
| 9 | Grading & results | GET `/api/exams/[id]/grading` · PATCH `/api/attempt-questions/[aqId]/grade` · GET `.../results` · POST `.../results/publish` · GET `.../analytics` | 4 |
| 10 | Reports | GET `/api/reports/attempts/[attemptId]` (PDF link) · GET `/api/reports/exams/[examId]` (PDF link) · GET `/api/verify/[code]` | 5 |
| 11 | Health | GET `/api/health` (exists) | done |

Zoro ships mock (stub) versions of each stage's endpoints one stage early, so when you start a stage, the real URL already returns realistic fake data. If a stub is missing, use `frontend/lib/mock.ts` with the same type and keep going.

**How to react to errors (from CONTRACT.md):** 400 → show `fields` under inputs (and `error` as a toast if no fields) · 401 → `/login` · 403 → "You don't have access" state · 404 → not-found state · 409 → toast with error · 410 → in workspace go to the submitted screen; elsewhere toast · 500 / status 0 → toast "Something went wrong" / "No connection".

## 5. Design system and UX rules

UI/UX is 20 of 100 marks, and the brief punishes generic AI-template looks. Lock these choices in Stage 0 and never improvise a new colour later. Look: calm, exam-hall serious, one accent.

| Token (CSS variable) | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F7F7F5` | `#0F1115` | page background |
| `--surface` | `#FFFFFF` | `#171A21` | cards, panels |
| `--border` | `#E4E4E0` | `#2A2F3A` | dividers, inputs |
| `--text` | `#1B1D22` | `#E8E9ED` | main text |
| `--muted` | `#6B6F78` | `#9AA0AB` | secondary text |
| `--accent` | `#0F766E` (teal) | `#2DD4BF` | primary buttons, answered questions, links |
| `--warning` | `#B45309` | `#F59E0B` | flagged for review, timer < 5 min |
| `--danger` | `#B91C1C` | `#F87171` | offline, timer < 1 min, errors |
| `--success` | `#15803D` | `#4ADE80` | saved, passed, published |

- **contrast** theme: black background, white text, yellow (`#FFD400`) accent, 2 px borders. Map all tokens in `@theme inline` so Tailwind classes like `bg-surface text-muted border-border` work.
- **Type:** keep Geist Sans for UI; Geist Mono for the timer, scores and codes. Sizes: 14 body, 16 question text, 20 page titles, 28 stat numbers. `data-font="sm|md|lg"` sets `html { font-size: 14px | 16px | 18px }`.
- **Shape:** radius 8 px, 1 px borders, no gradients, no big shadows (one soft shadow on modals only), no emoji.
- **Spacing:** multiples of 4; page padding 24 px desktop, 16 px mobile.
- **Status badges (same everywhere):** draft = grey, published = blue-grey, ongoing = teal, completed = dark grey; in_progress = teal outline, submitted = grey, auto_submitted = amber, graded = green.
- **Question states (workspace + legend):** answered = filled accent, not answered = outline, flagged = amber with a small flag icon, current = thick ring.

**UX rules every page follows:**
1. Four states: loading (skeleton, not a spinner on a blank page), empty (icon + one sentence + primary action, e.g. "No exams yet — Create exam"), error (message + Retry), and data.
2. Forms: labels above inputs, inline errors under the input in `--danger`, disabled submit while sending, toast on success.
3. Destructive actions (delete, publish, submit, publish results) use a confirm modal that says exactly what happens.
4. Accessibility: every input has a `<label>`, buttons have text or `aria-label`, visible focus ring (`outline: 2px solid var(--accent)`), colour is never the only signal (icons/text too), timer and save status in `aria-live="polite"` regions.
5. Responsive: candidate pages and the workspace must work at 375 px wide (navigator becomes a bottom sheet). Examiner pages are desktop-first but must not break on a laptop at 1280 px.
6. Keyboard in workspace: ← / → previous / next question, 1–6 select option, F flag, S open scratchpad. Show these in the settings popover.
7. Wording: monitoring items say "Indicator", never "Cheating".

## 6. Stages with clock times

Seven stages, matched minute-for-minute with Zoro's backend doc. At every checkpoint: commit, push, tell Zoro, he deploys, you both test on the live URL. If a stage runs 20+ minutes late, use the cut list at the end of this section.

| Stage | Time | Your focus | Checkpoint (both of you, live URL) |
|---|---|---|---|
| 0 | 10:50 – 11:30 | Design tokens, UI kit, api-client, app shell | Styled shell deployed |
| 1 | 11:30 – 13:00 | Auth pages, role layouts, admin users, examiner dashboard, exam form, question bank | Examiner logs in, creates questions + draft exam |
| 2 | 13:00 – 14:15 | Exam page tabs, question picker + blueprint, candidates + import, publish review, candidate dashboard + instructions | Exam published; candidate sees it |
| 3 | 14:15 – 16:00 | Exam workspace (the hero screen) + sandbox preview | **Sacred:** candidate takes + submits; refresh keeps everything |
| 4 | 16:00 – 17:30 | Monitor, grading, results, analytics, candidate result | Grade → publish → candidate sees result; monitor is live |
| 5 | 17:30 – 18:45 | Scratchpad, settings, incident detection, verify page, PDF buttons, polish | All features clickable with realistic data |
| 6 | 18:45 – 19:45 | Freeze, bug bash, final check | Submitted. Nothing after 19:45 |

### Stage 0 — Foundations (10:50 – 11:30)
- `git pull`, `npm i` after Zoro's package commit.
- `app/globals.css`: tokens from section 5 for light / dark / contrast via `[data-theme=…]`, font sizes via `[data-font=…]`, `@theme inline` mapping, focus ring. Remove the `prefers-color-scheme` block.
- `app/layout.tsx`: title "ExamCore — Secure Examinations" (or your name), `data-theme` / `data-font` defaults.
- UI kit: shadcn is already initialized. Add the pieces in section 3 with `npx shadcn@latest add button input textarea select checkbox card badge tabs table` (and the rest by hand only if shadcn has no match: Modal, Drawer, Toast, Spinner, Skeleton, EmptyState, ErrorState, StatTile, ProgressBar). Files go to `frontend/components/ui/`.
- `frontend/lib/api-client.ts` changes (section 2) + `format.ts`.
- `components/shell/`: AppShell with sidebar (logo, nav links per role, user menu with logout) and topbar; collapses to a top bar on mobile.
- Replace `HomePage.tsx` with a simple landing: product name, one line, "Log in" button.

**Done when:** `npm run build` passes, landing page + a test page showing all UI kit components look consistent in all 3 themes.

### Stage 1 — Auth, admin, examiner basics (11:30 – 13:00)
- `lib/auth.tsx` (`AuthProvider`, `useAuth`) and the 3 role layouts with guards; wire `AuthProvider` + `ToastProvider` into `app/layout.tsx`.
- Login + Signup pages (zod from `shared/validation.ts` when available; show backend `fields`). After login redirect to role home.
- Admin users page: table (name, email, role, status, created), search, role filter, role dropdown per row, activate/deactivate toggle with confirm, "Create user" modal.
- Examiner dashboard: stat row (exams, ongoing, candidates enrolled), exam cards with state badge, dates, counts, "New exam".
- Exam create page + reusable `ExamForm` (title, instructions, start, end, duration, total marks, pass marks, shuffle toggles) with validation (end after start, duration fits the window).
- Question bank: filters (topic, difficulty, type, search), table, "New question" modal with type switcher: single (radio for correct), multi (checkboxes + scheme select), written (no options); add/remove options (2–6), marks, negative marks, difficulty, topic (with "+ New topic"). Edit + delete (409 → toast "Used in an exam").

**Done when:** on live URL: examiner logs in, creates a topic + 1 question of each type + a draft exam; candidate visiting `/examiner` is redirected to `/candidate`.

### Stage 2 — Exam setup + candidate entry (13:00 – 14:15)
- `ExamPage` with header (title, state badge, dates, buttons: Preview (Stage 3), Publish) and tabs via `?tab=`. Wrap in `<Suspense>`.
- Details tab: `ExamForm` in edit mode (read-only when not draft).
- Questions tab: left = bank with filters + "Add"; right = selected pool (reorder up/down, remove). Blueprint panel: toggle + 3 number inputs; live meter per difficulty ("Easy 4 needed / 6 in pool ✓"), paper marks vs total marks. Save with PUT.
- Candidates tab: add by emails (textarea, comma or new line) or search; show `EnrollResult` (enrolled / already / not found); table with attempt status + score; remove button.
- Import modal (reused in question bank + candidates tab): choose CSV → `file.text()` → dry run → show totals + error table (row, field, message) → "Import N rows". Include "Download sample CSV" (build it in the browser from the header in CONTRACT.md).
- Publish review modal: calls publish-check, shows summary + problem checklist; Publish button only enabled when `canPublish`.
- Candidate dashboard: 3 sections (Available now, Upcoming with countdown, Completed with "View result" if published), each with empty state.
- Instructions page: exam info, rules list, "I have read the instructions" checkbox, Start/Continue → `POST /api/exams/[id]/attempts` → go to `/attempt/[attemptId]`. Handle 403 / 409 / 410 messages.

**Done when:** examiner builds an exam with a 4/4/2 blueprint, enrolls candidates (one via CSV), publish review blocks until fixed, publishes; candidate sees it on their dashboard.

### Stage 3 — Exam workspace (14:15 – 16:00) — the most important stage
- Everything in section 7 (layout, timer, autosave, outbox, status pill, navigator, question types, flag, submit dialog, auto-submit, resume, submitted screen).
- Sandbox: "Preview" button on ExamPage → `POST .../attempts { sandbox: true }` → workspace shows yellow `SandboxBar` ("Preview mode — not counted") with "Reset preview" (DELETE attempt) and "Exit"; after submit, return to the exam page.

**Done when (test on live URL):** answer questions → refresh (all answers, flags and remaining time kept) → DevTools offline → answer 2 more (pill shows "2 saved on this device") → online (pill turns green) → submit → back button can't reopen the exam → short exam auto-submits at 0:00.

### Stage 4 — Examiner evaluation + results (16:00 – 17:30)
- Monitor tab (poll 5 s, pause when tab hidden): summary tiles, attempts table (name, progress bar answered/total, time left, online dot, incidents count, status), incident feed ("Indicators — review before acting", mark reviewed + note), compensation requests (gap, Approve / Reject), announcement box.
- Workspace: `AnnouncementBanner` shows new announcements from heartbeat (dismissible, keeps a list).
- Grading tab: pending count, one answer at a time (question, marks, candidate answer), marks input with max, feedback, Save & next; toggle to show all.
- Results tab: stat tiles, results table, "Publish results" (confirm; 409 → show reason), "Download exam report" link.
- Analytics tab: stat tiles, 10-bucket histogram, question table (correct %, skipped %, most chosen wrong answer, labelled vs observed difficulty with mismatch badge), paper fairness chart (horizontal bars around 0 % deviation).
- Candidate result page: score ring/number, pass/fail, per-question breakdown (your answer, correct answer, marks, feedback), "Download verified report" link.

**Done when:** grade a written answer (11/10 shows error), publish results, candidate sees own result; monitor updates within 5 s when a candidate answers.

### Stage 5 — Secondary features + polish (17:30 – 18:45)
- Scratchpad drawer: Text tab (textarea) + Draw tab (canvas: pen, eraser, clear; export `toDataURL("image/png")`); autosave every 5 s when changed; restored on load. Label "Not graded".
- Settings popover in workspace: theme, font size, navigator left/right, one-question vs scroll-all, keyboard shortcuts list. Save via PATCH preferences; apply instantly.
- `useIncidents`: report `tab_hidden` (visibilitychange), `window_blur`, `fullscreen_exit` (if they entered fullscreen via an optional button), `copy_paste` (paste event). Fire-and-forget, never block the candidate.
- Verify page `/verify/[code]`: big valid/invalid badge, exam, initials, score, date. Works logged out.
- Polish pass: every page has loading / empty / error states; check 375 px width for candidate pages; check focus rings + labels; consistent badges.

### Stage 6 — Freeze and ship (18:45 – 19:45)
- 18:45 feature freeze. Run the demo script with Zoro on the live URL, all 3 roles, twice. Fix bugs only.
- Take 4–5 screenshots for the README (dashboard, workspace, monitor, analytics, result PDF).
- Last push before 19:30 so Zoro can do the final deploy. Nothing after 19:45.

### If you fall behind (cut in this order)
1. Scratchpad Draw tab (keep Text)
2. Fairness chart → a simple table column
3. Question reorder in the pool (keep add/remove)
4. Scroll-all layout option (keep the other 3 settings)
5. Keyboard shortcuts

**Never cut:** login + role redirects, the workspace (timer, autosave, resume, submit), status pill, submit dialog, empty/loading/error states on main pages.

## 7. Exam workspace spec (the hero screen)

Judges will refresh it, unplug the Wi-Fi and spam the submit button. It must stay calm and always tell the truth about what is saved.

**Layout (desktop):**
- Top bar: exam title · `TimerPill` (Geist Mono, large) · `SaveStatusPill` · settings gear · scratchpad button · Submit.
- Navigator (left or right by preference): grid of numbered squares in the 4 states + legend + counts ("12 answered · 3 flagged · 5 left").
- Centre: "Question 4 of 20 · 2 marks", stem, then: single = radio list; multi = checkboxes + "Select all that apply"; written = textarea with character count (max 10000). Under it: Flag for review toggle, Previous, Next.
- Mobile (< 768 px): navigator becomes a bottom sheet opened from a "Questions" button; top bar keeps timer + save pill + Submit.

**Loading the attempt:**
1. `GET /api/attempts/[attemptId]` → `AttemptView`.
2. If status is not `in_progress` → show the submitted screen ("Your answers were submitted at …", button back to dashboard; sandbox → back to exam page).
3. Merge server answers with anything in the local outbox for this attempt (outbox wins if its `clientSeq` is higher), then flush the outbox.

**Timer (never trust the device clock alone):**
- On every response that has `serverNow`: `offset = Date.parse(serverNow) − Date.now()`. Remaining = `Date.parse(endsAt) − (Date.now() + offset)`; tick every 1 s.
- Update `endsAt` from every save, sync and heartbeat response (compensation can extend it).
- Amber under 5 min, red under 1 min; announce "5 minutes left" and "1 minute left" once via `aria-live`.
- At 0: flush outbox (best effort), call submit, show submitted screen. If submit fails (offline), show "Time is up — your saved answers will be submitted automatically" (the server auto-submits).

**Autosave + outbox (`useOutbox`):**
- `clientSeq`: a counter stored in localStorage key `seq:<attemptId>`, +1 on every change. On load, set it to the highest of the stored value and every `clientSeq` in the server's answers, otherwise a candidate who resumes on a new device starts at 0 and every save is rejected as stale.
- On change: update local state immediately, write `{ aqId, selectedOptionIds, textAnswer, flagged, clientSeq }` into `outbox:<attemptId>` (one entry per `aqId`, newest wins).
- Send: radio/checkbox/flag → immediately; textarea → debounce 800 ms. `PUT /api/attempts/[id]/answers/[aqId]`.
- On success (`accepted` true or false) → remove that entry from the outbox if its `clientSeq` ≤ the sent one. On status 0 (offline) → keep it, mark offline. On 410 → submitted screen.
- On `online` event, every heartbeat, and on page load: if the outbox has entries, send them all with `POST /api/attempts/[id]/sync`, then remove the accepted / stale ones. `reason: "late"` → drop them and show a toast "Some answers arrived after time ended".

**SaveStatusPill (always visible, `aria-live`):**

| State | Text | Colour |
|---|---|---|
| All synced | "All answers saved" + tick | success |
| Request in flight | "Saving…" | muted |
| Offline or failed, outbox not empty | "Offline — N answers saved on this device" | danger + red bar across the top |
| Back online, syncing | "Reconnected — syncing N answers…" | warning |

Detect offline from `navigator.onLine`, `online` / `offline` events, and any `ApiClientError` with status 0.

**Heartbeat (`useHeartbeat`):** `POST /api/attempts/[id]/heartbeat` every 15 s while the workspace is open (even when the tab is hidden). Use the response to update timer, status (if `auto_submitted` → submitted screen) and announcements (show new ones in the banner).

**Submit dialog:** counts of answered / not answered / flagged with clickable question numbers, warning if anything is not answered, "Submit exam" (disabled while sending). Flush outbox first; then `POST /submit`. The endpoint is safe to call twice, but still disable the button. After success use `router.replace` (not push) to the submitted screen so Back can't reopen the exam.

**Demo moment to rehearse:** answer 2 → DevTools → Network → Offline → answer 2 more (red bar, "2 answers saved on this device") → refresh (still there) → Online ("Reconnected — syncing" → "All answers saved").

## 8. Prompts to give Claude, per stage

Paste one prompt, let Claude finish, check it in the browser (all states), commit, then the next.

**Stage 0**
> Read docs/FRONTEND_PLAN.md sections 2, 3 and 5, docs/CONTRACT.md and shared/types.ts. Rewrite app/globals.css with the design tokens for light, dark and contrast themes using [data-theme] and font sizes using [data-font], mapped in @theme inline for Tailwind v4; remove the prefers-color-scheme block. Update app/layout.tsx metadata and add data-theme="light" data-font="md" to <html>.

> Extend frontend/lib/api-client.ts as described in FRONTEND_PLAN section 2 (apiPut, apiPatch, apiDelete, ApiClientError with status and fields, 401 redirect, status 0 for network failure). Create frontend/lib/format.ts with date, percent, duration and toLocalInput helpers.

> shadcn is already set up. Add the UI kit pieces from FRONTEND_PLAN section 3 with `npx shadcn@latest add …` into frontend/components/ui (hand-build only the ones shadcn does not have). Keep the shadcn imports at the top of app/globals.css. Then build components/shell (AppShell, Sidebar, Topbar, UserMenu), responsive. Replace HomePage with a simple landing page. Run npm run build.

**Stage 1**
> Create frontend/lib/auth.tsx (AuthProvider + useAuth using GET /api/auth/me, logout via POST /api/auth/logout) and AdminLayout, ExaminerLayout, CandidateLayout in frontend/layouts with role guards and AppShell, plus their 1-line connectors in app/. Wire AuthProvider and ToastProvider into app/layout.tsx. Follow the route table in FRONTEND_PLAN section 3.

> Build LoginPage and SignupPage with validation from shared/validation.ts (or the CONTRACT validation table if it's not there yet), showing backend fields errors, redirecting to the role home.

> Build AdminUsersPage per FRONTEND_PLAN Stage 1 using the admin endpoints in CONTRACT section 2. Include loading, empty and error states.

> Build ExaminerDashboardPage, ExamCreatePage and a reusable ExamForm per FRONTEND_PLAN Stage 1. Convert datetime-local values with toISOString.

> Build QuestionBankPage with filters, table and the question editor modal for all 3 types, following the option rules in CONTRACT's validation table.

**Stage 2**
> Build ExamPage with header and ?tab= tabs (wrap the useSearchParams/useParams part in Suspense). Implement the Details and Questions tabs, including the blueprint panel with live meter, per FRONTEND_PLAN Stage 2.

> Implement the Candidates tab, the reusable ImportModal (dry run, error table, sample CSV download from the CONTRACT CSV headers) and the publish review modal using publish-check.

> Build CandidateDashboardPage (3 sections) and ExamInstructionsPage with Start/Continue calling POST /api/exams/[id]/attempts and handling 403/409/410.

**Stage 3**
> Build AttemptPage, the exam workspace, exactly as FRONTEND_PLAN section 7 describes: layout, Navigator, QuestionView for 3 types, TimerPill using server offset, SaveStatusPill, flag, prev/next, keyboard shortcuts, submit dialog, submitted screen. Use mock AttemptView data if the endpoint isn't live yet.

> Implement frontend/lib/useOutbox.ts and useHeartbeat.ts per FRONTEND_PLAN section 7 (clientSeq rules including the max-on-load rule, localStorage outbox, immediate vs debounced saves, sync on reconnect, 410 handling) and wire them into AttemptPage. Test offline mode in DevTools.

> Add sandbox preview: Preview button on ExamPage, SandboxBar in the workspace with Reset preview and Exit, per FRONTEND_PLAN Stage 3.

**Stage 4**
> Build the Monitor tab with 5-second polling (paused when the tab is hidden), incidents review, compensation approve/reject and announcement box; add AnnouncementBanner to the workspace using heartbeat announcements.

> Build the Grading and Results tabs per FRONTEND_PLAN Stage 4, including mark validation against the question's marks and the publish results confirm.

> Build the Analytics tab with plain div/SVG charts (histogram, fairness bars) and the question stats table, and CandidateResultPage with the PDF link.

**Stage 5**
> Build the Scratchpad drawer (text + canvas draw, autosave every 5 s via PUT scratchpad) and the SettingsPopover (PATCH /api/me/preferences, apply data-theme and data-font instantly, navigator side, layout). Add usePreferences to apply saved preferences on load.

> Implement useIncidents (tab_hidden, window_blur, fullscreen_exit, copy_paste, fire-and-forget) in the workspace, and VerifyPage at /verify/[code] that works logged out.

> Do a polish pass across all pages: loading/empty/error states, 375 px layout for candidate pages and workspace, labels and focus rings, consistent badges and colours from FRONTEND_PLAN section 5. Don't change any API calls.

**When something breaks:** paste the exact error + the file name and say "fix only this, don't change shared/types.ts or the API calls". If the backend returns something different from `shared/types.ts`, don't patch around it — tell Zoro.
