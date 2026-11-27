// DATA layer for the question bank (questions + their options).
import { adminClient } from "@/backend/lib/supabase";
import type { Difficulty, Question, QuestionInput, QuestionType } from "@/shared/types";

export type QuestionRow = {
  id: string;
  topic_id: string;
  type: QuestionType;
  stem: string;
  difficulty: Difficulty;
  marks: number | string;
  multi_scheme: Question["multiScheme"];
  negative_marks: number | string;
  created_by: string;
  created_at: string;
  topics: { name: string } | null;
  question_options: { id: string; label: string; is_correct: boolean; position: number }[];
};

/** What to select so toQuestion() has everything (also used by exams data for the pool). */
export const QUESTION_SELECT = "*, topics(name), question_options(id, label, is_correct, position)";

export function toQuestion(r: QuestionRow): Question {
  return {
    id: r.id,
    topicId: r.topic_id,
    topicName: r.topics?.name ?? "",
    type: r.type,
    stem: r.stem,
    difficulty: r.difficulty,
    marks: Number(r.marks), // Postgres numeric can come back as text
    multiScheme: r.multi_scheme,
    negativeMarks: Number(r.negative_marks),
    options: [...r.question_options]
      .sort((a, b) => a.position - b.position)
      .map((o) => ({ id: o.id, label: o.label, isCorrect: o.is_correct })),
    createdAt: r.created_at,
  };
}

export type QuestionFilter = { ownerId?: string; topicId?: string; difficulty?: Difficulty; type?: QuestionType; q?: string };

export async function listQuestions(f: QuestionFilter): Promise<Question[]> {
  let query = adminClient().from("questions").select(QUESTION_SELECT).order("created_at", { ascending: false });
  if (f.ownerId) query = query.eq("created_by", f.ownerId);
  if (f.topicId) query = query.eq("topic_id", f.topicId);
  if (f.difficulty) query = query.eq("difficulty", f.difficulty);
  if (f.type) query = query.eq("type", f.type);
  if (f.q) query = query.ilike("stem", `%${f.q.replace(/[%_\\]/g, " ")}%`);
  const { data, error } = await query.returns<QuestionRow[]>();
  if (error) throw error;
  return data.map(toQuestion);
}

/** Returns the question plus who owns it (for the permission check), or null. */
export async function findQuestion(id: string): Promise<{ question: Question; createdBy: string } | null> {
  const { data, error } = await adminClient().from("questions").select(QUESTION_SELECT).eq("id", id).maybeSingle<QuestionRow>();
  if (error) throw error;
  return data ? { question: toQuestion(data), createdBy: data.created_by } : null;
}

const optionRows = (questionId: string, options: QuestionInput["options"]) =>
  options.map((o, i) => ({ question_id: questionId, label: o.label, is_correct: o.isCorrect, position: i }));

export async function insertQuestion(input: QuestionInput, createdBy: string): Promise<string> {
  const db = adminClient();
  const { data, error } = await db
    .from("questions")
    .insert({
      topic_id: input.topicId, type: input.type, stem: input.stem, difficulty: input.difficulty,
      marks: input.marks, multi_scheme: input.multiScheme, negative_marks: input.negativeMarks, created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;
  if (input.options.length) {
    const res = await db.from("question_options").insert(optionRows(data.id, input.options));
    if (res.error) {
      await db.from("questions").delete().eq("id", data.id); // do not leave a question without options
      throw res.error;
    }
  }
  return data.id;
}

/** Update the question row and REPLACE all options. New options are added before old ones are removed. */
export async function replaceQuestion(id: string, input: QuestionInput): Promise<void> {
  const db = adminClient();
  const { error } = await db
    .from("questions")
    .update({
      topic_id: input.topicId, type: input.type, stem: input.stem, difficulty: input.difficulty,
      marks: input.marks, multi_scheme: input.multiScheme, negative_marks: input.negativeMarks,
    })
    .eq("id", id);
  if (error) throw error;
  const old = await db.from("question_options").select("id").eq("question_id", id);
  if (old.error) throw old.error;
  if (input.options.length) {
    const ins = await db.from("question_options").insert(optionRows(id, input.options));
    if (ins.error) throw ins.error;
  }
  const oldIds = old.data.map((o) => o.id);
  if (oldIds.length) {
    const del = await db.from("question_options").delete().in("id", oldIds);
    if (del.error) throw del.error;
  }
}

/** True if the question is in an exam pool or in someone's frozen paper. */
export async function isQuestionInUse(id: string): Promise<boolean> {
  const db = adminClient();
  const [a, b] = await Promise.all([
    db.from("exam_questions").select("exam_id", { count: "exact", head: true }).eq("question_id", id),
    db.from("attempt_questions").select("id", { count: "exact", head: true }).eq("question_id", id),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return (a.count ?? 0) + (b.count ?? 0) > 0;
}

export async function deleteQuestion(id: string): Promise<{ error: { code?: string } | null }> {
  const { error } = await adminClient().from("questions").delete().eq("id", id);
  return { error };
}

/** Several questions at once (with their owners). Unknown ids are simply missing from the result. */
export async function listQuestionsByIds(ids: string[]): Promise<{ question: Question; createdBy: string }[]> {
  if (ids.length === 0) return [];
  const { data, error } = await adminClient().from("questions").select(QUESTION_SELECT).in("id", ids).returns<QuestionRow[]>();
  if (error) throw error;
  return data.map((r) => ({ question: toQuestion(r), createdBy: r.created_by }));
}
