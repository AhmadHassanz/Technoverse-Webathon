// Mock fixtures typed against shared/types.ts.
// Swap these for the real API calls when the endpoints go live.

import type {
  Announcement,
  AttemptView,
  CandidateExam,
  CandidateResult,
  CompensationRequest,
  Enrollment,
  Exam,
  ExamAnalytics,
  ExamDetail,
  ExamResults,
  GradingItem,
  Incident,
  Me,
  MonitorView,
  MyExams,
  Question,
  User,
  VerifyResult,
} from "@/shared/types";

const now = new Date();
const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const createdAt = at(-14, 9);

let optCounter = 0;
function options(
  labels: string[],
  correct: number[] = [],
): Question["options"] {
  return labels.map((label, i) => ({
    id: `opt-${++optCounter}`,
    label,
    isCorrect: correct.includes(i),
  }));
}

function q(
  n: number,
  stem: string,
  type: Question["type"],
  difficulty: Question["difficulty"],
  marks: number,
  topicName: string,
  optionLabels: string[] = [],
  correct: number[] = [],
): Question {
  return {
    id: `q-${String(n).padStart(3, "0")}`,
    topicId: `topic-${topicName.toLowerCase().replace(/\s+/g, "-")}`,
    topicName,
    type,
    stem,
    difficulty,
    marks,
    multiScheme: type === "mcq_multi" ? "all_or_nothing" : "all_or_nothing",
    negativeMarks: 0,
    options: type === "written" ? [] : options(optionLabels, correct),
    createdAt,
  };
}

export const MOCK_TOPICS = [
  { id: "topic-algorithms", name: "Algorithms", questionCount: 4 },
  { id: "topic-data-structures", name: "Data Structures", questionCount: 5 },
  { id: "topic-databases", name: "Databases", questionCount: 4 },
  { id: "topic-operating-systems", name: "Operating Systems", questionCount: 3 },
  { id: "topic-networks", name: "Networks", questionCount: 2 },
  { id: "topic-discrete-mathematics", name: "Discrete Mathematics", questionCount: 2 },
];

export const MOCK_QUESTIONS: Question[] = [
  q(1, "What is the time complexity of binary search?", "mcq_single", "easy", 2, "Algorithms", ["O(n)", "O(log n)", "O(n log n)", "O(1)"], [1]),
  q(2, "Select the properties of a balanced tree.", "mcq_multi", "medium", 3, "Data Structures", ["Height is O(log n)", "Every node has two children", "All leaves are at the same depth", "Rotations keep it balanced"], [0, 3]),
  q(3, "Explain collision handling in hash tables.", "written", "hard", 5, "Data Structures", [], []),
  q(4, "Which data structure is most suitable for implementing undo in a text editor?", "mcq_single", "easy", 2, "Data Structures", ["Queue — first in, first out", "Stack — last in, first out", "Binary search tree — ordered nodes", "Graph — connected vertices"], [1]),
  q(5, "Which normal form removes transitive dependencies?", "mcq_single", "medium", 2, "Databases", ["1NF", "2NF", "3NF", "BCNF"], [2]),
  q(6, "A process is waiting for a resource held by another process. What is this called?", "mcq_single", "easy", 2, "Operating Systems", ["Starvation", "Deadlock", "Thrashing", "Spooling"], [1]),
  q(7, "Which protocol resolves an IP address to a MAC address?", "mcq_single", "easy", 2, "Networks", ["DNS", "DHCP", "ARP", "RARP"], [2]),
  q(8, "Select every statement that is true for quicksort.", "mcq_multi", "medium", 3, "Algorithms", ["It is stable by default", "It has O(n log n) average time", "It needs extra memory for merging", "Its worst case is O(n²)"], [1, 3]),
  q(9, "Describe the difference between a stack and a queue.", "written", "medium", 4, "Data Structures", [], []),
  q(10, "What is the output of 2⁵ × 2³?", "mcq_single", "easy", 2, "Discrete Mathematics", ["2⁸", "2¹⁵", "4⁸", "2²"], [0]),
  q(11, "Which of these is a primary key property?", "mcq_single", "easy", 2, "Databases", ["Allows duplicates", "Can be null", "Uniquely identifies a row", "Must be numeric"], [2]),
  q(12, "Which scheduling algorithm can cause starvation?", "mcq_single", "medium", 2, "Operating Systems", ["First come, first served", "Shortest job first", "Round robin", "FIFO"], [1]),
  q(13, "Which structural change characterises a left rotation in an AVL tree?", "mcq_single", "hard", 3, "Data Structures", ["Left child moves up", "Right child moves up", "Root is removed", "Leaves are merged"], [1]),
  q(14, "Select the correct statements about B-trees.", "mcq_multi", "hard", 4, "Databases", ["They store all keys in leaves", "They are self-balancing", "They are designed for disk access", "They require exactly two children"], [1, 2]),
  q(15, "What does a page fault indicate?", "mcq_single", "medium", 2, "Operating Systems", ["The page is in memory", "The page is not in memory", "The CPU is idle", "The disk is full"], [1]),
  q(16, "Which HTTP status code means the request was understood but cannot be fulfilled?", "mcq_single", "easy", 2, "Networks", ["200", "301", "409", "500"], [2]),
  q(17, "Explain how a hash table resolves collisions using open addressing.", "written", "hard", 5, "Data Structures", [], []),
  q(18, "Explain two approaches to resolving collisions in a hash table. Compare their trade-offs.", "written", "hard", 5, "Data Structures", [], []),
  q(19, "Which sorting algorithm is stable and runs in O(n log n) worst case?", "mcq_single", "medium", 2, "Algorithms", ["Quicksort", "Heapsort", "Merge sort", "Insertion sort"], [2]),
  q(20, "Select the situations that count as a database deadlock.", "mcq_multi", "medium", 3, "Databases", ["Two transactions wait on each other", "A transaction rolls back", "A lock is never released", "A query returns no rows"], [0, 2]),
];

export const MOCK_USERS: User[] = [
  { id: "u-admin-1", email: "amna.sheikh@examcore.pk", fullName: "Amna Sheikh", role: "admin", isActive: true, createdAt: at(-120, 9) },
  { id: "u-admin-2", email: "bilal.hassan@examcore.pk", fullName: "Bilal Hassan", role: "admin", isActive: true, createdAt: at(-110, 9) },
  { id: "u-ex-1", email: "sara.ahmed@examcore.pk", fullName: "Dr. Sara Ahmed", role: "examiner", isActive: true, createdAt: at(-90, 9) },
  { id: "u-ex-2", email: "hamza.ali@examcore.pk", fullName: "Dr. Hamza Ali", role: "examiner", isActive: true, createdAt: at(-80, 9) },
  { id: "u-c-1", email: "ayesha.khan@example.edu", fullName: "Ayesha Khan", role: "candidate", isActive: true, createdAt: at(-60, 9) },
  { id: "u-c-2", email: "hamza.ali@example.edu", fullName: "Hamza Ali", role: "candidate", isActive: true, createdAt: at(-55, 9) },
  { id: "u-c-3", email: "usman.raza@example.edu", fullName: "Usman Raza", role: "candidate", isActive: false, createdAt: at(-50, 9) },
  { id: "u-c-4", email: "fatima.noor@example.edu", fullName: "Fatima Noor", role: "candidate", isActive: true, createdAt: at(-40, 9) },
  { id: "u-c-5", email: "sara.ali@example.edu", fullName: "Sara Ali", role: "candidate", isActive: true, createdAt: at(-35, 9) },
  { id: "u-c-6", email: "bilal.hussain@example.edu", fullName: "Bilal Hussain", role: "candidate", isActive: true, createdAt: at(-30, 9) },
  { id: "u-c-7", email: "zain.malik@example.edu", fullName: "Zain Malik", role: "candidate", isActive: true, createdAt: at(-25, 9) },
  { id: "u-c-8", email: "mariam.siddiqui@example.edu", fullName: "Mariam Siddiqui", role: "candidate", isActive: true, createdAt: at(-20, 9) },
];

const prefs = {
  theme: "light" as const,
  fontScale: "md" as const,
  navigatorSide: "left" as const,
  layout: "single" as const,
};

export const MOCK_ME: Record<string, Me> = {
  admin: { ...MOCK_USERS[0], preferences: prefs },
  examiner: { ...MOCK_USERS[2], preferences: prefs },
  candidate: { ...MOCK_USERS[4], preferences: prefs },
};

export const DEMO_ACCOUNTS = [
  {
    role: "admin" as const,
    label: "Administrator",
    email: "amna.sheikh@examcore.pk",
    name: "Amna Sheikh",
  },
  {
    role: "examiner" as const,
    label: "Examiner",
    email: "sara.ahmed@examcore.pk",
    name: "Dr. Sara Ahmed",
  },
  {
    role: "candidate" as const,
    label: "Candidate",
    email: "ayesha.khan@example.edu",
    name: "Ayesha Khan",
  },
];

export const MOCK_EXAMS: Exam[] = [
  {
    id: "exam-dsa",
    title: "Data Structures & Algorithms",
    instructions:
      "Complete this examination independently. Do not use outside assistance. Answers save automatically; the timer keeps running if you leave.",
    startAt: at(0, 9),
    endAt: at(0, 10),
    durationMin: 60,
    totalMarks: 40,
    passMarks: 20,
    shuffleQuestions: false,
    shuffleOptions: false,
    blueprint: { easy: 4, medium: 10, hard: 6 },
    state: "ongoing",
    resultsPublishedAt: null,
    questionCount: 20,
    enrolledCount: 48,
    attemptCount: 42,
    createdAt: at(-14, 9),
  },
  {
    id: "exam-db",
    title: "Database Systems",
    instructions:
      "Answer every question. Written responses are graded by your examiner after the window closes.",
    startAt: at(2, 9),
    endAt: at(2, 10, 30),
    durationMin: 60,
    totalMarks: 40,
    passMarks: 20,
    shuffleQuestions: true,
    shuffleOptions: true,
    blueprint: null,
    state: "published",
    resultsPublishedAt: null,
    questionCount: 30,
    enrolledCount: 64,
    attemptCount: 0,
    createdAt: at(-10, 9),
  },
  {
    id: "exam-os",
    title: "Operating Systems",
    instructions: "Draft examination. Instructions will be confirmed before publishing.",
    startAt: at(4, 9),
    endAt: at(4, 10),
    durationMin: 60,
    totalMarks: 30,
    passMarks: 15,
    shuffleQuestions: false,
    shuffleOptions: false,
    blueprint: null,
    state: "draft",
    resultsPublishedAt: null,
    questionCount: 12,
    enrolledCount: 0,
    attemptCount: 0,
    createdAt: at(-5, 9),
  },
  {
    id: "exam-cn",
    title: "Computer Networks",
    instructions: "Closed-book examination. All questions are compulsory.",
    startAt: at(-1, 9),
    endAt: at(-1, 10),
    durationMin: 60,
    totalMarks: 40,
    passMarks: 20,
    shuffleQuestions: false,
    shuffleOptions: false,
    blueprint: null,
    state: "completed",
    resultsPublishedAt: at(-1, 12),
    questionCount: 20,
    enrolledCount: 56,
    attemptCount: 56,
    createdAt: at(-20, 9),
  },
  {
    id: "exam-dm",
    title: "Discrete Mathematics",
    instructions: "Closed-book examination. Show all working in written answers.",
    startAt: at(-2, 9),
    endAt: at(-2, 10),
    durationMin: 60,
    totalMarks: 40,
    passMarks: 20,
    shuffleQuestions: false,
    shuffleOptions: false,
    blueprint: null,
    state: "completed",
    resultsPublishedAt: at(-1, 12),
    questionCount: 20,
    enrolledCount: 32,
    attemptCount: 32,
    createdAt: at(-24, 9),
  },
];

export const MOCK_EXAM_DETAIL: ExamDetail = {
  ...MOCK_EXAMS[0],
  questions: MOCK_QUESTIONS,
};

export function examDetail(id: string): ExamDetail {
  const exam = MOCK_EXAMS.find((e) => e.id === id) ?? MOCK_EXAMS[0];
  return { ...exam, questions: MOCK_QUESTIONS };
}

export const MOCK_ENROLLMENTS: Enrollment[] = [
  { candidateId: "u-c-1", fullName: "Ayesha Khan", email: "ayesha.khan@example.edu", enrolledAt: at(-7, 9), attemptStatus: "in_progress", score: null },
  { candidateId: "u-c-2", fullName: "Hamza Ali", email: "hamza.ali@example.edu", enrolledAt: at(-7, 9), attemptStatus: "submitted", score: null },
  { candidateId: "u-c-3", fullName: "Usman Raza", email: "usman.raza@example.edu", enrolledAt: at(-7, 9), attemptStatus: "graded", score: 31 },
  { candidateId: "u-c-4", fullName: "Fatima Noor", email: "fatima.noor@example.edu", enrolledAt: at(-6, 9), attemptStatus: "not_started", score: null },
  { candidateId: "u-c-5", fullName: "Sara Ali", email: "sara.ali@example.edu", enrolledAt: at(-6, 9), attemptStatus: "in_progress", score: null },
  { candidateId: "u-c-6", fullName: "Bilal Hussain", email: "bilal.hussain@example.edu", enrolledAt: at(-5, 9), attemptStatus: "graded", score: 34 },
];

export const MOCK_GRADING: GradingItem[] = [
  {
    aqId: "aq-18",
    attemptId: "attempt-1",
    candidateName: "Ayesha Khan",
    position: 18,
    stem: "Explain two approaches to resolving collisions in a hash table. Compare their trade-offs.",
    marks: 5,
    textAnswer:
      "Separate chaining stores colliding values in a linked list at each index. It is simple and handles higher load factors, but needs extra memory.\n\nOpen addressing finds another empty slot, for example with linear probing. It keeps data in the array but can form clusters and gets slower as the table fills.",
    marksAwarded: 4,
    feedback: "Clear comparison. Include deletion handling for full marks.",
  },
  {
    aqId: "aq-9",
    attemptId: "attempt-2",
    candidateName: "Bilal Hussain",
    position: 9,
    stem: "Describe the difference between a stack and a queue.",
    marks: 4,
    textAnswer:
      "A stack removes the most recently added item (LIFO). A queue removes the oldest item (FIFO).",
    marksAwarded: null,
    feedback: null,
  },
  {
    aqId: "aq-17",
    attemptId: "attempt-3",
    candidateName: "Sara Ali",
    position: 19,
    stem: "Explain how a hash table resolves collisions using open addressing.",
    marks: 5,
    textAnswer:
      "Open addressing probes for the next free index. Linear probing checks the next slot, quadratic probing jumps further, and double hashing uses a second hash function.",
    marksAwarded: null,
    feedback: null,
  },
];

export const MOCK_RESULTS: ExamResults = {
  exam: MOCK_EXAMS[0],
  stats: {
    attempts: 48,
    average: 29.6,
    median: 31,
    highest: 38,
    lowest: 12,
    passRate: 87.5,
    averagePercentage: 74,
  },
  rows: [
    { attemptId: "a-1", candidateName: "Ayesha Khan", email: "ayesha.khan@example.edu", status: "graded", score: 34, percentage: 85, passed: true, submittedAt: at(0, 10), paperDifficulty: 48 },
    { attemptId: "a-2", candidateName: "Bilal Hussain", email: "bilal.hussain@example.edu", status: "graded", score: 31, percentage: 77.5, passed: true, submittedAt: at(0, 10), paperDifficulty: 46 },
    { attemptId: "a-3", candidateName: "Sara Ali", email: "sara.ali@example.edu", status: "graded", score: 28, percentage: 70, passed: true, submittedAt: at(0, 10), paperDifficulty: 52 },
    { attemptId: "a-4", candidateName: "Hamza Noor", email: "hamza.noor@example.edu", status: "graded", score: 17, percentage: 42.5, passed: false, submittedAt: at(0, 10), paperDifficulty: 61 },
    { attemptId: "a-5", candidateName: "Fatima Noor", email: "fatima.noor@example.edu", status: "graded", score: 36, percentage: 90, passed: true, submittedAt: at(0, 10), paperDifficulty: 44 },
    { attemptId: "a-6", candidateName: "Zain Malik", email: "zain.malik@example.edu", status: "graded", score: 38, percentage: 95, passed: true, submittedAt: at(0, 10), paperDifficulty: 43 },
  ],
};

export const MOCK_ANALYTICS: ExamAnalytics = {
  stats: {
    attempts: 48,
    average: 29.6,
    median: 31,
    highest: 38,
    lowest: 12,
    passRate: 87.5,
    averagePercentage: 74,
  },
  distribution: [
    { bucket: "0–9", count: 0 },
    { bucket: "10–19", count: 0 },
    { bucket: "20–29", count: 1 },
    { bucket: "30–39", count: 1 },
    { bucket: "40–49", count: 4 },
    { bucket: "50–59", count: 4 },
    { bucket: "60–69", count: 7 },
    { bucket: "70–79", count: 13 },
    { bucket: "80–89", count: 12 },
    { bucket: "90–100", count: 6 },
  ],
  questions: [
    { questionId: "q-1", stem: "Q04 · Binary search", type: "mcq_single", labelledDifficulty: "easy", observedDifficulty: "easy", mismatch: false, timesShown: 48, correctPct: 82, skippedPct: 2, mostChosenWrong: { label: "C · O(n)", pct: 12 } },
    { questionId: "q-13", stem: "Q09 · Tree rotation", type: "mcq_single", labelledDifficulty: "medium", observedDifficulty: "hard", mismatch: true, timesShown: 48, correctPct: 38, skippedPct: 8, mostChosenWrong: { label: "B · Left-right", pct: 31 } },
    { questionId: "q-18", stem: "Q14 · Hashing", type: "mcq_single", labelledDifficulty: "medium", observedDifficulty: "medium", mismatch: false, timesShown: 48, correctPct: 64, skippedPct: 4, mostChosenWrong: { label: "D · Chaining", pct: 19 } },
    { questionId: "q-8", stem: "Q07 · Quicksort", type: "mcq_multi", labelledDifficulty: "medium", observedDifficulty: "medium", mismatch: false, timesShown: 48, correctPct: 57, skippedPct: 6, mostChosenWrong: { label: "A · Stable by default", pct: 22 } },
    { questionId: "q-3", stem: "Q17 · Open addressing", type: "written", labelledDifficulty: "hard", observedDifficulty: "hard", mismatch: false, timesShown: 48, correctPct: 61, skippedPct: 11, mostChosenWrong: null },
  ],
  fairness: [
    { attemptId: "a-1", candidateName: "Paper A", paperDifficulty: 48, deviationPct: -2.1 },
    { attemptId: "a-2", candidateName: "Paper B", paperDifficulty: 52, deviationPct: 1.4 },
    { attemptId: "a-3", candidateName: "Paper C", paperDifficulty: 51, deviationPct: 0.7 },
  ],
};

const attempt = (endsInMin = 42.3) => {
  const ends = new Date(Date.now() + endsInMin * 60_000);
  return {
    endsAt: ends.toISOString(),
    serverNow: new Date().toISOString(),
  };
};

export const MOCK_ATTEMPT: AttemptView = {
  id: "attempt-1",
  examId: "exam-dsa",
  examTitle: "Data Structures & Algorithms",
  instructions:
    "Complete this examination independently. Do not use outside assistance.",
  isSandbox: false,
  status: "in_progress",
  startedAt: new Date(Date.now() - 18 * 60_000).toISOString(),
  ...attempt(),
  totalMarks: 40,
  questions: MOCK_QUESTIONS.map((question, i) => ({
    aqId: `aq-${i + 1}`,
    position: i + 1,
    type: question.type,
    stem: question.stem,
    marks: question.marks,
    options: question.options.map((o) => ({ id: o.id, label: o.label })),
  })),
  answers: [
    { aqId: "aq-1", selectedOptionIds: [MOCK_QUESTIONS[0].options[1].id], textAnswer: "", flagged: false, clientSeq: 1, savedAt: new Date().toISOString() },
    { aqId: "aq-2", selectedOptionIds: [MOCK_QUESTIONS[1].options[0].id, MOCK_QUESTIONS[1].options[3].id], textAnswer: "", flagged: false, clientSeq: 2, savedAt: new Date().toISOString() },
    { aqId: "aq-4", selectedOptionIds: [MOCK_QUESTIONS[3].options[1].id], textAnswer: "", flagged: false, clientSeq: 3, savedAt: new Date().toISOString() },
    { aqId: "aq-5", selectedOptionIds: [MOCK_QUESTIONS[4].options[2].id], textAnswer: "", flagged: false, clientSeq: 4, savedAt: new Date().toISOString() },
    { aqId: "aq-6", selectedOptionIds: [], textAnswer: "", flagged: true, clientSeq: 5, savedAt: new Date().toISOString() },
  ],
  scratchpad: {
    text: "Remember: stack = LIFO, queue = FIFO.\nUndo uses a stack of states.",
    drawing: null,
  },
  announcements: [
    { id: "an-1", message: "You have 45 minutes remaining. Answers save automatically.", createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
  ],
  preferences: prefs,
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: "an-1", message: "You have 45 minutes remaining. Answers save automatically.", createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: "an-2", message: "Question 17 is now worth 5 marks. Please review your answer.", createdAt: new Date(Date.now() - 2 * 60_000).toISOString() },
];

export const MOCK_MONITOR: MonitorView = {
  exam: { id: "exam-dsa", title: "Data Structures & Algorithms", state: "ongoing", endAt: at(0, 10) },
  summary: { enrolled: 48, notStarted: 6, inProgress: 42, submitted: 6, online: 46 },
  attempts: [
    { attemptId: "attempt-1", candidateId: "u-c-1", fullName: "Ayesha Khan", email: "ayesha.khan@example.edu", status: "in_progress", answeredCount: 12, questionCount: 20, startedAt: at(0, 9), endsAt: at(0, 10), lastSeenAt: new Date(Date.now() - 12_000).toISOString(), online: true, incidentCount: 0 },
    { attemptId: "attempt-2", candidateId: "u-c-6", fullName: "Bilal Hussain", email: "bilal.hussain@example.edu", status: "in_progress", answeredCount: 16, questionCount: 20, startedAt: at(0, 9), endsAt: at(0, 10), lastSeenAt: new Date(Date.now() - 20_000).toISOString(), online: true, incidentCount: 1 },
    { attemptId: "attempt-3", candidateId: "u-c-5", fullName: "Sara Ali", email: "sara.ali@example.edu", status: "in_progress", answeredCount: 9, questionCount: 20, startedAt: at(0, 9), endsAt: at(0, 10), lastSeenAt: new Date(Date.now() - 3 * 60_000).toISOString(), online: false, incidentCount: 2 },
    { attemptId: "attempt-4", candidateId: "u-c-2", fullName: "Hamza Ali", email: "hamza.ali@example.edu", status: "submitted", answeredCount: 20, questionCount: 20, startedAt: at(0, 9), endsAt: at(0, 10), lastSeenAt: at(0, 9, 52), online: false, incidentCount: 0 },
  ],
  incidents: [
    { id: "inc-1", attemptId: "attempt-3", candidateName: "Sara Ali", type: "offline", detail: "Connection gap · 09:14", createdAt: new Date(Date.now() - 9 * 60_000).toISOString(), reviewed: false, reviewerNote: null },
    { id: "inc-2", attemptId: "attempt-2", candidateName: "Bilal Hussain", type: "tab_hidden", detail: "Tab switched away for 6 seconds", createdAt: new Date(Date.now() - 14 * 60_000).toISOString(), reviewed: true, reviewerNote: "Reviewed — resumed immediately." },
  ],
  compensations: [
    { id: "comp-1", attemptId: "attempt-3", candidateName: "Sara Ali", gapSec: 134, status: "pending", createdAt: new Date(Date.now() - 9 * 60_000).toISOString(), decidedAt: null },
  ],
};

export const MOCK_CANDIDATE_EXAMS: MyExams = {
  available: [
    {
      examId: "exam-dsa",
      title: "Data Structures & Algorithms",
      instructions: "Complete this examination independently.",
      startAt: at(0, 9),
      endAt: at(0, 10),
      durationMin: 60,
      totalMarks: 40,
      state: "ongoing",
      attempt: null,
      resultPublished: false,
      canStart: true,
      blockedReason: null,
    },
  ],
  upcoming: [
    {
      examId: "exam-db",
      title: "Database Systems",
      instructions: "Answer every question.",
      startAt: at(2, 9),
      endAt: at(2, 10, 30),
      durationMin: 60,
      totalMarks: 40,
      state: "published",
      attempt: null,
      resultPublished: false,
      canStart: false,
      blockedReason: "Opens at 09:00",
    },
  ],
  completed: [
    {
      examId: "exam-dm",
      title: "Discrete Mathematics",
      instructions: "Closed-book examination.",
      startAt: at(-2, 9),
      endAt: at(-2, 10),
      durationMin: 60,
      totalMarks: 40,
      state: "completed",
      attempt: { id: "attempt-dm", status: "graded", endsAt: at(-2, 10), submittedAt: at(-2, 10) },
      resultPublished: true,
      canStart: false,
      blockedReason: "Already submitted",
    },
    {
      examId: "exam-cn",
      title: "Computer Networks",
      instructions: "Closed-book examination.",
      startAt: at(-1, 9),
      endAt: at(-1, 10),
      durationMin: 60,
      totalMarks: 40,
      state: "completed",
      attempt: { id: "attempt-cn", status: "graded", endsAt: at(-1, 10), submittedAt: at(-1, 10) },
      resultPublished: true,
      canStart: false,
      blockedReason: "Already submitted",
    },
  ],
};

export function candidateExam(examId: string): CandidateExam {
  const all = [
    ...MOCK_CANDIDATE_EXAMS.available,
    ...MOCK_CANDIDATE_EXAMS.upcoming,
    ...MOCK_CANDIDATE_EXAMS.completed,
  ];
  return all.find((e) => e.examId === examId) ?? all[0];
}

export const MOCK_CANDIDATE_RESULT: CandidateResult = {
  attemptId: "attempt-dm",
  examTitle: "Discrete Mathematics",
  score: 32,
  totalMarks: 40,
  percentage: 80,
  passed: true,
  submittedAt: at(-2, 10),
  publishedAt: at(-1, 12),
  questions: [
    ["Set intersection", "mcq_single", 2, 2, "{2, 4}", "{2, 4}", "Correct. Full marks."],
    ["Union of two sets", "mcq_single", 2, 2, "{1, 2, 3}", "{1, 2, 3}", "Correct. Full marks."],
    ["Power set size", "mcq_single", 2, 2, "8", "8", "Correct. Full marks."],
    ["Logical implication", "mcq_single", 2, 2, "False", "False", "Correct. Full marks."],
    ["Contrapositive", "mcq_single", 2, 2, "¬q → ¬p", "¬q → ¬p", "Correct. Full marks."],
    ["De Morgan's law", "mcq_single", 2, 0, "¬p ∧ ¬q", "¬p ∨ ¬q", "Review this concept."],
    ["Truth table rows", "mcq_single", 2, 2, "16", "16", "Correct. Full marks."],
    ["Reflexive relation", "mcq_single", 2, 2, "Yes", "Yes", "Correct. Full marks."],
    ["Symmetric relation", "mcq_single", 2, 2, "No", "No", "Correct. Full marks."],
    ["Equivalence class", "mcq_single", 2, 2, "{0, 2, 4}", "{0, 2, 4}", "Correct. Full marks."],
    ["Function injectivity", "mcq_single", 2, 0, "Injective", "Not injective", "Review this concept."],
    ["Counting permutations", "mcq_single", 2, 2, "120", "120", "Correct. Full marks."],
    ["Binomial coefficient", "mcq_single", 2, 2, "10", "10", "Correct. Full marks."],
    ["Pigeonhole principle", "mcq_single", 2, 2, "At least 2", "At least 2", "Correct. Full marks."],
    ["Graph degree sum", "mcq_single", 2, 2, "12", "12", "Correct. Full marks."],
    ["Tree edge count", "mcq_single", 2, 0, "n", "n − 1", "Review this concept."],
    ["Euler circuit", "mcq_single", 2, 2, "All degrees even", "All degrees even", "Correct. Full marks."],
    ["Recurrence solution", "mcq_single", 2, 2, "2ⁿ", "2ⁿ", "Correct. Full marks."],
    ["Proof by induction", "written", 2, 2, "Base case and inductive step shown correctly.", null, "Clear and complete."],
    ["Graph colouring", "written", 2, 0, "Four colours are always sufficient.", null, "Review the bounds for this graph class."],
  ].map((row, i) => ({
    position: i + 1,
    stem: row[0] as string,
    type: row[1] as CandidateResult["questions"][number]["type"],
    marks: row[2] as number,
    marksAwarded: row[3] as number,
    yourAnswer: row[4] as string,
    correctAnswer: row[5] as string | null,
    feedback: row[6] as string,
  })),
};

export const MOCK_VERIFY: VerifyResult = {
  valid: true,
  examTitle: "Discrete Mathematics",
  candidateInitials: "A. K.",
  score: 32,
  totalMarks: 40,
  percentage: 80,
  passed: true,
  issuedAt: at(-1, 12),
};

export const MOCK_INCIDENTS: Incident[] = MOCK_MONITOR.incidents;
export const MOCK_COMPENSATIONS: CompensationRequest[] = MOCK_MONITOR.compensations;

export const DEMO_STUDENT = MOCK_USERS[4];
