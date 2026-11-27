// TEMPORARY mock data for stub endpoints, so the frontend never waits.
// Every real endpoint replaces its stub in its own stage; delete this file when none are left.
import type {
  CandidateExam, Enrollment, EnrollResult, Exam, ExamDetail, ImportResult, Me, MyExams,
  Preferences, PublishCheck, Question, Topic, User,
} from "@/shared/types";

const preferences: Preferences = { theme: "light", fontScale: "md", navigatorSide: "left", layout: "single" };
const created = "2026-11-27T05:00:00.000Z";

export const mockUser: User = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "examiner@demo.com",
  fullName: "Dr. Ayesha Khan",
  role: "examiner",
  isActive: true,
  createdAt: created,
};

export const mockCandidate: User = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "ali@demo.com",
  fullName: "Ali Raza",
  role: "candidate",
  isActive: true,
  createdAt: created,
};

export const mockMe: Me = { ...mockUser, preferences };

export const mockTopic: Topic = { id: "33333333-3333-4333-8333-333333333333", name: "Networking", questionCount: 3 };

export const mockQuestions: Question[] = [
  {
    id: "44444444-4444-4444-8444-444444444441", topicId: mockTopic.id, topicName: mockTopic.name,
    type: "mcq_single", stem: "Which layer of the OSI model handles routing?", difficulty: "easy",
    marks: 2, multiScheme: "all_or_nothing", negativeMarks: 0.5, createdAt: created,
    options: [
      { id: "55555555-5555-4555-8555-555555555551", label: "Network layer", isCorrect: true },
      { id: "55555555-5555-4555-8555-555555555552", label: "Transport layer", isCorrect: false },
      { id: "55555555-5555-4555-8555-555555555553", label: "Data link layer", isCorrect: false },
    ],
  },
  {
    id: "44444444-4444-4444-8444-444444444442", topicId: mockTopic.id, topicName: mockTopic.name,
    type: "mcq_multi", stem: "Select all protocols that work at the transport layer.", difficulty: "medium",
    marks: 4, multiScheme: "partial", negativeMarks: 0, createdAt: created,
    options: [
      { id: "55555555-5555-4555-8555-555555555561", label: "TCP", isCorrect: true },
      { id: "55555555-5555-4555-8555-555555555562", label: "UDP", isCorrect: true },
      { id: "55555555-5555-4555-8555-555555555563", label: "HTTP", isCorrect: false },
      { id: "55555555-5555-4555-8555-555555555564", label: "IP", isCorrect: false },
    ],
  },
  {
    id: "44444444-4444-4444-8444-444444444443", topicId: mockTopic.id, topicName: mockTopic.name,
    type: "written", stem: "Explain the difference between TCP and UDP in your own words.", difficulty: "hard",
    marks: 10, multiScheme: "all_or_nothing", negativeMarks: 0, createdAt: created, options: [],
  },
];

export const mockExam: Exam = {
  id: "66666666-6666-4666-8666-666666666666",
  title: "Networking Midterm",
  instructions: "Answer all questions. You cannot return after submitting.",
  startAt: "2026-12-01T09:00:00.000Z",
  endAt: "2026-12-01T11:00:00.000Z",
  durationMin: 60,
  totalMarks: 16,
  passMarks: 8,
  shuffleQuestions: true,
  shuffleOptions: true,
  blueprint: null,
  state: "draft",
  resultsPublishedAt: null,
  questionCount: 3,
  enrolledCount: 2,
  attemptCount: 0,
  createdAt: created,
};

export const mockExamDetail: ExamDetail = { ...mockExam, questions: mockQuestions };

export const mockPublishCheck: PublishCheck = {
  canPublish: false,
  problems: ["No candidates are enrolled yet"],
  summary: { poolSize: 3, paperQuestionCount: 3, paperMarks: 16, enrolledCount: 0 },
};

export const mockEnrollments: Enrollment[] = [
  { candidateId: mockCandidate.id, fullName: mockCandidate.fullName, email: mockCandidate.email,
    enrolledAt: created, attemptStatus: "not_started", score: null },
];

export const mockEnrollResult: EnrollResult = { enrolled: 1, alreadyEnrolled: 0, notFound: [] };

export const mockImportResult: ImportResult = { totalRows: 3, validRows: 3, created: 0, skipped: 0, errors: [] };

const candidateExam: CandidateExam = {
  examId: mockExam.id, title: mockExam.title, instructions: mockExam.instructions,
  startAt: mockExam.startAt, endAt: mockExam.endAt, durationMin: mockExam.durationMin,
  totalMarks: mockExam.totalMarks, state: "ongoing", attempt: null, resultPublished: false,
  canStart: true, blockedReason: null,
};

export const mockMyExams: MyExams = {
  available: [candidateExam],
  upcoming: [{ ...candidateExam, title: "Databases Quiz", state: "published", canStart: false,
    blockedReason: "Opens at 2:00 PM" }],
  completed: [{ ...candidateExam, title: "OOP Basics", state: "completed", canStart: false,
    blockedReason: "Already submitted", resultPublished: true,
    attempt: { id: "77777777-7777-4777-8777-777777777777", status: "graded", endsAt: created, submittedAt: created } }],
};
