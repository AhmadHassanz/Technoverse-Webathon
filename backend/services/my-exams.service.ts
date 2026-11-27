// SERVICE layer for the candidate dashboard: sorts the candidate's exams into 3 buckets.
import { listEnrolledExams, type EnrolledExam } from "@/backend/data/enrollments";
import { realAttemptsByExam, type AttemptSummary } from "@/backend/data/attempts";
import { effectiveEnd } from "@/backend/lib/time";
import { finalizeIfExpired } from "@/backend/services/attempt.service";
import type { CandidateExam, Me, MyExams } from "@/shared/types";

const FINISHED = ["submitted", "auto_submitted", "graded"];

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

function toCandidateExam(e: EnrolledExam, a: AttemptSummary | undefined, canStart: boolean, blockedReason: string | null): CandidateExam {
  return {
    examId: e.examId,
    title: e.title,
    instructions: e.instructions,
    startAt: e.startAt,
    endAt: e.endAt,
    durationMin: e.durationMin,
    totalMarks: e.totalMarks,
    state: e.state,
    attempt: a
      ? { id: a.id, status: a.status, endsAt: effectiveEnd(a).toISOString(), submittedAt: a.submittedAt }
      : null,
    resultPublished: e.resultPublished,
    canStart,
    blockedReason,
  };
}

/**
 * Rules (docs/BACKEND_PLAN.md section 6):
 *  completed = my real attempt is finished, or the exam is over
 *  available = exam is ongoing and I have no finished attempt (button says Continue if one is in progress)
 *  upcoming  = published but not started yet (cannot start)
 */
export async function getMyExams(user: Me): Promise<MyExams> {
  const exams = await listEnrolledExams(user.id);
  const attempts = await realAttemptsByExam(user.id, exams.map((e) => e.examId));
  // Close any attempt whose time ran out, so "completed" and attempt.status are right.
  const now = new Date();
  await Promise.all(
    [...attempts.values()].map(async (a) => attempts.set(a.examId, await finalizeIfExpired(a, now))),
  );
  const result: MyExams = { available: [], upcoming: [], completed: [] };

  for (const e of exams) {
    const a = attempts.get(e.examId);
    const finished = a !== undefined && FINISHED.includes(a.status);
    if (finished) {
      result.completed.push(toCandidateExam(e, a, false, "Already submitted"));
    } else if (e.state === "completed") {
      result.completed.push(toCandidateExam(e, a, false, a ? "Time is over" : "You did not take this exam"));
    } else if (e.state === "ongoing") {
      result.available.push(toCandidateExam(e, a, true, null));
    } else {
      result.upcoming.push(toCandidateExam(e, a, false, `Opens at ${when(e.startAt)}`));
    }
  }

  const byStart = (x: CandidateExam, y: CandidateExam) => x.startAt.localeCompare(y.startAt);
  result.available.sort(byStart);
  result.upcoming.sort(byStart);
  result.completed.sort((x, y) => y.endAt.localeCompare(x.endAt));
  return result;
}
