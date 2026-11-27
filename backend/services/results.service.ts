// SERVICE: manual grading of written answers, results, publishing, analytics, and the candidate's own result.
// Everything is computed from the FROZEN snapshots + saved answers (never the live question tables)
// and from REAL attempts only (sandbox previews are excluded by the data layer).
import { assertOwner } from "@/backend/lib/auth";
import { HttpError } from "@/backend/lib/errors";
import {
  buildDistribution, buildFairness, buildQuestionStats, buildStats, paperDifficulties, round2, type PaperEntry,
} from "@/backend/lib/analytics";
import {
  findAttempt, findPaperQuestionById, findRealAttempt, listPaper, listRealAttemptsOfExam, saveGrade, setPaperDifficulty,
  type ExamAttempt,
} from "@/backend/data/attempts";
import { listAnswers } from "@/backend/data/answers";
import { isEnrolled } from "@/backend/data/enrollments";
import { findExam } from "@/backend/data/exams";
import { listExamAnswers, listExamPapers, markResultsPublished, type ExamPaperRow } from "@/backend/data/exam-papers";
import { findProfile } from "@/backend/data/users";
import { finalizeIfExpired, listFinalizedAttempts } from "@/backend/services/attempt.service";
import { loadOwnedExam } from "@/backend/services/exams.service";
import { gradeAttempt } from "@/backend/services/grading.service";
import type {
  CandidateResult, Exam, ExamAnalytics, ExamResults, GradeInput, GradingItem, Me, ResultRow,
} from "@/shared/types";

const FINISHED = ["submitted", "auto_submitted", "graded"];

// ---------- shared loading ----------

type Report = {
  attempts: ExamAttempt[]; // every real attempt, after closing expired ones
  entries: PaperEntry[]; // one per question of every FINISHED attempt
  paperMarks: Map<string, number>; // attemptId -> marks of that candidate's paper
  difficulty: Map<string, number>; // attemptId -> paper difficulty 0-100
};

async function loadReport(examId: string): Promise<Report> {
  const attempts = await listFinalizedAttempts(examId);
  const [papers, answers] = await Promise.all([listExamPapers(examId, FINISHED), listExamAnswers(examId)]);
  const answerOf = new Map(answers.map((a) => [a.aqId, a]));
  const paperMarks = new Map<string, number>();
  const entries: PaperEntry[] = papers.map((p) => {
    paperMarks.set(p.attemptId, (paperMarks.get(p.attemptId) ?? 0) + Number(p.snapshot.marks));
    return {
      attemptId: p.attemptId,
      questionId: p.questionId,
      snapshot: p.snapshot,
      marksAwarded: p.marksAwarded,
      selectedOptionIds: answerOf.get(p.aqId)?.selectedOptionIds ?? [],
      textAnswer: answerOf.get(p.aqId)?.textAnswer ?? "",
    };
  });
  for (const [id, marks] of paperMarks) paperMarks.set(id, round2(marks));
  return { attempts, entries, paperMarks, difficulty: paperDifficulties(entries) };
}

function scoredRows(report: Report, exam: Exam) {
  return report.attempts
    .filter((a) => FINISHED.includes(a.status) && a.score !== null)
    .map((a) => {
      const total = report.paperMarks.get(a.id) ?? exam.totalMarks;
      return { attempt: a, score: a.score as number, percentage: total > 0 ? round2(((a.score as number) / total) * 100) : 0 };
    });
}

// ---------- grading queue ----------

function toGradingItem(p: ExamPaperRow, candidateName: string, textAnswer: string): GradingItem {
  return {
    aqId: p.aqId,
    attemptId: p.attemptId,
    candidateName,
    position: p.position,
    stem: p.snapshot.stem,
    marks: Number(p.snapshot.marks),
    textAnswer,
    marksAwarded: p.marksAwarded,
    feedback: p.feedback,
  };
}

/** GET /api/exams/[id]/grading?status=pending|all: written answers of finished attempts. */
export async function getGradingQueue(user: Me, examId: string, status: "pending" | "all"): Promise<GradingItem[]> {
  const [, attempts] = await Promise.all([
    loadOwnedExam(user, examId), // 404 / 403
    listFinalizedAttempts(examId), // expired attempts become gradable
  ]);
  const names = new Map(attempts.map((a) => [a.id, a.fullName]));
  const [papers, answers] = await Promise.all([listExamPapers(examId, FINISHED), listExamAnswers(examId)]);
  const text = new Map(answers.map((a) => [a.aqId, a.textAnswer]));
  return papers
    .filter((p) => p.snapshot.type === "written" && (status === "all" || p.marksAwarded === null))
    .map((p) => toGradingItem(p, names.get(p.attemptId) ?? "", text.get(p.aqId) ?? ""))
    .sort((x, y) => x.candidateName.localeCompare(y.candidateName) || x.position - y.position);
}

/**
 * PATCH /api/attempt-questions/[aqId]/grade. 0 <= marks <= the question's marks.
 * After saving, the attempt's score is recomputed; when no written answer is left ungraded it becomes `graded`.
 * Grades can change until results are published.
 */
export async function gradeAnswer(user: Me, aqId: string, input: GradeInput): Promise<GradingItem> {
  const question = await findPaperQuestionById(aqId);
  if (!question) throw new HttpError(404, "Answer not found");
  const attempt = await findAttempt(question.attemptId);
  const found = attempt ? await findExam(attempt.examId) : null;
  if (!attempt || !found || attempt.isSandbox) throw new HttpError(404, "Answer not found");
  assertOwner(user, found.createdBy);

  if (question.snapshot.type !== "written") throw new HttpError(409, "Only written answers are graded by hand");
  if (found.exam.resultsPublishedAt) throw new HttpError(409, "Results are already published, so grades can't be changed");
  if ((await finalizeIfExpired(attempt)).status === "in_progress") throw new HttpError(409, "The candidate is still taking the exam");

  const max = Number(question.snapshot.marks);
  if (input.marksAwarded > max) {
    const message = `Marks can't be more than ${max}`;
    throw new HttpError(400, message, { marksAwarded: message });
  }

  const feedback = input.feedback === undefined ? question.feedback : input.feedback === "" ? null : input.feedback;
  await saveGrade(aqId, input.marksAwarded, feedback, user.id);
  await gradeAttempt(attempt.id); // recompute score + status

  const [fresh, profile, answers] = await Promise.all([findPaperQuestionById(aqId), findProfile(attempt.candidateId), listAnswers(attempt.id)]);
  const row = fresh ?? question;
  return toGradingItem(
    { aqId, attemptId: attempt.id, questionId: row.questionId, position: row.position, snapshot: row.snapshot, marksAwarded: row.marksAwarded, feedback: row.feedback },
    profile?.full_name ?? "",
    answers.find((a) => a.aqId === aqId)?.textAnswer ?? "",
  );
}

// ---------- results + publish ----------

/** GET /api/exams/[id]/results */
export async function getResults(user: Me, examId: string): Promise<ExamResults> {
  // The owner check and the data load do not depend on each other, so they run together (one round trip, not two).
  const [exam, report] = await Promise.all([loadOwnedExam(user, examId), loadReport(examId)]);
  const scored = scoredRows(report, exam);
  const percentageOf = new Map(scored.map((s) => [s.attempt.id, s.percentage]));

  const rows: ResultRow[] = report.attempts
    .map((a): ResultRow => ({
      attemptId: a.id,
      candidateName: a.fullName,
      email: a.email,
      status: a.status,
      score: a.score,
      percentage: percentageOf.get(a.id) ?? null,
      passed: a.score === null ? null : a.score >= exam.passMarks,
      submittedAt: a.submittedAt,
      paperDifficulty: a.paperDifficulty ?? report.difficulty.get(a.id) ?? null,
    }))
    .sort((x, y) => x.candidateName.localeCompare(y.candidateName));

  return { exam, stats: buildStats(scored, exam.passMarks), rows };
}

/**
 * POST /api/exams/[id]/results/publish.
 * Allowed only after the exam has ended, when no attempt is in progress and no written answer is ungraded.
 * Stores each paper's difficulty (innovation 5.2) and from then on grades are locked.
 */
export async function publishResults(user: Me, examId: string): Promise<Exam> {
  const exam = await loadOwnedExam(user, examId);
  if (exam.resultsPublishedAt) throw new HttpError(409, "Results are already published");
  if (exam.state !== "completed") throw new HttpError(409, "Results can be published only after the exam has ended");

  const closed = await listFinalizedAttempts(examId);
  // Repair: grading is idempotent, so re-run it for finished attempts that never reached "graded".
  await Promise.all(closed.filter((a) => a.status === "submitted" || a.status === "auto_submitted").map((a) => gradeAttempt(a.id)));
  const attempts = await listRealAttemptsOfExam(examId);

  const running = attempts.filter((a) => a.status === "in_progress").length;
  if (running) throw new HttpError(409, `${running} attempt${running === 1 ? " is" : "s are"} still in progress`);
  const ungraded = attempts.filter((a) => a.status !== "graded").length;
  if (ungraded) throw new HttpError(409, `${ungraded} attempt${ungraded === 1 ? " has" : "s have"} written answers that still need grading`);

  const report = await loadReport(examId);
  await Promise.all([...report.difficulty].map(([attemptId, value]) => setPaperDifficulty(attemptId, value)));
  if (!(await markResultsPublished(examId, new Date().toISOString()))) throw new HttpError(409, "Results are already published");
  return loadOwnedExam(user, examId);
}

// ---------- analytics ----------

/** GET /api/exams/[id]/analytics (real, finished attempts only). */
export async function getAnalytics(user: Me, examId: string): Promise<ExamAnalytics> {
  // The owner check and the data load do not depend on each other, so they run together (one round trip, not two).
  const [exam, report] = await Promise.all([loadOwnedExam(user, examId), loadReport(examId)]);
  const scored = scoredRows(report, exam);
  const finished = report.attempts.filter((a) => FINISHED.includes(a.status));
  return {
    stats: buildStats(scored, exam.passMarks),
    distribution: buildDistribution(scored.map((s) => s.percentage)),
    questions: buildQuestionStats(report.entries),
    fairness: buildFairness(finished.map((a) => ({ attemptId: a.id, candidateName: a.fullName })), report.difficulty),
  };
}

// ---------- the candidate's own result ----------

/** GET /api/me/results/[examId]: only after the examiner published, only your own. */
export async function getMyResult(user: Me, examId: string): Promise<CandidateResult> {
  const found = await findExam(examId);
  if (!found) throw new HttpError(404, "Exam not found");
  if (!found.exam.resultsPublishedAt) throw new HttpError(403, "Results are not published yet");

  const attempt = await findRealAttempt(examId, user.id);
  if (!attempt) {
    if (!(await isEnrolled(examId, user.id))) throw new HttpError(403, "You don't have access to this");
    throw new HttpError(404, "You did not take this exam");
  }
  const current = await finalizeIfExpired(attempt);
  if (current.status !== "graded" || current.score === null) throw new HttpError(409, "Your result is not ready yet");

  const [paper, answers] = await Promise.all([listPaper(current.id), listAnswers(current.id)]);
  const answerOf = new Map(answers.map((a) => [a.aqId, a]));
  const totalMarks = round2(paper.reduce((sum, q) => sum + Number(q.snapshot.marks), 0));

  return {
    attemptId: current.id,
    examTitle: found.exam.title,
    score: current.score,
    totalMarks,
    percentage: totalMarks > 0 ? round2((current.score / totalMarks) * 100) : 0,
    passed: current.score >= found.exam.passMarks,
    submittedAt: current.submittedAt ?? current.endsAt,
    publishedAt: found.exam.resultsPublishedAt,
    // Correct answers are shown only now, after publishing (ambiguity 11).
    questions: paper.map((q) => {
      const a = answerOf.get(q.aqId);
      const labels = (ids: string[]) => q.snapshot.options.filter((o) => ids.includes(o.id)).map((o) => o.label).join(", ");
      const written = q.snapshot.type === "written";
      return {
        position: q.position,
        stem: q.snapshot.stem,
        type: q.snapshot.type,
        marks: Number(q.snapshot.marks),
        marksAwarded: q.marksAwarded ?? 0,
        yourAnswer: written ? (a?.textAnswer ?? "") : labels(a?.selectedOptionIds ?? []),
        correctAnswer: written ? null : labels(q.snapshot.options.filter((o) => o.isCorrect).map((o) => o.id)),
        feedback: q.feedback,
      };
    }),
  };
}
