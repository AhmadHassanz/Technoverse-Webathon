// DATA layer for enrollments (which candidates may take which exam).
import { adminClient } from "@/backend/lib/supabase";
import type { AttemptStatus, Enrollment } from "@/shared/types";

type EnrollmentRow = {
  candidate_id: string;
  enrolled_at: string;
  profiles: { full_name: string; email: string } | null;
};

/** Enrollment list with each candidate's REAL attempt status and score (sandbox attempts excluded). */
export async function listEnrollments(examId: string): Promise<Enrollment[]> {
  const db = adminClient();
  const [enr, att] = await Promise.all([
    db.from("enrollments").select("candidate_id, enrolled_at, profiles(full_name, email)").eq("exam_id", examId).returns<EnrollmentRow[]>(),
    db.from("attempts").select("candidate_id, status, score").eq("exam_id", examId).eq("is_sandbox", false),
  ]);
  if (enr.error) throw enr.error;
  if (att.error) throw att.error;
  const attempts = new Map(att.data.map((a) => [a.candidate_id as string, a]));
  return enr.data
    .map((e): Enrollment => {
      const a = attempts.get(e.candidate_id);
      return {
        candidateId: e.candidate_id,
        fullName: e.profiles?.full_name ?? "",
        email: e.profiles?.email ?? "",
        enrolledAt: new Date(e.enrolled_at).toISOString(),
        attemptStatus: (a?.status as AttemptStatus | undefined) ?? "not_started",
        score: a?.score === null || a?.score === undefined ? null : Number(a.score),
      };
    })
    .sort((x, y) => x.fullName.localeCompare(y.fullName));
}

export async function enrolledIds(examId: string): Promise<Set<string>> {
  const { data, error } = await adminClient().from("enrollments").select("candidate_id").eq("exam_id", examId);
  if (error) throw error;
  return new Set(data.map((r) => r.candidate_id as string));
}

export async function insertEnrollments(examId: string, candidateIds: string[]): Promise<void> {
  if (candidateIds.length === 0) return;
  const rows = candidateIds.map((id) => ({ exam_id: examId, candidate_id: id }));
  const { error } = await adminClient().from("enrollments").upsert(rows, { onConflict: "exam_id,candidate_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeEnrollment(examId: string, candidateId: string): Promise<boolean> {
  const { data, error } = await adminClient().from("enrollments").delete().eq("exam_id", examId).eq("candidate_id", candidateId).select("candidate_id");
  if (error) throw error;
  return data.length > 0;
}

export async function hasAttempt(examId: string, candidateId: string): Promise<boolean> {
  const { count, error } = await adminClient()
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", examId)
    .eq("candidate_id", candidateId);
  if (error) throw error;
  return (count ?? 0) > 0;
}
