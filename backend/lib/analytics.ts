// PURE analytics rules (docs/BACKEND_PLAN.md section 6 "Analytics formulas").
// No database: the service loads the rows, these functions only do the maths. Imports are types only.
import type { Snapshot } from "@/backend/lib/grading";
import type { Difficulty, ExamStats, PaperFairness, QuestionStat } from "@/shared/types";

/** Fewer observations than this = "not enough data" (same threshold as observedDifficulty in the plan). */
export const MIN_OBSERVATIONS = 3;
const LABEL_DIFFICULTY: Record<Difficulty, number> = { easy: 25, medium: 50, hard: 75 };

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** One question as it appeared in one finished attempt (from the frozen paper + saved answer). */
export type PaperEntry = {
  attemptId: string;
  questionId: string;
  snapshot: Snapshot;
  marksAwarded: number | null; // null = written answer not graded yet
  selectedOptionIds: string[]; // [] when no answer row
  textAnswer: string;
};

// ---------- exam stats + distribution ----------

/** count, average, median, highest, lowest, pass rate, average percentage. All 0 when there are no scores. */
export function buildStats(rows: { score: number; percentage: number }[], passMarks: number): ExamStats {
  if (rows.length === 0) return { attempts: 0, average: 0, median: 0, highest: 0, lowest: 0, passRate: 0, averagePercentage: 0 };
  const scores = rows.map((r) => r.score).sort((a, b) => a - b);
  const mid = Math.floor(scores.length / 2);
  const median = scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
  const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
  return {
    attempts: rows.length,
    average: round2(sum(scores) / scores.length),
    median: round2(median),
    highest: scores[scores.length - 1],
    lowest: scores[0],
    passRate: round2((rows.filter((r) => r.score >= passMarks).length / rows.length) * 100),
    averagePercentage: round2(sum(rows.map((r) => r.percentage)) / rows.length),
  };
}

/** 10 buckets of percentage: "0-9", "10-19", ... "80-89", "90-100" (100% goes in the last one). */
export function buildDistribution(percentages: number[]): { bucket: string; count: number }[] {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ bucket: i === 9 ? "90-100" : `${i * 10}-${i * 10 + 9}`, count: 0 }));
  for (const p of percentages) buckets[Math.min(9, Math.max(0, Math.floor(p / 10)))].count++;
  return buckets;
}

// ---------- per-question statistics ----------

function observedDifficulty(correctPct: number): Difficulty {
  return correctPct >= 70 ? "easy" : correctPct >= 40 ? "medium" : "hard";
}

type Group = { entries: PaperEntry[]; observations: number; correctPct: number };

function groupByQuestion(entries: PaperEntry[]): Map<string, Group> {
  const groups = new Map<string, Group>();
  for (const e of entries) {
    const g = groups.get(e.questionId) ?? { entries: [], observations: 0, correctPct: 0 };
    g.entries.push(e);
    groups.set(e.questionId, g);
  }
  for (const g of groups.values()) {
    if (g.entries[0].snapshot.type === "written") {
      // written: average % of marks over the answers that are already graded
      const graded = g.entries.filter((e) => e.marksAwarded !== null);
      g.observations = graded.length;
      g.correctPct = graded.length ? (graded.reduce((s, e) => s + (e.marksAwarded as number) / e.snapshot.marks, 0) / graded.length) * 100 : 0;
    } else {
      // objective: % of candidates who got FULL marks
      g.observations = g.entries.length;
      const full = g.entries.filter((e) => e.marksAwarded !== null && e.marksAwarded >= e.snapshot.marks - 0.001).length;
      g.correctPct = (full / g.entries.length) * 100;
    }
  }
  return groups;
}

export function buildQuestionStats(entries: PaperEntry[]): QuestionStat[] {
  const stats: QuestionStat[] = [];
  for (const [questionId, g] of groupByQuestion(entries)) {
    const first = g.entries[0].snapshot;
    const timesShown = g.entries.length;
    const skipped = g.entries.filter((e) => e.selectedOptionIds.length === 0 && e.textAnswer.trim() === "").length;

    // Most chosen WRONG option: count every selected option that is not correct in that candidate's snapshot.
    const wrong = new Map<string, number>();
    for (const e of g.entries) {
      for (const id of e.selectedOptionIds) {
        const option = e.snapshot.options.find((o) => o.id === id);
        if (option && !option.isCorrect) wrong.set(option.label, (wrong.get(option.label) ?? 0) + 1);
      }
    }
    const top = [...wrong.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

    const observed = g.observations >= MIN_OBSERVATIONS ? observedDifficulty(g.correctPct) : null;
    stats.push({
      questionId,
      stem: first.stem,
      type: first.type,
      labelledDifficulty: first.difficulty,
      observedDifficulty: observed,
      mismatch: observed !== null && observed !== first.difficulty,
      timesShown,
      correctPct: round2(g.correctPct),
      skippedPct: round2((skipped / timesShown) * 100),
      mostChosenWrong: top ? { label: top[0], pct: round2((top[1] / timesShown) * 100) } : null,
    });
  }
  return stats.sort((a, b) => a.stem.localeCompare(b.stem));
}

// ---------- paper fairness (innovation 5.2) ----------

/**
 * Difficulty of each attempt's paper, 0-100 (higher = harder).
 *   d_q   = 100 - correctPct of the question; with too little data, the label's value (easy 25, medium 50, hard 75)
 *   paper = average of d_q over the paper's questions, weighted by marks
 *   deviationPct = (paper - exam average paper) / exam average * 100, rounded to a whole number
 */
export function paperDifficulties(entries: PaperEntry[]): Map<string, number> {
  const groups = groupByQuestion(entries);
  const dq = (e: PaperEntry) => {
    const g = groups.get(e.questionId)!;
    return g.observations >= MIN_OBSERVATIONS ? 100 - g.correctPct : LABEL_DIFFICULTY[e.snapshot.difficulty];
  };
  const byAttempt = new Map<string, { weighted: number; marks: number }>();
  for (const e of entries) {
    const a = byAttempt.get(e.attemptId) ?? { weighted: 0, marks: 0 };
    a.weighted += dq(e) * e.snapshot.marks;
    a.marks += e.snapshot.marks;
    byAttempt.set(e.attemptId, a);
  }
  const result = new Map<string, number>();
  for (const [id, a] of byAttempt) result.set(id, a.marks > 0 ? round2(a.weighted / a.marks) : 0);
  return result;
}

export function buildFairness(attempts: { attemptId: string; candidateName: string }[], difficulty: Map<string, number>): PaperFairness[] {
  const rows = attempts.filter((a) => difficulty.has(a.attemptId));
  if (rows.length === 0) return [];
  const average = rows.reduce((s, a) => s + (difficulty.get(a.attemptId) as number), 0) / rows.length;
  return rows.map((a) => {
    const paper = difficulty.get(a.attemptId) as number;
    return {
      attemptId: a.attemptId,
      candidateName: a.candidateName,
      paperDifficulty: paper,
      deviationPct: average > 0 ? Math.round(((paper - average) / average) * 100) : 0,
    };
  });
}
