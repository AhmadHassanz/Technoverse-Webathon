# Figma Plan — Secure Exam System

> Screens to design **before** implementing the frontend. Screen structure, content and states are derived from `docs/FRONTEND_PLAN.md` (section 3 route table, section 7 workspace) and `docs/PROBLEM_STATEMENT.md`.
>
> **Design direction is NOT fixed here.** Visual language (palette, type, shape, density) comes from the inspiration references supplied by the team. This doc covers *what goes on each screen* and *which screens exist* — the part that doesn't change when the look changes.
>
> If this doc disagrees with `FRONTEND_PLAN.md` on a **route, field or behaviour**, the plan wins.

## 1. How to use this doc

1. Give the inspiration references **directly to the Figma agent**, together with the paste-ready brief in **section 12**. The agent owns the visual language; this doc owns the product content it cannot infer from pictures.
2. Build **Page 1 (Style tile)** from the direction the agent derives. Every screen after that reuses those styles.
3. Work top-down through the tiers. Tier 1 is the cut line — if time runs out, Tier 1 alone is a complete demo.
4. For each frame: build the default/data state first, then the empty / loading / error variants (section 6).
5. Name frames exactly as in the tables so implementation tasks map 1:1 (section 7).
6. **Content specs in this doc are not negotiable** — a screen is only "done" when every element listed for it exists, regardless of visual style.

**Priority logic:** UI/UX is 20 of 100 marks and the brief explicitly punishes "generic AI-template" looks — which is exactly why inspiration-led design is a good call. The workspace is the hero screen; the examiner dashboard, monitor and analytics are the second-most visible.

## 2. Design direction (owned by the Figma agent)

Visual language is decided **inside Figma**, from the inspiration references passed straight to the Figma agent. Nothing in this doc prescribes colours, type or shape.

The only requirement: the agent records what it derived, so implementation can copy the same values into `app/globals.css`. If the direction never gets written down, the coded app will drift from the design.

### 2.1 Direction record (agent fills this after reviewing the inspiration)

| Slot | Recorded value |
|---|---|
| Inspiration references | (agent lists what it was given) |
| What we're taking from each | e.g. "density from A, type from B, table style from C" |
| Overall feel (3 adjectives) | e.g. calm · precise · institutional |
| Typeface pairing | Display / UI / mono (timer, scores, codes) |
| Palette | background, surface, border, text, muted, accent, warning, danger, success |
| Shape language | radius, border weight, corner treatment |
| Elevation | flat / one soft shadow / borders only |
| Density | compact / comfortable |
| Icon set | must be `lucide-react` (already installed) |
| Motion | none / subtle only |

### 2.2 Hard constraints regardless of inspiration

These come from the problem statement, not from taste. Inspiration can change the look but not these:

| Constraint | Why |
|---|---|
| **Accessible contrast** — body text ≥ 4.5:1, large text ≥ 3:1 | Brief scores accessibility (section 08, UI/UX) |
| **Colour is never the only signal** | Status must also carry an icon or text |
| **Visible focus ring** on every interactive element | Keyboard users; workspace has keyboard shortcuts |
| **Works at 375 px** | Candidate pages + workspace must be usable on a phone |
| **Readable timer** — large, high contrast, monospace-ish | Candidates read it under stress |
| **No information only on hover** | Touch devices |
| **Table density must survive a 1280 px laptop** | Examiner pages are desktop-first |

### 2.3 Semantic states that must stay distinguishable

Whatever palette you choose, these must be visually distinct from each other **and** labelled:

| Status | Meaning |
|---|---|
| draft | not published yet |
| published | live but not started |
| ongoing | attempts in progress |
| completed | finished |
| in_progress | candidate currently taking |
| submitted | handed in |
| auto_submitted | submitted at time expiry |
| graded | marks finalised |

Workspace question states: **answered · not answered · flagged · current**. Design all four plus a legend.

Timer states: **normal · under 5 min · under 1 min**. Save pill states: **all saved · saving · offline (N on device) · reconnecting**.

## 3. Frame sizes and naming

| Surface | Frame | Notes |
|---|---|---|
| Desktop | 1440 × 900 | primary target for examiner + admin |
| Laptop | 1280 × 800 | must not break; check one frame per layout |
| Mobile | 375 × 812 | candidate pages + workspace must work here |
| Modal | ~560 wide, auto height | centered |
| Drawer | ~420 wide | side panel |

Naming: `Role / Screen / State` → e.g. `Examiner / Monitor / Data`, `Candidate / Workspace / Offline`.

## 4. Tier 1 — must design (the cut line)

| # | Frame name | Role | Must contain |
|---|---|---|---|
| 1 | `System / Style tile` | — | Section 2 applied: palette swatches, type scale, radii, buttons, inputs, badges (2.3), question states, table row |
| 2 | `Candidate / Workspace / Desktop` | candidate | Top bar (exam title, timer, save pill, settings, scratchpad, Submit) · navigator grid with legend + counts ("12 answered · 3 flagged · 5 left") · centre: "Question 4 of 20 · 2 marks", stem, MCQ radio list, flag toggle, Previous / Next |
| 3 | `Candidate / Workspace / Mobile` | candidate | Navigator as a bottom sheet opened from a "Questions" button; top bar keeps timer + save pill + Submit |
| 4 | `Candidate / Submit dialog` | candidate | Answered / not answered / flagged counts with clickable question numbers, warning when unanswered, "Submit exam" disabled-while-sending state |
| 5 | `Candidate / Submitted` | candidate | "Your answers were submitted at …", back to dashboard, sandbox variant |
| 6 | `Examiner / Dashboard` | examiner | Stat row (exams, ongoing, candidates enrolled), exam cards with state badge + dates + counts, "New exam" |
| 7 | `Examiner / Exam / Questions` | examiner | Left: question bank with filters + Add. Right: selected pool with reorder/remove. **Blueprint panel**: toggle + 3 number inputs + live meter per difficulty ("Easy 4 needed / 6 in pool ✓") + paper marks vs total marks |
| 8 | `Examiner / Exam / Monitor` | examiner | Summary tiles · attempts table (name, progress bar answered/total, time left, online dot, incidents count, status) · incident feed headed "Indicators — review before acting" with mark-reviewed + note · compensation requests (gap, Approve / Reject) · announcement box |
| 9 | `Examiner / Exam / Grading` | examiner | Pending count · one answer at a time (question, marks, candidate answer) · marks input with max · feedback · Save & next · toggle "show all" |
| 10 | `Examiner / Exam / Results` | examiner | Stat tiles · results table · "Publish results" (confirm) · "Download exam report" |
| 11 | `Examiner / Exam / Analytics` | examiner | Stat tiles · 10-bucket histogram · question table (correct %, skipped %, most chosen wrong answer, labelled vs observed difficulty + mismatch badge) · fairness horizontal bars around 0 % deviation |
| 12 | `Candidate / Dashboard` | candidate | 3 sections: Available now · Upcoming with countdown · Completed with "View result" when published. Each has an empty state |
| 13 | `Candidate / Instructions` | candidate | Exam info, rules list, "I have read the instructions" checkbox, Start/Continue button |
| 14 | `Candidate / Result` | candidate | Score number/ring, pass/fail, per-question breakdown (your answer, correct answer, marks, feedback), "Download verified report" |
| 15 | `Public / Login` (+ `Signup` variant) | public | Email + password, inline error under field, submit disabled while sending, link to signup |

**Done when:** Tier 1 frames exist at 1440 (and 375 for candidate/workspace), all repeated elements are components/instances, and every element listed above is present.

## 5. Tier 2 — design after Tier 1

| # | Frame name | Must contain |
|---|---|---|
| 16 | `Examiner / Question Bank` | Filters (topic, difficulty, type, search), table, "New question" button |
| 17 | `Examiner / Question Editor modal` | Type switcher: single (radio for correct), multi (checkboxes + scheme select), written (no options); 2–6 options add/remove; marks, negative marks, difficulty, topic + "+ New topic" |
| 18 | `Admin / Users` | Table (name, email, role, status, created), search, role filter, per-row role dropdown, activate/deactivate confirm, "Create user" modal |
| 19 | `Examiner / Exam / Shell` | Header: title, state badge, dates, Preview + Publish buttons; tab bar (details, questions, candidates, monitor, grading, results, analytics) |
| 20 | `Examiner / Exam / Details` | ExamForm: title, instructions, start, end, duration, total marks, pass marks, shuffle toggles; read-only variant when not draft |
| 21 | `Examiner / Exam / Candidates` | Add by emails textarea + search, EnrollResult states (enrolled / already / not found), table with attempt status + score, remove button |
| 22 | `Public / Verify` | `/verify/[code]`: large valid / invalid badge, exam, initials, score, date. Must read fine logged out |
| 23 | `Public / Landing` | Product name, one line, Log in button |

## 6. Cross-cutting states (design as variants)

Every data screen has four states. Design one example of each per layout rather than all 30 combinations:

| State | Spec |
|---|---|
| Loading | skeleton blocks in the shape of the real content — not a spinner on a blank page |
| Empty | icon + one sentence + primary action ("No exams yet — Create exam") |
| Error | message + Retry button |
| Data | the default frame |

Additional overlays and variants:

| Overlay | Spec |
|---|---|
| `Import modal` | Choose CSV → dry run → totals → error table (row, field, message) → "Import N rows" + "Download sample CSV" |
| `Publish review modal` | publish-check summary + problem checklist; Publish enabled only when `canPublish` |
| `Confirm modal` | One reusable frame: title states exactly what happens, destructive action visually distinct |
| `Workspace / Offline` | Persistent bar + pill "Offline — 2 answers saved on this device". **This is the rehearsed demo moment — design it** |
| `Workspace / Reconnecting` | "Reconnected — syncing N answers…" |
| `Scratchpad drawer` | Text tab + Draw tab (pen, eraser, clear), labelled "Not graded" |
| `Settings popover` | Theme, font size, navigator left/right, one-question vs scroll-all, keyboard shortcuts list |
| `Sandbox bar` | "Preview mode — not counted" + Reset preview / Exit |
| `Announcement banner` | Dismissible, new-announcement treatment in the workspace |
| `PDF report` | Attempt report + exam report page layouts (judges may open these) |

## 7. Frame → implementation map

So the frontend work is a straight handoff. Route table from `FRONTEND_PLAN.md` section 3.

| Figma frame | Route | Frontend file |
|---|---|---|
| `Public / Landing` | `/` | `pages/HomePage.tsx` |
| `Public / Login` | `/login` | `pages/LoginPage.tsx` |
| `Public / Signup` | `/signup` | `pages/SignupPage.tsx` |
| `Public / Verify` | `/verify/[code]` | `pages/VerifyPage.tsx` |
| `Admin / Users` | `/admin` | `pages/AdminUsersPage.tsx` |
| `Examiner / Dashboard` | `/examiner` | `pages/ExaminerDashboardPage.tsx` |
| `Examiner / Question Bank` | `/examiner/questions` | `pages/QuestionBankPage.tsx` |
| `Examiner / New exam` | `/examiner/exams/new` | `pages/ExamCreatePage.tsx` |
| `Examiner / Exam / *` | `/examiner/exams/[examId]?tab=…` | `pages/ExamPage.tsx` |
| `Candidate / Dashboard` | `/candidate` | `pages/CandidateDashboardPage.tsx` |
| `Candidate / Instructions` | `/candidate/exams/[examId]` | `pages/ExamInstructionsPage.tsx` |
| `Candidate / Result` | `/candidate/results/[examId]` | `pages/CandidateResultPage.tsx` |
| `Candidate / Workspace` | `/attempt/[attemptId]` | `pages/AttemptPage.tsx` |

## 8. Time budget (suggested)

| Block | Work | Done when |
|---|---|---|
| 0:00 – 0:30 | Fill section 2 from inspiration; build style tile | Palette, type, buttons, inputs, badges decided and drawn |
| 0:30 – 1:00 | Tier 1 public + candidate (15, 12, 13, 14) | Candidate flow reads end-to-end |
| 1:00 – 2:00 | Workspace: desktop, mobile, submit dialog, submitted, offline (2–6) | All 4 question states + offline + submit visible |
| 2:00 – 3:00 | Examiner: dashboard, exam shell, questions/blueprint, monitor, grading, results, analytics (6–11) | Examiner flow reads end-to-end |
| 3:00 – 3:30 | Tier 2 leftovers + overlays | Import, publish review, confirm, scratchpad, settings |
| 3:30 – 3:45 | Consistency pass | Same component everywhere, badges distinct, focus rings drawn |

**Cut order if late:** Analytics fairness bars → Grading full flow → Admin users → Question editor modal → Landing. **Never cut:** workspace (all states), login, examiner dashboard, monitor, candidate result.

## 9. Out of scope for Figma

Don't spend time designing these — implement them directly from the plan:

- Loading skeletons for every single page (one per layout is enough)
- Alternate themes for every screen (style tile is enough)
- Email/notification screens, settings pages outside the workspace popover
- Print/PDF page-break detail beyond one attempt report and one exam report frame
- Prototype flows beyond the workspace offline demo moment

## 10. Handoff checklist

- [ ] Direction recorded in 2.1 by the Figma agent (palette, type, shape, density) so CSS can match
- [ ] All 15 Tier 1 frames exist and use the same components
- [ ] Workspace has: 4 question states, 3 question types, offline, reconnecting, submit dialog, submitted
- [ ] Every list screen has loading / empty / error variants
- [ ] All 8 status badges (2.3) visually distinct **and** labelled
- [ ] Monitor copy says "Indicator", never "Cheating"
- [ ] Candidate pages and workspace checked at 375 px
- [ ] Focus rings drawn on buttons and inputs
- [ ] Contrast checked against 2.2
- [ ] Colour is never the only signal
- [ ] Frame names match section 4/5 tables

## 11. Divergence note (read before implementing)

`FRONTEND_PLAN.md` section 5 currently mandates a fixed token set and says "never improvise a new colour later", plus no gradients and no large shadows. Inspiration-led design will likely conflict with that.

Decide one of these **before** coding starts, and record the decision in `docs/PROGRESS.md`:

1. **Update the plan** — replace `FRONTEND_PLAN.md` section 5 tokens with the inspiration-derived palette, then update `app/globals.css` in the same commit. Cleanest; keeps design and implementation aligned.
2. **Map inspiration onto the existing tokens** — keep the token *names*, change only their values. Implementation barely changes; requires the inspiration palette to be close in spirit.
3. **Figma stays aspirational** — implementation keeps the original tokens and the Figma is a rough guide only. Do not do this; judges compare the deployed app to your design language.

Option 1 or 2. Never 3.

## 12. Paste-ready brief for the Figma agent

Copy everything inside the block below, attach the inspiration references, and send it to the Figma agent. It is self-contained — the agent needs no other context.

```text
You are designing the UI for "Secure Examination Management System" (working name: ExamCore),
a web app used by institutions to create, run, monitor and grade online exams.

The visual language comes from the inspiration references I attached. Derive palette, type,
shape, density and elevation from them. Do not default to a generic dashboard template.
Record the derived values in a "Design Direction" frame (palette, type scale, radii, elevation,
density) so developers can copy them into CSS variables.

PRODUCT CONTEXT
- Three roles: Administrator, Examiner, Candidate. Each gets a different navigation shell.
- Exams have a lifecycle: draft -> published -> ongoing -> completed.
- Candidates take timed exams in a focused workspace; answers autosave; the app must work offline.
- The tone is exam-hall serious: calm, precise, trustworthy. Not playful, not corporate-generic.

DESIGN THESE SCREENS

Page 1 - Style tile
  Palette, type scale, radii, buttons (primary/secondary/ghost/destructive + hover/focus/disabled/loading),
  inputs, badges, table row, question states, focus ring.

Page 2 - Public
  Landing        product name, one line of copy, Log in button
  Login          email + password, inline field error, submit disabled while sending, link to signup
  Signup         same pattern
  Verify         /verify/[code] public result verification: large VALID / INVALID badge,
                 exam name, candidate initials only, score, date. No personal data.

Page 3 - Examiner (desktop-first, must survive 1280px)
  Dashboard      stat row (total exams, ongoing, candidates enrolled); exam cards with status badge,
                 dates, counts; "New exam" action
  Exam shell     header: title, status badge, schedule, Preview + Publish buttons; tabs:
                 Details | Questions | Candidates | Monitor | Grading | Results | Analytics
  Questions tab  left: question bank with filters (topic, difficulty, type, search) + Add
                 right: selected pool, reorder/remove
                 blueprint panel: toggle + 3 number inputs (easy/medium/hard) with a live meter
                 showing "Easy 4 needed / 6 in pool" and paper marks vs total marks
  Monitor tab    summary tiles; attempts table (name, answered progress bar, time left,
                 online dot, incident count, status); incident feed headed
                 "Indicators - review before acting" with mark-reviewed + note;
                 compensation requests (time gap, Approve / Reject); announcement composer
  Grading tab    pending count; one written answer at a time (question, max marks, candidate answer);
                 marks input with max; feedback textarea; Save & next
  Results tab    stat tiles; results table; "Publish results" with confirm; "Download exam report"
  Analytics tab  stat tiles; 10-bucket score histogram; question table with correct %, skipped %,
                 most-chosen wrong answer, labelled vs observed difficulty + mismatch badge;
                 paper fairness horizontal bars showing deviation around 0%
  Question bank  filters, table, "New question" modal with type switcher:
                 single-answer (radio for correct), multiple-select (checkboxes + marking scheme),
                 written (no options); 2-6 options add/remove; marks, negative marks, difficulty, topic
  New exam       form: title, instructions, start, end, duration, total marks, pass marks, shuffle toggles

Page 4 - Candidate (must work at 375px)
  Dashboard      three sections: Available now | Upcoming (countdown) | Completed (View result)
  Instructions   exam info, rules list, "I have read the instructions" checkbox, Start/Continue
  Result         score, pass/fail, per-question breakdown (your answer, correct answer, marks,
                 feedback), "Download verified report"

Page 5 - Exam workspace (THE HERO SCREEN - highest priority)
  Desktop 1440   top bar: exam title, large monospace timer, save-status pill, settings, scratchpad, Submit
                 navigator: grid of numbered squares with legend and counts
                            ("12 answered - 3 flagged - 5 left")
                 centre: "Question 4 of 20 - 2 marks", question stem,
                         MCQ radio list / multi-select checkboxes / written textarea,
                         flag-for-review toggle, Previous, Next
  Mobile 375     navigator becomes a bottom sheet opened from a "Questions" button;
                 top bar keeps timer + save pill + Submit
  States to show: 4 navigator states (answered, unanswered, flagged, current),
                  3 question types, timer normal / under 5 min / under 1 min,
                  save pill: all saved / saving / offline ("Offline - 2 answers saved on this device")
                  with a red bar across the top / reconnected-syncing
  Submit dialog  answered / not answered / flagged counts with clickable question numbers,
                 warning when unanswered, submit disabled while sending
  Submitted      "Your answers were submitted at ..." + back to dashboard
  Sandbox bar    "Preview mode - not counted" + Reset preview / Exit
  Scratchpad     drawer with Text tab and Draw tab (pen, eraser, clear), labelled "Not graded"
  Settings       popover: theme, font size, navigator side, layout, keyboard shortcut list

Page 6 - Admin
  Users          table (name, email, role, status, created), search, role filter,
                 per-row role dropdown, activate/deactivate confirm, "Create user" modal

Page 7 - Overlays and states
  Import modal   choose CSV -> dry run -> totals -> error table (row, field, message) ->
                 "Import N rows" + "Download sample CSV"
  Publish review summary + problem checklist, Publish disabled until checks pass
  Confirm modal  reusable; title states exactly what will happen
  Loading / Empty / Error  one example of each per layout
  PDF report     attempt report and exam report page layouts

NON-NEGOTIABLE CONSTRAINTS (independent of the inspiration)
- Accessible contrast: body text >= 4.5:1, large text >= 3:1.
- Colour is never the only signal; every status also has text or an icon.
- Visible focus ring on every interactive element.
- Candidate screens and the workspace must be usable at 375px.
- The timer must be large and high contrast - candidates read it under stress.
- No information available only on hover.
- 8 distinct exam statuses must be visually distinguishable AND labelled:
  draft, published, ongoing, completed, in_progress, submitted, auto_submitted, graded.
- Incident monitoring copy says "Indicator", never "Cheating".
- Icon set is Lucide.

FRAME NAMING
Use "Role / Screen / State", e.g. "Examiner / Monitor / Data", "Candidate / Workspace / Offline".
Use 1440x900 desktop, 1280x800 laptop checks, 375x812 mobile.

BUILD ORDER (stop at the cut line if time is short)
1. Style tile
2. Workspace desktop + mobile + submit + submitted + offline
3. Examiner dashboard, exam shell, Questions/blueprint, Monitor, Grading, Results, Analytics
4. Candidate dashboard, instructions, result
5. Login (+signup variant)
--- cut line ---
6. Question bank + editor modal, Admin users, Exam details/candidates, Verify, Landing
7. Overlays

Ask me for the inspiration references if they did not come through, and tell me which screen
you are starting with.
```

