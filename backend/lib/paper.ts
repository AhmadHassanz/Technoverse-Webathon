// Builds ONE candidate's paper from the exam's question pool (docs/BACKEND_PLAN.md section 6 "Building a paper").
// No database here: it gets the pool and the exam settings, and returns the frozen rows to insert.
import { HttpError } from "@/backend/lib/errors";
import { sample, shuffle } from "@/backend/lib/shuffle";
import type { Snapshot } from "@/backend/lib/grading";
import type { Blueprint, Difficulty, Question } from "@/shared/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export type PaperRow = { questionId: string; position: number; snapshot: Snapshot };

export function buildPaper(
  pool: Question[], // in pool position order
  settings: { blueprint: Blueprint | null; shuffleQuestions: boolean; shuffleOptions: boolean },
): PaperRow[] {
  if (pool.length === 0) throw new HttpError(409, "This exam has no questions yet");

  // 1. Which questions: the whole pool, or a random sample per difficulty (the blueprint).
  let chosen: Question[];
  const bp = settings.blueprint;
  if (!bp) {
    chosen = [...pool];
  } else {
    chosen = [];
    for (const d of DIFFICULTIES) {
      const group = pool.filter((q) => q.difficulty === d);
      if (group.length < bp[d]) {
        throw new HttpError(409, `The question pool no longer has ${bp[d]} ${d} questions for the blueprint`);
      }
      chosen.push(...sample(group, bp[d]));
    }
  }

  // 2. Order: random, or the examiner's pool order.
  if (settings.shuffleQuestions) {
    chosen = shuffle(chosen);
  } else {
    const index = new Map(pool.map((q, i) => [q.id, i]));
    chosen.sort((a, b) => index.get(a.id)! - index.get(b.id)!);
  }

  // 3. Freeze each question (with its options in their final order) into a snapshot.
  return chosen.map((q, i) => ({
    questionId: q.id,
    position: i + 1, // 1-based
    snapshot: {
      type: q.type,
      stem: q.stem,
      marks: q.marks,
      difficulty: q.difficulty,
      multiScheme: q.multiScheme,
      negativeMarks: q.negativeMarks,
      options: (settings.shuffleOptions ? shuffle(q.options) : q.options).map((o) => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
      })),
    },
  }));
}
