// DATA layer for monitoring rows: incidents, compensation requests, announcements.
import { adminClient } from "@/backend/lib/supabase";
import type { Announcement, IncidentType } from "@/shared/types";

export async function insertIncident(attemptId: string, type: IncidentType, detail: string | null): Promise<void> {
  const { error } = await adminClient().from("incidents").insert({ attempt_id: attemptId, type, detail });
  if (error) throw error;
}

/** True if this attempt already reported this incident type since `sinceIso` (duplicate filter). */
export async function hasRecentIncident(attemptId: string, type: IncidentType, sinceIso: string): Promise<boolean> {
  const { count, error } = await adminClient()
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("attempt_id", attemptId)
    .eq("type", type)
    .gte("created_at", sinceIso);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** A pending outage-compensation request (the examiner approves or rejects it in Stage 4). */
export async function insertCompensationRequest(attemptId: string, gapSec: number): Promise<void> {
  const { error } = await adminClient().from("compensation_requests").insert({ attempt_id: attemptId, gap_sec: gapSec, status: "pending" });
  if (error) throw error;
}

/** The exam's announcements, newest first. */
export async function listAnnouncements(examId: string, limit = 50): Promise<Announcement[]> {
  const { data, error } = await adminClient()
    .from("announcements")
    .select("id, message, created_at")
    .eq("exam_id", examId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((a) => ({ id: a.id, message: a.message, createdAt: new Date(a.created_at).toISOString() }));
}
