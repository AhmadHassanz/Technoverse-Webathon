// PURE grading rules (docs/BACKEND_PLAN.md section 6 "Grading").
// No database, no imports except types: given a frozen question snapshot and what the candidate
// selected, return the marks. This makes it easy to unit-test and to explain.
import type { Difficulty, MultiScheme, QuestionType } from "@/shared/types";

/** One option inside the frozen paper (already in the order the candidate saw). */
export type SnapshotOption = { id: string; label: string; isCorrect: boolean };

/** What attempt_questions.snapshot holds: the question exactly as it was when the attempt started. */
export type Snapshot = {
  type: QuestionType;
  stem: string;
  marks: number;
  difficulty: Difficulty;
  multiScheme: MultiScheme;
  negativeMarks: number;
  options: SnapshotOption[];
};

/** Round to 2 decimals, half away from zero, and never return -0. */
export function round2(n: number): number {
  const r = (Math.sign(n) * Math.round(Math.abs(n) * 100 + 1e-9)) / 100;
  return r === 0 ? 0 : r;
}

/**
 * Marks for ONE question.
 * Returns null for written questions (the examiner grades those later).
 * `selected` = option ids the candidate picked ([] or no answer row = nothing selected = 0 marks).
 */
export function gradeQuestion(q: Snapshot, selected: readonly string[]): number | null {
  if (q.type === "written") return null;

  const picked = new Set(selected);
  if (picked.size === 0) return 0; // unanswered: no marks, no penalty

  const correct = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
  const penalty = round2(-q.negativeMarks);

  if (q.type === "mcq_single") {
    const [only] = picked;
    return picked.size === 1 && correct.has(only) ? round2(q.marks) : penalty;
  }

  // mcq_multi
  if (q.multiScheme === "all_or_nothing") {
    const same = picked.size === correct.size && [...picked].every((id) => correct.has(id));
    return same ? round2(q.marks) : penalty;
  }

  // mcq_multi + partial: wrong picks cancel right picks, never below 0, no negative marking.
  // Rule from the plan, applied literally: selecting EVERY option scores 0 (stops "tick everything").
  if (q.options.length > 0 && q.options.every((o) => picked.has(o.id))) return 0;
  if (correct.size === 0) return 0;
  let right = 0;
  let wrong = 0;
  for (const id of picked) {
    if (correct.has(id)) right++;
    else wrong++;
  }
  return round2(q.marks * Math.max(0, (right - wrong) / correct.size));
}

/**
 * Attempt score = sum of all question marks, floored at 0.
 * null while any question (a written one) is still ungraded.
 */
export function attemptScore(marks: readonly (number | null)[]): number | null {
  if (marks.some((m) => m === null)) return null;
  const sum = (marks as number[]).reduce((s, m) => s + m, 0);
  return Math.max(0, round2(sum));
}
