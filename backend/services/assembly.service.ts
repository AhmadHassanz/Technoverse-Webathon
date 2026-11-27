// SERVICE layer for exam assembly: question pool + blueprint, publish-check, publish, unpublish.
import { HttpError } from "@/backend/lib/errors";
import { listPool, replacePool, setBlueprint, setStatus } from "@/backend/data/exams";
import { listQuestionsByIds } from "@/backend/data/questions";
import { loadOwnedExam } from "@/backend/services/exams.service";
import type { Blueprint, Difficulty, Exam, ExamDetail, ExamQuestionsInput, Me, PublishCheck, Question } from "@/shared/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * PUT: replace the pool (order = array order) and the blueprint. Draft only.
 * Structural mistakes are rejected here (unknown questions, asking for more questions than the pool has).
 * "Marks add up" problems are NOT rejected here: they show up in publish-check so the examiner can
 * keep working on a draft.
 */
export async function setExamQuestions(user: Me, examId: string, input: ExamQuestionsInput): Promise<ExamDetail> {
  const exam = await loadOwnedExam(user, examId);
  if (exam.state !== "draft") throw new HttpError(409, "Only draft exams can be edited");

  const found = await listQuestionsByIds(input.questionIds);
  const allowed = found.filter((f) => user.role === "admin" || f.createdBy === user.id);
  if (allowed.length !== input.questionIds.length) {
    throw new HttpError(400, "Some questions were not found", { questionIds: "Some questions were not found or are not yours" });
  }

  if (input.blueprint) {
    const bp = input.blueprint;
    const have = countByDifficulty(allowed.map((f) => f.question));
    const short = DIFFICULTIES.filter((d) => bp[d] > have[d]);
    if (short.length) {
      const text = short.map((d) => `${bp[d]} ${d} (pool has ${have[d]})`).join(", ");
      throw new HttpError(400, "The pool does not have enough questions for the blueprint", { blueprint: `Not enough questions: needs ${text}` });
    }
  }

  await replacePool(examId, input.questionIds);
  await setBlueprint(examId, input.blueprint);
  return { ...(await loadOwnedExam(user, examId)), questions: await listPool(examId) };
}

function countByDifficulty(questions: Question[]): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const q of questions) counts[q.difficulty]++;
  return counts;
}

/** Marks of a difficulty group: the shared value, or null when the group is empty or its marks differ. */
function groupMarks(questions: Question[], d: Difficulty): { marks: number | null; mixed: boolean } {
  const values = [...new Set(questions.filter((q) => q.difficulty === d).map((q) => q.marks))];
  return { marks: values.length === 1 ? values[0] : null, mixed: values.length > 1 };
}

/** The 5 situations from docs/CONTRACT.md "Publish-check problems". */
export async function checkExam(user: Me, examId: string): Promise<PublishCheck> {
  const exam = await loadOwnedExam(user, examId);
  const pool = await listPool(examId);
  return buildCheck(exam, pool);
}

export function buildCheck(exam: Exam, pool: Question[]): PublishCheck {
  const problems: string[] = [];
  const bp: Blueprint | null = exam.blueprint;
  let paperQuestionCount = pool.length;
  let paperMarks = round2(pool.reduce((sum, q) => sum + q.marks, 0));

  if (pool.length === 0) problems.push("The exam has no questions yet");

  if (!bp) {
    if (pool.length > 0 && paperMarks !== exam.totalMarks) {
      problems.push(`The questions add up to ${paperMarks} marks, but the exam's total marks is ${exam.totalMarks}`);
    }
  } else {
    const have = countByDifficulty(pool);
    paperQuestionCount = bp.easy + bp.medium + bp.hard;
    paperMarks = 0;
    for (const d of DIFFICULTIES) {
      if (bp[d] === 0) continue;
      if (have[d] < bp[d]) problems.push(`The blueprint needs ${bp[d]} ${d} questions but the pool has only ${have[d]}`);
      const g = groupMarks(pool, d);
      if (g.mixed) problems.push(`${d[0].toUpperCase()}${d.slice(1)} questions have different marks, so papers would not be equal`);
      else if (g.marks !== null) paperMarks += bp[d] * g.marks;
    }
    paperMarks = round2(paperMarks);
    if (!problems.length && paperMarks !== exam.totalMarks) {
      problems.push(`The blueprint adds up to ${paperMarks} marks, but the exam's total marks is ${exam.totalMarks}`);
    }
  }

  if (new Date(exam.endAt) <= new Date()) problems.push("The end time is in the past");
  if (exam.enrolledCount === 0) problems.push("No candidates are enrolled yet");

  return {
    canPublish: problems.length === 0,
    problems,
    summary: { poolSize: pool.length, paperQuestionCount, paperMarks, enrolledCount: exam.enrolledCount },
  };
}

export async function publishExam(user: Me, examId: string): Promise<Exam> {
  const exam = await loadOwnedExam(user, examId);
  if (exam.state !== "draft") throw new HttpError(409, "This exam is already published");
  const check = buildCheck(exam, await listPool(examId));
  if (!check.canPublish) throw new HttpError(409, check.problems[0]);
  await setStatus(examId, "published");
  return loadOwnedExam(user, examId);
}

/** Back to draft. Not allowed once the exam started or any real attempt exists. */
export async function unpublishExam(user: Me, examId: string): Promise<Exam> {
  const exam = await loadOwnedExam(user, examId);
  if (exam.state === "draft") throw new HttpError(409, "This exam is already a draft");
  if (exam.state !== "published") throw new HttpError(409, "The exam has already started, so it can't be unpublished");
  if (exam.attemptCount > 0) throw new HttpError(409, "Candidates have already started attempts, so it can't be unpublished");
  await setStatus(examId, "draft");
  return loadOwnedExam(user, examId);
}
