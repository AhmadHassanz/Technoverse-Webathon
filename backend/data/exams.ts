// DATA layer for exams: queries + snake_case -> camelCase.
import { adminClient } from "@/backend/lib/supabase";
import { examState } from "@/backend/lib/time";
import { QUESTION_SELECT, toQuestion, type QuestionRow } from "@/backend/data/questions";
import type { Blueprint, Exam, ExamInput, Question } from "@/shared/types";

type ExamRow = {
  id: string;
  title: string;
  instructions: string;
  start_at: string;
  end_at: string;
  duration_min: number;
  total_marks: number | string;
  pass_marks: number | string;
  status: "draft" | "published";
  shuffle_questions: boolean;
  shuffle_options: boolean;
  blueprint: Blueprint | null;
  results_published_at: string | null;
  created_by: string;
  created_at: string;
  exam_questions: { count: number }[];
  enrollments: { count: number }[];
  attempts: { count: number }[];
};

// Counts come from PostgREST embedded counts. Sandbox attempts are excluded (see the .eq below).
const EXAM_SELECT = "*, exam_questions(count), enrollments(count), attempts(count)";
const iso = (d: string) => new Date(d).toISOString();

function toExam(r: ExamRow): Exam {
  return {
    id: r.id,
    title: r.title,
    instructions: r.instructions,
    startAt: iso(r.start_at),
    endAt: iso(r.end_at),
    durationMin: r.duration_min,
    totalMarks: Number(r.total_marks),
    passMarks: Number(r.pass_marks),
    shuffleQuestions: r.shuffle_questions,
    shuffleOptions: r.shuffle_options,
    blueprint: r.blueprint,
    state: examState({ status: r.status, startAt: r.start_at, endAt: r.end_at }),
    resultsPublishedAt: r.results_published_at ? iso(r.results_published_at) : null,
    questionCount: r.exam_questions?.[0]?.count ?? 0,
    enrolledCount: r.enrollments?.[0]?.count ?? 0,
    attemptCount: r.attempts?.[0]?.count ?? 0,
    createdAt: r.created_at,
  };
}

/** `ownerId` = only that user's exams; undefined = all (admin). Newest first. */
export async function listExams(ownerId?: string): Promise<Exam[]> {
  let query = adminClient()
    .from("exams")
    .select(EXAM_SELECT)
    .eq("attempts.is_sandbox", false)
    .order("created_at", { ascending: false });
  if (ownerId) query = query.eq("created_by", ownerId);
  const { data, error } = await query.returns<ExamRow[]>();
  if (error) throw error;
  return data.map(toExam);
}

/** The exam plus its owner id (for the permission check), or null. */
export async function findExam(id: string): Promise<{ exam: Exam; createdBy: string } | null> {
  const { data, error } = await adminClient()
    .from("exams")
    .select(EXAM_SELECT)
    .eq("attempts.is_sandbox", false)
    .eq("id", id)
    .maybeSingle<ExamRow>();
  if (error) throw error;
  return data ? { exam: toExam(data), createdBy: data.created_by } : null;
}

/** The question pool of an exam, in position order. */
export async function listPool(examId: string): Promise<Question[]> {
  const { data, error } = await adminClient()
    .from("exam_questions")
    .select(`position, questions(${QUESTION_SELECT})`)
    .eq("exam_id", examId)
    .order("position")
    .returns<{ position: number; questions: QuestionRow }[]>();
  if (error) throw error;
  return data.map((row) => toQuestion(row.questions));
}

const toColumns = (input: Partial<ExamInput>) => ({
  ...(input.title !== undefined && { title: input.title }),
  ...(input.instructions !== undefined && { instructions: input.instructions }),
  ...(input.startAt !== undefined && { start_at: input.startAt }),
  ...(input.endAt !== undefined && { end_at: input.endAt }),
  ...(input.durationMin !== undefined && { duration_min: input.durationMin }),
  ...(input.totalMarks !== undefined && { total_marks: input.totalMarks }),
  ...(input.passMarks !== undefined && { pass_marks: input.passMarks }),
  ...(input.shuffleQuestions !== undefined && { shuffle_questions: input.shuffleQuestions }),
  ...(input.shuffleOptions !== undefined && { shuffle_options: input.shuffleOptions }),
});

export async function insertExam(input: ExamInput, createdBy: string): Promise<string> {
  const { data, error } = await adminClient()
    .from("exams")
    .insert({ ...toColumns(input), status: "draft", created_by: createdBy })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateExamRow(id: string, input: Partial<ExamInput>): Promise<void> {
  const { error } = await adminClient().from("exams").update(toColumns(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteExamRow(id: string): Promise<void> {
  const { error } = await adminClient().from("exams").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Replace the exam's question pool. Safe order: add/update the new rows first, then remove the rest,
 * so a failure half-way never leaves the exam with an empty pool.
 */
export async function replacePool(examId: string, questionIds: string[]): Promise<void> {
  const db = adminClient();
  if (questionIds.length) {
    const rows = questionIds.map((qid, i) => ({ exam_id: examId, question_id: qid, position: i }));
    const { error } = await db.from("exam_questions").upsert(rows, { onConflict: "exam_id,question_id" });
    if (error) throw error;
  }
  let del = db.from("exam_questions").delete().eq("exam_id", examId);
  if (questionIds.length) del = del.not("question_id", "in", `(${questionIds.join(",")})`);
  const { error } = await del;
  if (error) throw error;
}

export async function setBlueprint(examId: string, blueprint: Blueprint | null): Promise<void> {
  const { error } = await adminClient().from("exams").update({ blueprint }).eq("id", examId);
  if (error) throw error;
}

export async function setStatus(examId: string, status: "draft" | "published"): Promise<void> {
  const { error } = await adminClient().from("exams").update({ status }).eq("id", examId);
  if (error) throw error;
}
