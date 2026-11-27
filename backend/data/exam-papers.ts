// DATA layer for exam-wide reads used by grading, results and analytics:
// every frozen question + every saved answer of the exam's REAL attempts (sandbox previews excluded).
import { adminClient } from "@/backend/lib/supabase";
import { fetchAll } from "@/backend/data/paging";
import type { Snapshot } from "@/backend/lib/grading";

export type ExamPaperRow = {
  aqId: string;
  attemptId: string;
  questionId: string;
  position: number;
  snapshot: Snapshot;
  marksAwarded: number | null;
  feedback: string | null;
};

type PaperRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  position: number;
  snapshot: Snapshot;
  marks_awarded: number | string | null;
  feedback: string | null;
};

/** Frozen questions of the exam's real attempts. `statuses` limits which attempts (e.g. only finished ones). */
export async function listExamPapers(examId: string, statuses?: string[]): Promise<ExamPaperRow[]> {
  const rows = await fetchAll<PaperRow>((from, to) => {
    let query = adminClient()
      .from("attempt_questions")
      .select("id, attempt_id, question_id, position, snapshot, marks_awarded, feedback, attempts!attempt_questions_attempt_id_fkey!inner(exam_id, is_sandbox, status)")
      .eq("attempts.exam_id", examId)
      .eq("attempts.is_sandbox", false);
    if (statuses) query = query.in("attempts.status", statuses);
    return query.order("id").range(from, to).returns<PaperRow[]>();
  });
  return rows.map((r) => ({
    aqId: r.id,
    attemptId: r.attempt_id,
    questionId: r.question_id,
    position: r.position,
    snapshot: r.snapshot,
    marksAwarded: r.marks_awarded === null ? null : Number(r.marks_awarded),
    feedback: r.feedback,
  }));
}

export type ExamAnswerRow = { attemptId: string; aqId: string; selectedOptionIds: string[]; textAnswer: string };

type AnswerRow = { attempt_id: string; attempt_question_id: string; selected_option_ids: string[] | null; text_answer: string };

/** Saved answers of the exam's real attempts. */
export async function listExamAnswers(examId: string): Promise<ExamAnswerRow[]> {
  const rows = await fetchAll<AnswerRow>((from, to) =>
    adminClient()
      .from("answers")
      .select("attempt_id, attempt_question_id, selected_option_ids, text_answer, attempts!inner(exam_id, is_sandbox)")
      .eq("attempts.exam_id", examId)
      .eq("attempts.is_sandbox", false)
      .order("attempt_question_id")
      .range(from, to)
      .returns<AnswerRow[]>(),
  );
  return rows.map((r) => ({
    attemptId: r.attempt_id,
    aqId: r.attempt_question_id,
    selectedOptionIds: r.selected_option_ids ?? [],
    textAnswer: r.text_answer,
  }));
}

/** Publish the results, only if they are not published yet. Returns false when someone published first. */
export async function markResultsPublished(examId: string, nowIso: string): Promise<boolean> {
  const { data, error } = await adminClient()
    .from("exams")
    .update({ results_published_at: nowIso })
    .eq("id", examId)
    .is("results_published_at", null)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
