// DATA layer for attempts. (Stage 3 adds the attempt engine queries here.)
import { adminClient } from "@/backend/lib/supabase";
import type { AttemptStatus } from "@/shared/types";

export type AttemptSummary = {
  id: string;
  examId: string;
  status: AttemptStatus;
  endsAt: string; // base deadline (without compensation)
  compensationSec: number;
  submittedAt: string | null;
};

/** The candidate's REAL (non-sandbox) attempts, keyed by exam id. */
export async function realAttemptsByExam(candidateId: string, examIds: string[]): Promise<Map<string, AttemptSummary>> {
  const result = new Map<string, AttemptSummary>();
  if (examIds.length === 0) return result;
  const { data, error } = await adminClient()
    .from("attempts")
    .select("id, exam_id, status, ends_at, compensation_sec, submitted_at")
    .eq("candidate_id", candidateId)
    .eq("is_sandbox", false)
    .in("exam_id", examIds);
  if (error) throw error;
  for (const a of data) {
    result.set(a.exam_id, {
      id: a.id,
      examId: a.exam_id,
      status: a.status,
      endsAt: new Date(a.ends_at).toISOString(),
      compensationSec: a.compensation_sec,
      submittedAt: a.submitted_at ? new Date(a.submitted_at).toISOString() : null,
    });
  }
  return result;
}
