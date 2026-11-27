// SERVICE: applies the pure grading rules (backend/lib/grading.ts) to a finished attempt.
// Reads ONLY the attempt's frozen snapshot + saved answers, never the live question tables.
// Idempotent: running it twice gives the same marks, so it is safe on every submit / auto-submit path.
import { attemptScore, gradeQuestion } from "@/backend/lib/grading";
import { findAttempt, listPaper, setGraded, setObjectiveMarks, type PaperQuestion } from "@/backend/data/attempts";
import { listAnswers } from "@/backend/data/answers";

export async function gradeAttempt(attemptId: string): Promise<void> {
  const attempt = await findAttempt(attemptId);
  if (!attempt || attempt.status === "in_progress") return; // never grade an open attempt

  const [paper, answers] = await Promise.all([listPaper(attemptId), listAnswers(attemptId)]);
  const selected = new Map(answers.map((a) => [a.aqId, a.selectedOptionIds]));

  const objective: { question: PaperQuestion; marksAwarded: number }[] = [];
  const allMarks: (number | null)[] = [];
  for (const q of paper) {
    const marks = gradeQuestion(q.snapshot, selected.get(q.aqId) ?? []); // no answer row = nothing selected
    if (marks === null) {
      allMarks.push(q.marksAwarded); // written: keep the examiner's grade (or null = not graded yet)
    } else {
      objective.push({ question: q, marksAwarded: marks });
      allMarks.push(marks);
    }
  }

  await setObjectiveMarks(attemptId, objective);

  // Every question has marks -> final score (floored at 0) and status "graded".
  // Otherwise (written answers waiting for the examiner) the score stays null.
  const score = attemptScore(allMarks);
  if (score !== null) await setGraded(attemptId, score);
}
