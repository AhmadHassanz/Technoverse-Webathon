// DATA layer for what the candidate writes during an attempt: answers and the scratchpad.
import { adminClient } from "@/backend/lib/supabase";
import type { Answer } from "@/shared/types";

type AnswerRow = {
  attempt_question_id: string;
  selected_option_ids: string[] | null;
  text_answer: string;
  flagged: boolean;
  client_seq: number;
  saved_at: string;
};

/** All saved answers of an attempt (only questions that have a row). */
export async function listAnswers(attemptId: string): Promise<Answer[]> {
  const { data, error } = await adminClient()
    .from("answers")
    .select("attempt_question_id, selected_option_ids, text_answer, flagged, client_seq, saved_at")
    .eq("attempt_id", attemptId)
    .returns<AnswerRow[]>();
  if (error) throw error;
  return data.map((r) => ({
    aqId: r.attempt_question_id,
    selectedOptionIds: r.selected_option_ids ?? [],
    textAnswer: r.text_answer,
    flagged: r.flagged,
    clientSeq: r.client_seq,
    savedAt: new Date(r.saved_at).toISOString(),
  }));
}

/**
 * Save through the database function save_answer() (backend/db/schema.sql).
 * It is ONE atomic statement that keeps only the newest clientSeq:
 * returns true if stored, false if the server already had a newer-or-equal clientSeq.
 */
export async function saveAnswerAtomic(input: {
  attemptId: string;
  aqId: string;
  selectedOptionIds: string[];
  textAnswer: string;
  flagged: boolean;
  clientSeq: number;
}): Promise<boolean> {
  const { data, error } = await adminClient().rpc("save_answer", {
    p_attempt: input.attemptId,
    p_aq: input.aqId,
    p_selected: input.selectedOptionIds,
    p_text: input.textAnswer,
    p_flagged: input.flagged,
    p_seq: input.clientSeq,
  });
  if (error) throw error;
  return data === true;
}

// ---------- scratchpad (one row per attempt) ----------

export async function getScratchpad(attemptId: string): Promise<{ text: string; drawing: string | null }> {
  const { data, error } = await adminClient()
    .from("scratchpads")
    .select("text, drawing")
    .eq("attempt_id", attemptId)
    .maybeSingle<{ text: string; drawing: string | null }>();
  if (error) throw error;
  return data ?? { text: "", drawing: null };
}

export async function upsertScratchpad(attemptId: string, text: string, drawing: string | null, nowIso: string): Promise<void> {
  const { error } = await adminClient()
    .from("scratchpads")
    .upsert({ attempt_id: attemptId, text, drawing, updated_at: nowIso }, { onConflict: "attempt_id" });
  if (error) throw error;
}
