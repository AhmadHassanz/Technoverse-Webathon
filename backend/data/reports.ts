// DATA layer for report verification codes (table report_verifications: one code per attempt).
import { adminClient } from "@/backend/lib/supabase";

export async function findCodeForAttempt(attemptId: string): Promise<string | null> {
  const { data, error } = await adminClient()
    .from("report_verifications")
    .select("code")
    .eq("attempt_id", attemptId)
    .maybeSingle<{ code: string }>();
  if (error) throw error;
  return data?.code ?? null;
}

/** Returns the database error instead of throwing, so the service can handle a unique violation (race / code clash). */
export async function insertVerification(attemptId: string, code: string): Promise<{ error: { code?: string } | null }> {
  const { error } = await adminClient().from("report_verifications").insert({ attempt_id: attemptId, code });
  return { error };
}

export async function findVerification(code: string): Promise<{ attemptId: string; issuedAt: string } | null> {
  const { data, error } = await adminClient()
    .from("report_verifications")
    .select("attempt_id, issued_at")
    .eq("code", code)
    .maybeSingle<{ attempt_id: string; issued_at: string }>();
  if (error) throw error;
  return data ? { attemptId: data.attempt_id, issuedAt: new Date(data.issued_at).toISOString() } : null;
}
