// TEMPORARY mock data for Stage 4 stub endpoints, so the frontend never waits.
// Every real endpoint replaces its stub in its own stage; delete this file when none are left.
import type {
  Announcement, CandidateResult, CompensationRequest, Exam, ExamAnalytics, ExamResults, ExamStats, GradingItem,
  Incident, MonitorView, VerifyResult,
} from "@/shared/types";

const examId = "66666666-6666-4666-8666-666666666666";
const attempt = (n: number) => `88888888-8888-4888-8888-88888888888${n}`;
const t = (min: number) => new Date(Date.UTC(2026, 11, 1, 9, min)).toISOString(); // 1 Dec 2026, 09:mm UTC

export const mockExam: Exam = {
  id: examId,
  title: "Networking Midterm",
  instructions: "Answer all questions. You cannot return after submitting.",
  startAt: t(0),
  endAt: "2026-12-01T11:00:00.000Z",
  durationMin: 60,
  totalMarks: 16,
  passMarks: 8,
  shuffleQuestions: true,
  shuffleOptions: true,
  blueprint: null,
  state: "completed",
  resultsPublishedAt: null,
  questionCount: 3,
  enrolledCount: 3,
  attemptCount: 3,
  createdAt: "2026-11-27T05:00:00.000Z",
};

export const mockAnnouncements: Announcement[] = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", message: "Question 2: 'transport layer' means OSI layer 4.", createdAt: t(20) },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", message: "The exam has started. Good luck!", createdAt: t(1) },
];

export const mockIncident: Incident = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  attemptId: attempt(1),
  candidateName: "Ali Raza",
  type: "tab_hidden",
  detail: "Switched to another tab",
  createdAt: t(12),
  reviewed: false,
  reviewerNote: null,
};

export const mockCompensation: CompensationRequest = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
  attemptId: attempt(2),
  candidateName: "Sara Ahmed",
  gapSec: 95,
  status: "pending",
  createdAt: t(25),
  decidedAt: null,
};

export const mockMonitor: MonitorView = {
  exam: { id: examId, title: mockExam.title, state: "ongoing", endAt: mockExam.endAt },
  summary: { enrolled: 4, notStarted: 1, inProgress: 2, submitted: 1, online: 1 },
  attempts: [
    { attemptId: attempt(1), candidateId: "22222222-2222-4222-8222-222222222221", fullName: "Ali Raza", email: "ali@demo.com",
      status: "in_progress", answeredCount: 2, questionCount: 3, startedAt: t(2), endsAt: t(62), lastSeenAt: t(30), online: true, incidentCount: 1 },
    { attemptId: attempt(2), candidateId: "22222222-2222-4222-8222-222222222222", fullName: "Sara Ahmed", email: "sara@demo.com",
      status: "in_progress", answeredCount: 1, questionCount: 3, startedAt: t(3), endsAt: t(63), lastSeenAt: t(24), online: false, incidentCount: 1 },
    { attemptId: attempt(3), candidateId: "22222222-2222-4222-8222-222222222223", fullName: "Hamza Malik", email: "hamza@demo.com",
      status: "submitted", answeredCount: 3, questionCount: 3, startedAt: t(1), endsAt: t(61), lastSeenAt: t(28), online: false, incidentCount: 0 },
  ],
  incidents: [mockIncident, { ...mockIncident, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2", attemptId: attempt(2), candidateName: "Sara Ahmed",
    type: "offline", detail: "No connection for about 95 s", createdAt: t(25) }],
  compensations: [mockCompensation],
};

export const mockGradingItems: GradingItem[] = [
  { aqId: "99999999-9999-4999-8999-999999999991", attemptId: attempt(1), candidateName: "Ali Raza", position: 3,
    stem: "Explain the difference between TCP and UDP in your own words.", marks: 10,
    textAnswer: "TCP is connection-oriented and reliable; UDP is connectionless and faster.", marksAwarded: null, feedback: null },
  { aqId: "99999999-9999-4999-8999-999999999992", attemptId: attempt(3), candidateName: "Hamza Malik", position: 1,
    stem: "Explain the difference between TCP and UDP in your own words.", marks: 10,
    textAnswer: "TCP checks delivery, UDP does not.", marksAwarded: 6, feedback: "Mention ordering and handshakes." },
];

const stats: ExamStats = { attempts: 3, average: 10.33, median: 11, highest: 14, lowest: 6, passRate: 66.67, averagePercentage: 64.58 };

export const mockResults: ExamResults = {
  exam: mockExam,
  stats,
  rows: [
    { attemptId: attempt(1), candidateName: "Ali Raza", email: "ali@demo.com", status: "graded", score: 14, percentage: 87.5,
      passed: true, submittedAt: t(55), paperDifficulty: 48.2 },
    { attemptId: attempt(2), candidateName: "Sara Ahmed", email: "sara@demo.com", status: "graded", score: 11, percentage: 68.75,
      passed: true, submittedAt: t(58), paperDifficulty: 51.0 },
    { attemptId: attempt(3), candidateName: "Hamza Malik", email: "hamza@demo.com", status: "graded", score: 6, percentage: 37.5,
      passed: false, submittedAt: t(50), paperDifficulty: 50.4 },
  ],
};

export const mockAnalytics: ExamAnalytics = {
  stats,
  distribution: ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-100"].map((bucket) => ({
    bucket,
    count: bucket === "30-39" || bucket === "60-69" || bucket === "80-89" ? 1 : 0,
  })),
  questions: [
    { questionId: "44444444-4444-4444-8444-444444444441", stem: "Which layer of the OSI model handles routing?", type: "mcq_single",
      labelledDifficulty: "easy", observedDifficulty: "easy", mismatch: false, timesShown: 3, correctPct: 100, skippedPct: 0, mostChosenWrong: null },
    { questionId: "44444444-4444-4444-8444-444444444442", stem: "Select all protocols that work at the transport layer.", type: "mcq_multi",
      labelledDifficulty: "medium", observedDifficulty: "hard", mismatch: true, timesShown: 3, correctPct: 33.33, skippedPct: 0,
      mostChosenWrong: { label: "IP", pct: 66.67 } },
    { questionId: "44444444-4444-4444-8444-444444444443", stem: "Explain the difference between TCP and UDP in your own words.", type: "written",
      labelledDifficulty: "hard", observedDifficulty: "medium", mismatch: true, timesShown: 3, correctPct: 56.67, skippedPct: 0, mostChosenWrong: null },
  ],
  fairness: [
    { attemptId: attempt(1), candidateName: "Ali Raza", paperDifficulty: 48.2, deviationPct: -3 },
    { attemptId: attempt(2), candidateName: "Sara Ahmed", paperDifficulty: 51.0, deviationPct: 2 },
    { attemptId: attempt(3), candidateName: "Hamza Malik", paperDifficulty: 50.4, deviationPct: 1 },
  ],
};

export const mockCandidateResult: CandidateResult = {
  attemptId: attempt(1),
  examTitle: mockExam.title,
  score: 14,
  totalMarks: 16,
  percentage: 87.5,
  passed: true,
  submittedAt: t(55),
  publishedAt: "2026-12-02T10:00:00.000Z",
  questions: [
    { position: 1, stem: "Which layer of the OSI model handles routing?", type: "mcq_single", marks: 2, marksAwarded: 2,
      yourAnswer: "Network layer", correctAnswer: "Network layer", feedback: null },
    { position: 2, stem: "Select all protocols that work at the transport layer.", type: "mcq_multi", marks: 4, marksAwarded: 4,
      yourAnswer: "TCP, UDP", correctAnswer: "TCP, UDP", feedback: null },
    { position: 3, stem: "Explain the difference between TCP and UDP in your own words.", type: "written", marks: 10, marksAwarded: 8,
      yourAnswer: "TCP is connection-oriented and reliable; UDP is connectionless and faster.", correctAnswer: null, feedback: "Good, add ordering." },
  ],
};

export const mockVerify: VerifyResult = {
  valid: true, examTitle: mockExam.title, candidateInitials: "A. R.", score: 14, totalMarks: 16, percentage: 87.5, passed: true,
  issuedAt: "2026-12-02T10:05:00.000Z",
};
