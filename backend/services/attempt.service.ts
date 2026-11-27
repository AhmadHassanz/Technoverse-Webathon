// SERVICE: the attempt engine (start, view, submit, finalize, delete sandbox).
// Rules: docs/BACKEND_PLAN.md section 6 ("Building a paper", "Time rules"). The SERVER clock decides.
import { assertOwner } from "@/backend/lib/auth";
import { HttpError } from "@/backend/lib/errors";
import { isUniqueViolation } from "@/backend/lib/http";
import { buildPaper } from "@/backend/lib/paper";
import { GRACE_MS, effectiveEnd, isExpired } from "@/backend/lib/time";
import {
  deleteAttemptRow, findAttempt, findOpenSandboxAttempt, findRealAttempt, finishAttempt, insertAttempt, insertPaper,
  listPaper, type AttemptRecord,
} from "@/backend/data/attempts";
import { getScratchpad, listAnswers } from "@/backend/data/answers";
import { findExam, listPool } from "@/backend/data/exams";
import { isEnrolled } from "@/backend/data/enrollments";
import { insertIncident, listAnnouncements } from "@/backend/data/monitoring";
import { gradeAttempt } from "@/backend/services/grading.service";
import type { AttemptView, Exam, Me, OkResult, StartAttemptResult, SubmitResult } from "@/shared/types";

/**
 * If the attempt is still "in progress" but its deadline + 5 s grace has passed, close it now:
 * status auto_submitted, submitted_at = the DEADLINE (not "now"), then grade it.
 * The update is conditional (only from in_progress), so if two requests race only one wins,
 * and only the winner grades. Called at the start of every attempt endpoint and by the dashboard.
 */
export async function finalizeIfExpired(attempt: AttemptRecord, now: Date = new Date()): Promise<AttemptRecord> {
  if (!isExpired(attempt, now)) return attempt;
  const changed = await finishAttempt(attempt.id, "auto_submitted", effectiveEnd(attempt).toISOString());
  if (changed) await gradeAttempt(attempt.id);
  return (await findAttempt(attempt.id)) ?? attempt;
}

/** Load an attempt the CALLER is taking: 404 unknown, 403 someone else's. Finalizes it if expired. */
export async function loadOwnAttempt(user: Me, attemptId: string, now: Date = new Date()): Promise<AttemptRecord> {
  const attempt = await findAttempt(attemptId);
  if (!attempt) throw new HttpError(404, "Attempt not found");
  if (attempt.candidateId !== user.id) throw new HttpError(403, "This is not your attempt");
  return finalizeIfExpired(attempt, now);
}

/** True while answers may still be saved: in progress and now <= deadline + 5 s grace. */
export function isOpen(attempt: AttemptRecord, now: Date): boolean {
  return attempt.status === "in_progress" && now.getTime() <= effectiveEnd(attempt).getTime() + GRACE_MS;
}

/** 410 when the attempt can no longer be changed (submitted, or time is over). */
export function assertOpen(attempt: AttemptRecord, now: Date) {
  if (!isOpen(attempt, now)) throw new HttpError(410, "This attempt has ended, so it can no longer be changed");
}

// ---------- start ----------

/**
 * POST /api/exams/[id]/attempts
 *  - real attempt: enrolled candidate, published exam, inside the window; resumes an open attempt
 *  - sandbox (preview): exam owner (or admin), any exam state, never counted anywhere
 */
export async function startAttempt(user: Me, examId: string, sandbox: boolean): Promise<StartAttemptResult> {
  const now = new Date(); // ONE clock reading for the whole request
  const found = await findExam(examId);
  if (!found) throw new HttpError(404, "Exam not found");
  const { exam, createdBy } = found;

  if (sandbox) {
    if (user.role === "candidate") throw new HttpError(403, "Only the exam owner can preview this exam");
    assertOwner(user, createdBy);
    const open = await findOpenSandboxAttempt(examId, user.id);
    if (open && (await finalizeIfExpired(open, now)).status === "in_progress") {
      return { attemptId: open.id, resumed: true };
    }
    // A preview is not tied to the exam window: it simply lasts durationMin.
    return createAttempt(user, examId, true, now, new Date(now.getTime() + exam.durationMin * 60_000), exam);
  }

  if (user.role !== "candidate") throw new HttpError(403, "Only candidates can take exams (use preview to try your own exam)");
  if (!(await isEnrolled(examId, user.id))) throw new HttpError(403, "You are not enrolled in this exam");

  // Existing attempt first, so a candidate can always come back to an open attempt.
  const existing = await findRealAttempt(examId, user.id);
  if (existing) {
    const current = await finalizeIfExpired(existing, now);
    if (current.status !== "in_progress") throw new HttpError(409, "You have already submitted this exam");
    await insertIncident(current.id, "resumed", "Candidate re-opened the exam");
    return { attemptId: current.id, resumed: true };
  }

  if (exam.state === "draft" || now < new Date(exam.startAt)) throw new HttpError(410, "This exam is not open yet");
  if (now >= new Date(exam.endAt)) throw new HttpError(410, "This exam has ended");

  // A late starter never gets past the exam window.
  const endsAt = new Date(Math.min(now.getTime() + exam.durationMin * 60_000, new Date(exam.endAt).getTime()));
  return createAttempt(user, examId, false, now, endsAt, exam);
}

async function createAttempt(
  user: Me,
  examId: string,
  isSandbox: boolean,
  now: Date,
  endsAt: Date,
  exam: Pick<Exam, "blueprint" | "shuffleQuestions" | "shuffleOptions">,
): Promise<StartAttemptResult> {
  // Build the paper BEFORE creating the attempt, so a bad pool never leaves an empty attempt behind.
  const paper = buildPaper(await listPool(examId), exam);

  const { id, error } = await insertAttempt({
    examId,
    candidateId: user.id,
    isSandbox,
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
  });
  if (error) {
    // Two "Start" clicks at the same moment: the database's unique index lets only one real attempt in.
    // The loser simply returns the winner's attempt.
    if (!isSandbox && isUniqueViolation(error)) {
      const winner = await findRealAttempt(examId, user.id);
      if (winner) return { attemptId: winner.id, resumed: true };
    }
    throw error;
  }

  try {
    await insertPaper(id!, paper);
  } catch (e) {
    await deleteAttemptRow(id!); // never leave an attempt without questions
    throw e;
  }
  return { attemptId: id!, resumed: false };
}

// ---------- view ----------

/** GET /api/attempts/[id]: everything the workspace needs. A dedicated mapper: correctness is never copied out. */
export async function getAttemptView(user: Me, attemptId: string): Promise<AttemptView> {
  const attempt = await loadOwnAttempt(user, attemptId);
  const [found, paper, answers, scratchpad, announcements] = await Promise.all([
    findExam(attempt.examId),
    listPaper(attempt.id),
    listAnswers(attempt.id),
    getScratchpad(attempt.id),
    listAnnouncements(attempt.examId, 50),
  ]);
  if (!found) throw new HttpError(404, "Exam not found");

  return {
    id: attempt.id,
    examId: attempt.examId,
    examTitle: found.exam.title,
    instructions: found.exam.instructions,
    isSandbox: attempt.isSandbox,
    status: attempt.status,
    startedAt: attempt.startedAt,
    endsAt: effectiveEnd(attempt).toISOString(),
    serverNow: new Date().toISOString(),
    // The marks of THIS paper (for random papers this is what the candidate can actually score).
    totalMarks: Math.round(paper.reduce((sum, q) => sum + Number(q.snapshot.marks), 0) * 100) / 100,
    questions: paper.map((q) => ({
      aqId: q.aqId,
      position: q.position,
      type: q.snapshot.type,
      stem: q.snapshot.stem,
      marks: Number(q.snapshot.marks),
      options: q.snapshot.options.map((o) => ({ id: o.id, label: o.label })), // NO isCorrect
    })),
    answers: answers.map((a) => ({
      aqId: a.aqId,
      selectedOptionIds: a.selectedOptionIds,
      textAnswer: a.textAnswer,
      flagged: a.flagged,
      clientSeq: a.clientSeq,
      savedAt: a.savedAt,
    })),
    scratchpad: { text: scratchpad.text, drawing: scratchpad.drawing },
    announcements,
    preferences: user.preferences,
  };
}

// ---------- submit ----------

/**
 * POST /api/attempts/[id]/submit: idempotent, never an error for "already submitted".
 * Atomic conditional update (only from in_progress). Whoever finishes it, grading runs
 * (grading is idempotent), so every caller returns the same final state.
 */
export async function submitAttempt(user: Me, attemptId: string): Promise<SubmitResult> {
  const now = new Date();
  const attempt = await loadOwnAttempt(user, attemptId, now); // may auto-submit if time is over
  if (attempt.status === "in_progress") await finishAttempt(attempt.id, "submitted", now.toISOString());

  let current = (await findAttempt(attempt.id)) ?? attempt;
  if (current.status === "submitted" || current.status === "auto_submitted") {
    await gradeAttempt(current.id); // no-op result if already graded; also repairs a grading that failed before
    current = (await findAttempt(attempt.id)) ?? current;
  }
  return { status: current.status, submittedAt: current.submittedAt ?? now.toISOString() };
}

// ---------- delete (sandbox reset) ----------

/** DELETE /api/attempts/[id]: the EXAM owner (or admin) resets a SANDBOX attempt. Real attempts: never. */
export async function deleteSandboxAttempt(user: Me, attemptId: string): Promise<OkResult> {
  const attempt = await findAttempt(attemptId);
  if (!attempt) throw new HttpError(404, "Attempt not found");
  const found = await findExam(attempt.examId);
  if (!found) throw new HttpError(404, "Attempt not found");
  assertOwner(user, found.createdBy);
  if (!attempt.isSandbox) throw new HttpError(409, "Only preview (sandbox) attempts can be deleted");
  await deleteAttemptRow(attempt.id); // answers, paper, incidents... are removed by ON DELETE CASCADE
  return { ok: true };
}
