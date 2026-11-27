// Shared types: the TypeScript version of docs/CONTRACT.md.
// Frontend and backend both import from here, so they always agree.
// RULE: change this file only together with docs/CONTRACT.md, and tell your teammate.
// API JSON is camelCase. IDs are UUID strings. Dates are ISO strings (UTC).

// ============================================================
// Response envelope
// ============================================================

/** Every successful API response looks like this. */
export type ApiSuccess<T> = { data: T };

/** Every failed API response looks like this. `fields` = per-input messages for forms. */
export type ApiError = { error: string; fields?: Record<string, string> };

/** Returned by endpoints that have nothing else to say. */
export type OkResult = { ok: true };

// ---- GET /api/health ----
export type HealthStatus = {
  status: "ok";
  time: string; // ISO date
};

// ============================================================
// Enums
// ============================================================

export type Role = "admin" | "examiner" | "candidate";
export type QuestionType = "mcq_single" | "mcq_multi" | "written";
export type Difficulty = "easy" | "medium" | "hard";
export type MultiScheme = "all_or_nothing" | "partial";
/** Derived from status + time on the server. Never stored as "ongoing"/"completed". */
export type ExamState = "draft" | "published" | "ongoing" | "completed";
export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted" | "graded";
/** Incidents the browser reports. */
export type ClientIncidentType = "tab_hidden" | "window_blur" | "fullscreen_exit" | "copy_paste";
/** All incidents (browser-reported + server-detected). Indicators only, never proof. */
export type IncidentType = ClientIncidentType | "offline" | "resumed" | "late_sync";
export type CompensationStatus = "pending" | "approved" | "rejected";

// ============================================================
// Users & auth
// ============================================================

export type Preferences = {
  theme: "light" | "dark" | "contrast" | "sepia" | "ocean" | "forest" | "midnight";
  fontScale: "sm" | "md" | "lg";
  navigatorSide: "left" | "right";
  layout: "single" | "scroll"; // one question at a time, or all questions in one scroll
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

/** The logged-in user. */
export type Me = User & { preferences: Preferences };

// POST /api/auth/signup
export type SignupInput = { fullName: string; email: string; password: string };
// POST /api/auth/login
export type LoginInput = { email: string; password: string };
// PATCH /api/me/preferences
export type PreferencesInput = Partial<Preferences>;

// POST /api/admin/users
export type CreateUserInput = { fullName: string; email: string; password: string; role: Role };
// PATCH /api/admin/users/[id]
export type UpdateUserInput = { role?: Role; isActive?: boolean };

// ============================================================
// Topics & questions
// ============================================================

export type Topic = { id: string; name: string; questionCount: number };
// POST /api/topics
export type TopicInput = { name: string };

export type QuestionOption = { id: string; label: string; isCorrect: boolean };

export type Question = {
  id: string;
  topicId: string;
  topicName: string;
  type: QuestionType;
  stem: string;
  difficulty: Difficulty;
  marks: number;
  multiScheme: MultiScheme; // only used by mcq_multi
  negativeMarks: number; // 0 = off. Marks taken away for a wrong objective answer.
  options: QuestionOption[]; // [] for written
  createdAt: string;
};

// POST /api/questions, PATCH /api/questions/[id]
export type QuestionInput = {
  topicId: string;
  type: QuestionType;
  stem: string;
  difficulty: Difficulty;
  marks: number;
  multiScheme: MultiScheme;
  negativeMarks: number;
  options: { label: string; isCorrect: boolean }[];
};

// ============================================================
// Exams
// ============================================================

export type Blueprint = { easy: number; medium: number; hard: number };

export type Exam = {
  id: string;
  title: string;
  instructions: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  totalMarks: number;
  passMarks: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  blueprint: Blueprint | null; // null = every candidate gets every pool question
  state: ExamState;
  resultsPublishedAt: string | null;
  questionCount: number; // pool size
  enrolledCount: number;
  attemptCount: number; // real attempts only (sandbox excluded)
  createdAt: string;
};

export type ExamDetail = Exam & { questions: Question[] }; // pool, in position order

// POST /api/exams, PATCH /api/exams/[id] (Partial)
export type ExamInput = {
  title: string;
  instructions: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  totalMarks: number;
  passMarks: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

// PUT /api/exams/[id]/questions
export type ExamQuestionsInput = { questionIds: string[]; blueprint: Blueprint | null };

// GET /api/exams/[id]/publish-check
export type PublishCheck = {
  canPublish: boolean;
  problems: string[]; // human-readable, shown as a checklist
  summary: {
    poolSize: number;
    paperQuestionCount: number; // questions each candidate gets
    paperMarks: number; // marks each candidate's paper is worth
    enrolledCount: number;
  };
};

// ============================================================
// Enrollment & import
// ============================================================

export type Enrollment = {
  candidateId: string;
  fullName: string;
  email: string;
  enrolledAt: string;
  attemptStatus: AttemptStatus | "not_started";
  score: number | null;
};

// POST /api/exams/[id]/enrollments
export type EnrollInput = { emails: string[] };
export type EnrollResult = { enrolled: number; alreadyEnrolled: number; notFound: string[] };

// POST /api/import/candidates and /api/import/questions
export type ImportInput = { csv: string; dryRun: boolean; examId?: string }; // examId: candidates only, also enroll them
export type ImportRowError = { row: number; field: string; message: string }; // row 1 = first data row
export type ImportResult = {
  totalRows: number;
  validRows: number;
  created: number; // 0 when dryRun
  skipped: number; // e.g. candidate email already exists
  errors: ImportRowError[];
};

// ============================================================
// Candidate dashboard
// ============================================================

export type CandidateExam = {
  examId: string;
  title: string;
  instructions: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  totalMarks: number;
  state: ExamState;
  attempt: { id: string; status: AttemptStatus; endsAt: string; submittedAt: string | null } | null;
  resultPublished: boolean;
  canStart: boolean; // true = show Start / Continue button
  blockedReason: string | null; // e.g. "Opens at 2:00 PM", "Already submitted"
};

// GET /api/me/exams
export type MyExams = {
  available: CandidateExam[];
  upcoming: CandidateExam[];
  completed: CandidateExam[];
};

// ============================================================
// Attempts (exam workspace)
// ============================================================

// POST /api/exams/[id]/attempts
export type StartAttemptInput = { sandbox?: boolean };
export type StartAttemptResult = { attemptId: string; resumed: boolean };

/** A question as the candidate sees it. NEVER contains correctness. */
export type AttemptQuestion = {
  aqId: string;
  position: number; // 1-based
  type: QuestionType;
  stem: string;
  marks: number;
  options: { id: string; label: string }[]; // already shuffled; [] for written
};

export type Answer = {
  aqId: string;
  selectedOptionIds: string[];
  textAnswer: string;
  flagged: boolean;
  clientSeq: number;
  savedAt: string;
};

export type Announcement = { id: string; message: string; createdAt: string };

// GET /api/attempts/[id]
export type AttemptView = {
  id: string;
  examId: string;
  examTitle: string;
  instructions: string;
  isSandbox: boolean;
  status: AttemptStatus;
  startedAt: string;
  endsAt: string; // already includes approved compensation
  serverNow: string; // use (endsAt - serverNow) for the countdown, never the device clock alone
  totalMarks: number;
  questions: AttemptQuestion[];
  answers: Answer[]; // only questions that have a saved answer
  scratchpad: { text: string; drawing: string | null }; // drawing = PNG data URL
  announcements: Announcement[];
  preferences: Preferences;
};

// PUT /api/attempts/[id]/answers/[aqId]
export type AnswerInput = {
  selectedOptionIds: string[];
  textAnswer: string;
  flagged: boolean;
  clientSeq: number; // increases on every change, per attempt
};
export type SaveResult = {
  aqId: string;
  accepted: boolean; // false = server already has a newer clientSeq (safe to ignore)
  savedAt: string;
  serverNow: string;
  endsAt: string;
};

// POST /api/attempts/[id]/sync
export type SyncInput = { answers: (AnswerInput & { aqId: string })[] };
export type SyncResult = {
  results: { aqId: string; accepted: boolean; reason: "stale" | "late" | "invalid" | null }[];
  serverNow: string;
  endsAt: string;
  status: AttemptStatus;
};

// POST /api/attempts/[id]/heartbeat (body: {})
export type HeartbeatResult = {
  serverNow: string;
  endsAt: string;
  status: AttemptStatus;
  announcements: Announcement[];
};

// POST /api/attempts/[id]/incidents
export type IncidentInput = { type: ClientIncidentType; detail?: string };

// PUT /api/attempts/[id]/scratchpad
export type ScratchpadInput = { text: string; drawing: string | null };

// POST /api/attempts/[id]/submit
export type SubmitResult = { status: AttemptStatus; submittedAt: string };

// ============================================================
// Monitoring
// ============================================================

export type MonitorAttempt = {
  attemptId: string;
  candidateId: string;
  fullName: string;
  email: string;
  status: AttemptStatus;
  answeredCount: number;
  questionCount: number;
  startedAt: string;
  endsAt: string;
  lastSeenAt: string | null;
  online: boolean; // heartbeat within the last 45 s
  incidentCount: number;
};

export type Incident = {
  id: string;
  attemptId: string;
  candidateName: string;
  type: IncidentType;
  detail: string | null;
  createdAt: string;
  reviewed: boolean;
  reviewerNote: string | null;
};

export type CompensationRequest = {
  id: string;
  attemptId: string;
  candidateName: string;
  gapSec: number; // measured by the server from missed heartbeats
  status: CompensationStatus;
  createdAt: string;
  decidedAt: string | null;
};

// GET /api/exams/[id]/monitor
export type MonitorView = {
  exam: { id: string; title: string; state: ExamState; endAt: string };
  summary: { enrolled: number; notStarted: number; inProgress: number; submitted: number; online: number };
  attempts: MonitorAttempt[];
  incidents: Incident[]; // newest first, max 50
  compensations: CompensationRequest[]; // newest first
};

// POST /api/exams/[id]/announcements
export type AnnouncementInput = { message: string };
// PATCH /api/incidents/[id]
export type IncidentReviewInput = { reviewed: boolean; reviewerNote?: string };
// PATCH /api/compensations/[id]
export type CompensationDecisionInput = { decision: "approved" | "rejected" };

// ============================================================
// Grading, results, analytics
// ============================================================

// GET /api/exams/[id]/grading?status=pending|all
export type GradingItem = {
  aqId: string;
  attemptId: string;
  candidateName: string;
  position: number;
  stem: string;
  marks: number;
  textAnswer: string;
  marksAwarded: number | null; // null = not graded yet
  feedback: string | null;
};

// PATCH /api/attempt-questions/[aqId]/grade
export type GradeInput = { marksAwarded: number; feedback?: string };

export type ExamStats = {
  attempts: number;
  average: number;
  median: number;
  highest: number;
  lowest: number;
  passRate: number; // 0-100
  averagePercentage: number; // 0-100
};

export type ResultRow = {
  attemptId: string;
  candidateName: string;
  email: string;
  status: AttemptStatus;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  submittedAt: string | null;
  paperDifficulty: number | null; // 0-100, see analytics fairness
};

// GET /api/exams/[id]/results
export type ExamResults = { exam: Exam; stats: ExamStats; rows: ResultRow[] };

export type QuestionStat = {
  questionId: string;
  stem: string;
  type: QuestionType;
  labelledDifficulty: Difficulty;
  observedDifficulty: Difficulty | null; // null = not enough data
  mismatch: boolean; // labelled differs from observed
  timesShown: number;
  correctPct: number; // objective: % fully correct. written: average % of marks
  skippedPct: number;
  mostChosenWrong: { label: string; pct: number } | null;
};

export type PaperFairness = {
  attemptId: string;
  candidateName: string;
  paperDifficulty: number; // 0-100, higher = harder paper
  deviationPct: number; // vs exam average, e.g. +8 means 8% harder than average
};

// GET /api/exams/[id]/analytics
export type ExamAnalytics = {
  stats: ExamStats;
  distribution: { bucket: string; count: number }[]; // 10 buckets: "0-9", "10-19", ... "90-100"
  questions: QuestionStat[];
  fairness: PaperFairness[];
};

// GET /api/me/results/[examId]
export type CandidateResult = {
  attemptId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  publishedAt: string;
  questions: {
    position: number;
    stem: string;
    type: QuestionType;
    marks: number;
    marksAwarded: number;
    yourAnswer: string; // option labels joined with ", " or the written text
    correctAnswer: string | null; // null for written
    feedback: string | null;
  }[];
};

// GET /api/verify/[code]  (public)
export type VerifyResult =
  | {
      valid: true;
      examTitle: string;
      candidateInitials: string; // e.g. "A. K." (never full name or email)
      score: number;
      totalMarks: number;
      percentage: number;
      passed: boolean;
      issuedAt: string;
    }
  | { valid: false };
