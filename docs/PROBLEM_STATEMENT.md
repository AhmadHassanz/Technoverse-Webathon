# Problem Statement — Secure Examination Management System

Source: official "Web-e-Thon Problem Statement.pdf" (Technoverse 5.0, COMSATS Lahore, 27–28 Nov 2026). 10 hours · 1–3 participants · 15-minute live demo.

## 01 Problem overview
Online examinations present challenges in academic integrity, fairness, network reliability and the management of large numbers of candidates. Build a full-stack web app that lets institutions and competition organizers **create, conduct, monitor and evaluate** online examinations. It must support reliable and accessible exam workflows and address **at least one** innovation challenge from section 05.

## 02 User roles
| Role | Responsibilities |
|---|---|
| Administrator | Manage users, roles, access permissions and overall platform operations. |
| Examiner | Create and configure exams, manage questions and candidates, monitor attempts, evaluate submissions and publish results. |
| Candidate | Access assigned exams, complete and submit answers, view published results. |

## 03 Core functional requirements
Teams choose their own implementation, data model and interface design.

**3.1 Authentication & authorization**
- Secure authentication for admins, examiners and candidates; appropriate experience per role.
- Admins manage user accounts and role assignments. Enforce permissions **on the backend**, not just by hiding UI.
- Examiners and candidates can access only the exams, records and actions they are authorized for.

**3.2 Examination management**
- Examiners create/configure exams: title, instructions, schedule, duration, total marks, relevant settings.
- Lifecycle: **draft, published, ongoing, completed**. Candidates must not access an exam before it is available to them.
- Examiners review exam details before publication and manage their exams through an appropriate interface.

**3.3 Question management**
- Reusable question bank with categories/topics and difficulty levels. Create, edit, assign to exams.
- Single-answer MCQ, multiple-select and written-response questions, with appropriate marking schemes.
- Randomize objective questions or options where applicable. Preserve the marking scheme and question assignment for an active attempt.

**3.4 Candidate management**
- Examiners enroll candidates and view enrollment information.
- Candidates see their available, upcoming and completed exams, with instructions and access status.
- Restrict entry to eligible candidates and enforce the availability window.

**3.5 Examination interface**
- Show questions, marks, remaining time and navigation in an accessible workspace. Distinguish answered, unanswered and marked-for-review.
- Auto-save answers. Preserve saved progress and remaining time on refresh/return.
- Candidates review progress and submit. Enforce the time limit; finalize at expiry using answers accepted within the permitted period.

**3.6 Examination monitoring**
- Examiners see active attempts, their progress and relevant events/incidents.
- Monitor exam status and send announcements to candidates during an exam.
- Record and present incidents for review. Monitoring indicators must **not** be treated as conclusive evidence of misconduct.

**3.7 Evaluation & grading**
- Auto-grade objective responses per the configured marking scheme, including multiple-select rules.
- Examiners review and manually grade written responses, validated against assigned marks.
- Accurate total scores, consistent grading state. Examiners review results before publication.

**3.8 Results & analytics**
- Publish results in a controlled manner. Candidates see only their own published results.
- Exam-level performance summaries and candidate-level scores from real submission data.
- Retain completed attempts and results for later review by authorized users.

## 04 Secondary features (all eight expected)
1. **Network-aware interface** — detect/communicate connectivity problems and saving/sync status.
2. **PDF report generation** — downloadable readable PDFs from real data, with access restrictions.
3. **Examination sandbox** — examiners preview an exam as a candidate; sandbox attempts never affect real submissions, results or statistics.
4. **Bulk data import** — import candidates and questions from CSV/JSON, validate, show errors clearly.
5. **Question analytics** — frequently skipped, commonly incorrect, observed difficulty.
6. **Verifiable reports** — verification ID or QR code to check authenticity without exposing unnecessary candidate info.
7. **Customizable workspace** — candidates customize layout/viewing preferences, and they are retained.
8. **Digital scratchpad** — rough-work space usable inside the exam workflow.

## 05 Open innovation challenges (implement ≥ 1)
- **5.1 Integrity in the AI era** — improve integrity without unnecessarily compromising privacy or usability.
- **5.2 Fairness of randomized exams** — randomized papers can differ in difficulty; improve fairness while keeping variation.
- **5.3 Failure-resilient exams** — reduce impact of outages/device/power failures without giving extra time or unfair advantage.
- **5.4 Trust & dispute resolution** — fair, transparent, accountable mechanism for result disputes.
- **5.5 Participant-defined challenge.**

Solutions must be functional, relevant and demonstrable; explain design decisions and trade-offs. Quality over quantity.
**Our choice: 5.3 (heartbeat outage detection + examiner-approved compensation) and 5.2 (difficulty blueprint + paper fairness analytics).** See `docs/BACKEND_PLAN.md`.

## 06 Technical requirements & constraints
- **Security & privacy:** server-side authorization. Protect credentials, answer keys, personal info and exam records. No private data via public endpoints or reports.
- **Data integrity:** timing enforced independently of the device clock. Prevent duplicate submissions and inconsistent grading; preserve assigned questions and marking scheme for active attempts.
- **Validation & reliability:** validate on frontend and backend. Handle invalid data, interrupted requests, refreshes and repeated actions gracefully. Communicate failures and saving status.
- **Architecture & maintainability:** appropriate DB design, clear separation of responsibilities, maintainable code; be ready to explain tech choices.
- **Technical freedom:** AI-assisted coding allowed; AI integration optional. No required feature may depend on paid APIs/keys, proprietary datasets, special hardware or billed services. Simulated/local alternatives are fine.

## 07 Submission requirements
- Git repo with source code and version history + a deployed, working web app.
- Concise README: setup instructions, **test credentials for each role**, dependencies, description of implemented innovation challenge(s).
- Demo works with fictional/test data. Present the deployed app in 15 minutes.
- No commits, pushes, builds or deployments after the deadline; no timestamp manipulation.

## 08 Evaluation (100 marks)
| Category | Marks | What is evaluated |
|---|---|---|
| Core functionality | 30 | Completeness, correctness and integration of the core exam workflow |
| Secondary features | 15 | Working implementation, usefulness and integration of the 8 features |
| Technical quality & reliability | 20 | Architecture, DB design, security, validation, data integrity, failure handling |
| Open innovation | 15 | Problem understanding, originality, practicality, effectiveness |
| UI/UX & product design | 20 | Intuitive workflows, discoverability, visual hierarchy, accessibility, responsiveness, interaction quality |

- Avoid generic, template-like or unrefined AI-generated interfaces. AI use itself doesn't affect design marks.
- Partial marks for incomplete requirements; non-functional placeholders don't get full credit.
- No extra marks for AI, paid services or a particular technology.
- Judges may test common scenarios and ask teams to explain design decisions. Same implementation is not rewarded twice.
