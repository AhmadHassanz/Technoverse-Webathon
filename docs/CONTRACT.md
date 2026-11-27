# API Contract — Secure Examination Management System

The agreement between frontend (`frontend/`) and backend (`backend/`). Every request/response type named below lives in `shared/types.ts`: import from there, never invent field names. If you change an endpoint, update this file **and** `shared/types.ts` in the same commit, and tell your teammate.

**Status column:** ⏳ = stub/mock, ✅ = real and tested. Backend updates it as endpoints go live.

## Rules for every endpoint

- **Base URL:** same app → frontend calls `/api/...` (cookies are sent automatically, no CORS).
- **JSON in, JSON out.** Field names are camelCase. IDs are UUID strings. Dates are ISO strings (UTC); the frontend formats them for display.
- **Success:** `200` (or `201` when something is created) → `{ "data": <result> }`
- **Error:** → `{ "error": "Short human-readable message", "fields": { "email": "Already registered" } }` (`fields` optional, only for form validation)

| Status | Meaning | Frontend does |
|---|---|---|
| 400 | Invalid input (`fields` explains each input) | show messages under inputs |
| 401 | Not logged in / session expired | redirect to `/login` |
| 403 | Logged in but not allowed (wrong role, not yours, not enrolled, results not published) | show "You don't have access" |
| 404 | Not found | show not-found state |
| 409 | Conflict with current state (duplicate, already submitted, exam not draft, ungraded answers left) | show error in a toast |
| 410 | Time window closed (exam not open yet / ended, attempt time over) | show message; in workspace → go to submitted screen |
| 500 | Server bug | toast "Something went wrong" |

- **Auth:** Supabase Auth behind our API. `POST /api/auth/login` sets an httpOnly session cookie. The frontend never talks to Supabase directly.
- **Roles:** `admin`, `examiner`, `candidate`. Every endpoint checks the role on the server. "Owner" = the examiner who created the exam/question (admins pass every examiner check).
- **Time:** the server clock decides everything. Attempt responses include `serverNow` and `endsAt`.
- **Validation:** same rules on both sides (see "Validation rules" at the bottom).

## 1. Auth & profile

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | public | `SignupInput` → `Me` (201, logged in, role = candidate) | 400, 409 email exists | ✅ |
| POST | `/api/auth/login` | public | `LoginInput` → `Me` | 400, 401 wrong email/password, 403 account deactivated | ✅ |
| POST | `/api/auth/logout` | any | – → `OkResult` | – | ✅ |
| GET | `/api/auth/me` | any logged in | – → `Me` | 401 | ✅ |
| PATCH | `/api/me/preferences` | any logged in | `PreferencesInput` → `Preferences` | 400 | ⏳ |

## 2. Admin

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/admin/users?role=&q=` | admin | – → `User[]` (q searches name/email) | 403 | ✅ |
| POST | `/api/admin/users` | admin | `CreateUserInput` → `User` (201) | 400, 409 email exists | ✅ |
| PATCH | `/api/admin/users/[id]` | admin | `UpdateUserInput` → `User` | 400 (cannot change own role / deactivate self), 404 | ✅ |

## 3. Topics & question bank

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/topics` | examiner | – → `Topic[]` (own) | – | ⏳ |
| POST | `/api/topics` | examiner | `TopicInput` → `Topic` (201) | 400, 409 name exists | ⏳ |
| GET | `/api/questions?topicId=&difficulty=&type=&q=` | examiner | – → `Question[]` (own, newest first) | – | ⏳ |
| POST | `/api/questions` | examiner | `QuestionInput` → `Question` (201) | 400 | ⏳ |
| GET | `/api/questions/[id]` | owner | – → `Question` | 403, 404 | ⏳ |
| PATCH | `/api/questions/[id]` | owner | `QuestionInput` → `Question` (does NOT change existing attempts) | 400, 403, 404 | ⏳ |
| DELETE | `/api/questions/[id]` | owner | – → `OkResult` | 409 if used in any exam | ⏳ |

## 4. Exams

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/exams` | examiner | – → `Exam[]` (own, newest first) | – | ⏳ |
| POST | `/api/exams` | examiner | `ExamInput` → `Exam` (201, state draft) | 400 | ⏳ |
| GET | `/api/exams/[id]` | owner | – → `ExamDetail` | 403, 404 | ⏳ |
| PATCH | `/api/exams/[id]` | owner | `Partial<ExamInput>` → `Exam` | 400, 409 not draft | ⏳ |
| DELETE | `/api/exams/[id]` | owner | – → `OkResult` | 409 not draft | ⏳ |
| PUT | `/api/exams/[id]/questions` | owner | `ExamQuestionsInput` → `ExamDetail` (replaces pool, order = array order) | 400, 409 not draft | ⏳ |
| GET | `/api/exams/[id]/publish-check` | owner | – → `PublishCheck` | 403, 404 | ⏳ |
| POST | `/api/exams/[id]/publish` | owner | – → `Exam` | 409 + error = first problem (call publish-check first) | ⏳ |
| POST | `/api/exams/[id]/unpublish` | owner | – → `Exam` (back to draft) | 409 if already started or has attempts | ⏳ |

## 5. Enrollment & import

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/candidates?q=` | examiner | – → `User[]` (role candidate, max 20) | – | ⏳ |
| GET | `/api/exams/[id]/enrollments` | owner | – → `Enrollment[]` | 403 | ⏳ |
| POST | `/api/exams/[id]/enrollments` | owner | `EnrollInput` → `EnrollResult` | 400, 409 exam completed | ⏳ |
| DELETE | `/api/exams/[id]/enrollments/[candidateId]` | owner | – → `OkResult` | 409 if candidate has an attempt | ⏳ |
| POST | `/api/import/candidates` | examiner | `ImportInput` → `ImportResult` | 400 bad header / > 500 rows / > 1 MB | ⏳ |
| POST | `/api/import/questions` | examiner | `ImportInput` → `ImportResult` | 400 same | ⏳ |

**CSV formats** (first row = header, exact names, UTF-8):

- **Candidates:** `full_name,email,password` — password optional (default `Demo@1234`). Existing emails are skipped (and enrolled if `examId` is given).
- **Questions:** `topic,type,difficulty,marks,stem,option_a,option_b,option_c,option_d,option_e,option_f,correct,multi_scheme,negative_marks`
  - `type` = `mcq_single` | `mcq_multi` | `written`; `correct` = letters joined by `;` (e.g. `A;C`), empty for written; `multi_scheme` and `negative_marks` optional; topic is created if missing.

Frontend reads the file with `await file.text()` and sends it as `csv`. Always call with `dryRun: true` first, show errors, then `dryRun: false`.

## 6. Candidate

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/me/exams` | candidate | – → `MyExams` | – | ⏳ |
| GET | `/api/me/results/[examId]` | candidate | – → `CandidateResult` | 403 not published / not yours, 404 | ⏳ |

## 7. Attempts (exam workspace)

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| POST | `/api/exams/[id]/attempts` | candidate (enrolled) / owner with `sandbox: true` | `StartAttemptInput` → `StartAttemptResult` (201 new, 200 resumed) | 403 not enrolled, 409 already submitted, 410 not open / ended | ⏳ |
| GET | `/api/attempts/[id]` | attempt owner | – → `AttemptView` (no correctness ever) | 403, 404 | ⏳ |
| PUT | `/api/attempts/[id]/answers/[aqId]` | attempt owner | `AnswerInput` → `SaveResult` | 400, 403, 410 time over | ⏳ |
| POST | `/api/attempts/[id]/sync` | attempt owner | `SyncInput` → `SyncResult` (offline outbox replay) | 400, 403 | ⏳ |
| POST | `/api/attempts/[id]/heartbeat` | attempt owner | `{}` → `HeartbeatResult` (call every 15 s) | 403 | ⏳ |
| POST | `/api/attempts/[id]/incidents` | attempt owner | `IncidentInput` → `OkResult` | 400 | ⏳ |
| PUT | `/api/attempts/[id]/scratchpad` | attempt owner | `ScratchpadInput` → `{ savedAt: string }` | 400 drawing > 500 KB, 410 | ⏳ |
| POST | `/api/attempts/[id]/submit` | attempt owner | – → `SubmitResult` (safe to call twice) | 403 | ⏳ |
| DELETE | `/api/attempts/[id]` | exam owner | – → `OkResult` (reset a sandbox attempt only) | 409 not sandbox | ⏳ |

**Notes:**
- If the deadline passed, any attempt request auto-submits the attempt first; GET then returns `status: "auto_submitted"`.
- `clientSeq` must increase with every change in this browser. Older saves are ignored (`accepted: false`) — not an error.
- Opening the workspace = GET. Only the dashboard "Start/Continue" button calls `POST .../attempts`.

## 8. Monitoring

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/exams/[id]/monitor` | owner | – → `MonitorView` (frontend polls every 5 s) | 403 | ⏳ |
| GET | `/api/exams/[id]/announcements` | owner or enrolled candidate | – → `Announcement[]` | 403 | ⏳ |
| POST | `/api/exams/[id]/announcements` | owner | `AnnouncementInput` → `Announcement` (201) | 400 | ⏳ |
| PATCH | `/api/incidents/[id]` | exam owner | `IncidentReviewInput` → `Incident` | 400, 403 | ⏳ |
| PATCH | `/api/compensations/[id]` | exam owner | `CompensationDecisionInput` → `CompensationRequest` | 409 already decided / attempt finished | ⏳ |

## 9. Grading, results, analytics

| Method | URL | Who | Body → data | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/exams/[id]/grading?status=pending` | owner | – → `GradingItem[]` (`status=all` for everything) | 403 | ⏳ |
| PATCH | `/api/attempt-questions/[aqId]/grade` | exam owner | `GradeInput` → `GradingItem` | 400 marks < 0 or > question marks, 409 attempt in progress / results published | ⏳ |
| GET | `/api/exams/[id]/results` | owner | – → `ExamResults` | 403 | ⏳ |
| POST | `/api/exams/[id]/results/publish` | owner | – → `Exam` | 409 attempts in progress or ungraded written answers | ⏳ |
| GET | `/api/exams/[id]/analytics` | owner | – → `ExamAnalytics` | 403 | ⏳ |

## 10. Reports & verification

| Method | URL | Who | Returns | Errors | Status |
|---|---|---|---|---|---|
| GET | `/api/reports/attempts/[attemptId]` | candidate (own, results published) or exam owner | PDF file (`application/pdf`) with QR + verification code | 403, 404 | ⏳ |
| GET | `/api/reports/exams/[examId]` | owner | PDF file: stats + score table | 403, 404 | ⏳ |
| GET | `/api/verify/[code]` | public | `{ data: VerifyResult }` (always 200; `valid: false` if unknown) | – | ⏳ |

PDF links are plain `<a href="/api/reports/..." target="_blank">` (not `apiGet`).

## 11. Health

| Method | URL | Who | Returns | Status |
|---|---|---|---|---|
| GET | `/api/health` | public | `HealthStatus` | ✅ |

## Validation rules (frontend forms AND backend must match)

| Field | Rule |
|---|---|
| email | valid email, lowercased, max 120 |
| password | 8–72 chars, at least 1 letter and 1 number |
| fullName | 2–100 chars |
| topic name | 2–60 chars |
| question stem | 5–2000 chars |
| marks | number > 0 and ≤ 100, max 2 decimals |
| negativeMarks | 0 ≤ x ≤ marks |
| options | `mcq_single`: 2–6 options, exactly 1 correct · `mcq_multi`: 2–6 options, at least 1 correct · `written`: no options · each label 1–500 chars, no duplicates |
| exam title | 3–120 chars |
| instructions | max 5000 chars |
| startAt / endAt | valid dates, endAt > startAt |
| durationMin | integer 1–600 and ≤ minutes between startAt and endAt |
| totalMarks / passMarks | totalMarks > 0, 0 ≤ passMarks ≤ totalMarks |
| blueprint | each count ≥ 0, total ≥ 1, pool must have enough questions of each difficulty, all questions in one difficulty must have the same marks, easy×m + medium×m + hard×m = totalMarks |
| answer text | max 10000 chars |
| selectedOptionIds | must belong to that question; `mcq_single` max 1 |
| announcement | 1–500 chars |
| marksAwarded | 0 ≤ x ≤ question marks, max 2 decimals |
| CSV | max 500 data rows, max 1 MB |
| scratchpad | text max 20000 chars, drawing PNG data URL max 500 KB |

## Publish-check problems (backend returns these exact situations)

1. Exam has no questions.
2. Without blueprint: sum of pool marks ≠ totalMarks.
3. With blueprint: pool lacks enough questions of a difficulty, or marks inside one difficulty differ, or blueprint marks ≠ totalMarks.
4. endAt is in the past.
5. No candidates enrolled (warning shown, still blocks publish).
