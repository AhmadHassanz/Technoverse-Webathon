// DATA layer for monitoring rows: incidents, compensation requests, announcements, attempt progress.
import { adminClient } from "@/backend/lib/supabase";
import { fetchAll } from "@/backend/data/paging";
import type { Announcement, CompensationRequest, CompensationStatus, Incident, IncidentType } from "@/shared/types";

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

/** A pending outage-compensation request (the examiner approves or rejects it). */
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

export async function insertAnnouncement(examId: string, message: string, createdBy: string): Promise<Announcement> {
  const { data, error } = await adminClient()
    .from("announcements")
    .insert({ exam_id: examId, message, created_by: createdBy })
    .select("id, message, created_at")
    .single();
  if (error) throw error;
  return { id: data.id, message: data.message, createdAt: new Date(data.created_at).toISOString() };
}

// ---------- incidents (review) ----------

type IncidentRow = {
  id: string;
  attempt_id: string;
  type: IncidentType;
  detail: string | null;
  created_at: string;
  reviewed: boolean;
  reviewer_note: string | null;
  attempts: { exam_id: string; profiles: { full_name: string } | null } | null;
};

// attempts!inner lets us filter by the attempt's exam and exclude sandbox previews.
const INCIDENT_SELECT = "id, attempt_id, type, detail, created_at, reviewed, reviewer_note, attempts!inner(exam_id, is_sandbox, profiles(full_name))";

function toIncident(r: IncidentRow): Incident {
  return {
    id: r.id,
    attemptId: r.attempt_id,
    candidateName: r.attempts?.profiles?.full_name ?? "",
    type: r.type,
    detail: r.detail,
    createdAt: new Date(r.created_at).toISOString(),
    reviewed: r.reviewed,
    reviewerNote: r.reviewer_note,
  };
}

/** The exam's incidents (real attempts only), newest first. */
export async function listIncidents(examId: string, limit = 50): Promise<Incident[]> {
  const { data, error } = await adminClient()
    .from("incidents")
    .select(INCIDENT_SELECT)
    .eq("attempts.exam_id", examId)
    .eq("attempts.is_sandbox", false)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<IncidentRow[]>();
  if (error) throw error;
  return data.map(toIncident);
}

/** How many incidents each attempt of the exam has (all of them, not only the newest 50). */
export async function incidentCounts(examId: string): Promise<Map<string, number>> {
  const rows = await fetchAll<{ attempt_id: string }>((from, to) =>
    adminClient()
      .from("incidents")
      .select("attempt_id, attempts!inner(exam_id, is_sandbox)")
      .eq("attempts.exam_id", examId)
      .eq("attempts.is_sandbox", false)
      .order("id")
      .range(from, to)
      .returns<{ attempt_id: string }[]>(),
  );
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.attempt_id, (counts.get(r.attempt_id) ?? 0) + 1);
  return counts;
}

/** One incident + the exam it belongs to (for the owner check), or null. */
export async function findIncident(id: string): Promise<{ incident: Incident; examId: string } | null> {
  const { data, error } = await adminClient().from("incidents").select(INCIDENT_SELECT).eq("id", id).maybeSingle<IncidentRow>();
  if (error) throw error;
  return data && data.attempts ? { incident: toIncident(data), examId: data.attempts.exam_id } : null;
}

/** Mark reviewed / not reviewed. `note` undefined keeps the existing note; "" clears it. */
export async function updateIncidentReview(id: string, reviewed: boolean, note: string | undefined): Promise<void> {
  const patch: Record<string, unknown> = { reviewed };
  if (note !== undefined) patch.reviewer_note = note === "" ? null : note;
  const { error } = await adminClient().from("incidents").update(patch).eq("id", id);
  if (error) throw error;
}

// ---------- compensation requests (decisions) ----------

type CompensationRow = {
  id: string;
  attempt_id: string;
  gap_sec: number;
  status: CompensationStatus;
  created_at: string;
  decided_at: string | null;
  attempts: { exam_id: string; profiles: { full_name: string } | null } | null;
};

const COMPENSATION_SELECT = "id, attempt_id, gap_sec, status, created_at, decided_at, attempts!inner(exam_id, is_sandbox, profiles(full_name))";

function toCompensation(r: CompensationRow): CompensationRequest {
  return {
    id: r.id,
    attemptId: r.attempt_id,
    candidateName: r.attempts?.profiles?.full_name ?? "",
    gapSec: r.gap_sec,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    decidedAt: r.decided_at ? new Date(r.decided_at).toISOString() : null,
  };
}

/** The exam's compensation requests (real attempts only), newest first. */
export async function listCompensations(examId: string): Promise<CompensationRequest[]> {
  const { data, error } = await adminClient()
    .from("compensation_requests")
    .select(COMPENSATION_SELECT)
    .eq("attempts.exam_id", examId)
    .eq("attempts.is_sandbox", false)
    .order("created_at", { ascending: false })
    .returns<CompensationRow[]>();
  if (error) throw error;
  return data.map(toCompensation);
}

export async function findCompensation(id: string): Promise<{ request: CompensationRequest; examId: string } | null> {
  const { data, error } = await adminClient().from("compensation_requests").select(COMPENSATION_SELECT).eq("id", id).maybeSingle<CompensationRow>();
  if (error) throw error;
  return data && data.attempts ? { request: toCompensation(data), examId: data.attempts.exam_id } : null;
}

/** Decide a request ONLY if it is still pending. Returns false when someone else decided it first. */
export async function claimCompensation(id: string, status: "approved" | "rejected", decidedBy: string, nowIso: string): Promise<boolean> {
  const { data, error } = await adminClient()
    .from("compensation_requests")
    .update({ status, decided_by: decidedBy, decided_at: nowIso })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

/** Undo a claim (used when the time could not be added after all). */
export async function reopenCompensation(id: string): Promise<void> {
  const { error } = await adminClient().from("compensation_requests").update({ status: "pending", decided_by: null, decided_at: null }).eq("id", id);
  if (error) throw error;
}

// ---------- monitor progress ----------

type AnswerProgressRow = { attempt_id: string; selected_option_ids: string[] | null; text_answer: string };

/** For each attempt: how many questions it has and how many are answered (something selected or written). */
export async function attemptProgress(examId: string): Promise<Map<string, { answered: number; questions: number }>> {
  const [answers, papers] = await Promise.all([
    fetchAll<AnswerProgressRow>((from, to) =>
      adminClient()
        .from("answers")
        .select("attempt_id, selected_option_ids, text_answer, attempts!inner(exam_id, is_sandbox)")
        .eq("attempts.exam_id", examId)
        .eq("attempts.is_sandbox", false)
        .order("attempt_question_id")
        .range(from, to)
        .returns<AnswerProgressRow[]>(),
    ),
    fetchAll<{ attempt_id: string }>((from, to) =>
      adminClient()
        .from("attempt_questions")
        .select("attempt_id, attempts!attempt_questions_attempt_id_fkey!inner(exam_id, is_sandbox)")
        .eq("attempts.exam_id", examId)
        .eq("attempts.is_sandbox", false)
        .order("id")
        .range(from, to)
        .returns<{ attempt_id: string }[]>(),
    ),
  ]);
  const progress = new Map<string, { answered: number; questions: number }>();
  const get = (id: string) => progress.get(id) ?? { answered: 0, questions: 0 };
  for (const p of papers) progress.set(p.attempt_id, { ...get(p.attempt_id), questions: get(p.attempt_id).questions + 1 });
  for (const a of answers) {
    if ((a.selected_option_ids?.length ?? 0) > 0 || a.text_answer.trim() !== "") {
      progress.set(a.attempt_id, { ...get(a.attempt_id), answered: get(a.attempt_id).answered + 1 });
    }
  }
  return progress;
}
