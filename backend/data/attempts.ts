// DATA layer for attempts and their frozen papers (attempt_questions).
// The only place that queries these tables. snake_case rows -> camelCase records.
import { adminClient } from "@/backend/lib/supabase";
import type { Snapshot } from "@/backend/lib/grading";
import { fetchAll } from "@/backend/data/paging";
import type { AttemptStatus } from "@/shared/types";

type AttemptRow = {
  id: string;
  exam_id: string;
  candidate_id: string;
  is_sandbox: boolean;
  status: AttemptStatus;
  started_at: string;
  ends_at: string;
  compensation_sec: number;
  submitted_at: string | null;
  last_heartbeat_at: string | null;
  score: number | string | null;
  paper_difficulty?: number | string | null;
};

/** One attempt, as the services use it. */
export type AttemptRecord = {
  id: string;
  examId: string;
  candidateId: string; // the person taking it (for a sandbox: the examiner)
  isSandbox: boolean;
  status: AttemptStatus;
  startedAt: string;
  endsAt: string; // base deadline (WITHOUT compensation); use effectiveEnd() for the real one
  compensationSec: number;
  submittedAt: string | null;
  /** RAW value from the database (not normalised), so the heartbeat can compare it exactly. */
  lastHeartbeatAt: string | null;
  score: number | null;
};

/** A real attempt with who took it (monitor, results, grading, analytics). */
export type ExamAttempt = AttemptRecord & { fullName: string; email: string; paperDifficulty: number | null };

/** All REAL (non-sandbox) attempts of an exam, oldest first. Sandbox previews never show up here. */
export async function listRealAttemptsOfExam(examId: string): Promise<ExamAttempt[]> {
  const rows = await fetchAll<AttemptRow & { profiles: { full_name: string; email: string } | null }>((from, to) =>
    adminClient()
      .from("attempts")
      .select("*, profiles(full_name, email)")
      .eq("exam_id", examId)
      .eq("is_sandbox", false)
      .order("started_at")
      .order("id")
      .range(from, to)
      .returns<(AttemptRow & { profiles: { full_name: string; email: string } | null })[]>(),
  );
  return rows.map((r) => ({
    ...toRecord(r),
    fullName: r.profiles?.full_name ?? "",
    email: r.profiles?.email ?? "",
    paperDifficulty: r.paper_difficulty === null || r.paper_difficulty === undefined ? null : Number(r.paper_difficulty),
  }));
}

/** Store the paper difficulty (0-100) on the attempt when results are published. */
export async function setPaperDifficulty(id: string, value: number): Promise<void> {
  const { error } = await adminClient().from("attempts").update({ paper_difficulty: value }).eq("id", id);
  if (error) throw error;
}

/**
 * Optimistic "add compensation seconds": only changes the row if compensation_sec still has the value we read
 * AND the attempt is still in progress. Returns true when this request's update won.
 */
export async function setCompensationSec(id: string, previous: number, next: number): Promise<boolean> {
  const { data, error } = await adminClient()
    .from("attempts")
    .update({ compensation_sec: next })
    .eq("id", id)
    .eq("compensation_sec", previous)
    .eq("status", "in_progress")
    .select("id");
  if (error) throw error;
  return data.length > 0;
}

/** Kept for the dashboard code written in Stage 2. */
export type AttemptSummary = AttemptRecord;

const iso = (d: string) => new Date(d).toISOString();

function toRecord(r: AttemptRow): AttemptRecord {
  return {
    id: r.id,
    examId: r.exam_id,
    candidateId: r.candidate_id,
    isSandbox: r.is_sandbox,
    status: r.status,
    startedAt: iso(r.started_at),
    endsAt: iso(r.ends_at),
    compensationSec: r.compensation_sec,
    submittedAt: r.submitted_at ? iso(r.submitted_at) : null,
    lastHeartbeatAt: r.last_heartbeat_at,
    score: r.score === null ? null : Number(r.score),
  };
}

export async function findAttempt(id: string): Promise<AttemptRecord | null> {
  const { data, error } = await adminClient().from("attempts").select("*").eq("id", id).maybeSingle<AttemptRow>();
  if (error) throw error;
  return data ? toRecord(data) : null;
}

/** The candidate's REAL attempt for this exam (there can be at most one: partial unique index). */
export async function findRealAttempt(examId: string, candidateId: string): Promise<AttemptRecord | null> {
  const { data, error } = await adminClient()
    .from("attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("candidate_id", candidateId)
    .eq("is_sandbox", false)
    .maybeSingle<AttemptRow>();
  if (error) throw error;
  return data ? toRecord(data) : null;
}

/** The newest still-open sandbox (preview) attempt of this user on this exam. */
export async function findOpenSandboxAttempt(examId: string, userId: string): Promise<AttemptRecord | null> {
  const { data, error } = await adminClient()
    .from("attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("candidate_id", userId)
    .eq("is_sandbox", true)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<AttemptRow>();
  if (error) throw error;
  return data ? toRecord(data) : null;
}

/** The candidate's REAL (non-sandbox) attempts, keyed by exam id. */
export async function realAttemptsByExam(candidateId: string, examIds: string[]): Promise<Map<string, AttemptRecord>> {
  const result = new Map<string, AttemptRecord>();
  if (examIds.length === 0) return result;
  const { data, error } = await adminClient()
    .from("attempts")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("is_sandbox", false)
    .in("exam_id", examIds)
    .returns<AttemptRow[]>();
  if (error) throw error;
  for (const r of data) result.set(r.exam_id, toRecord(r));
  return result;
}

/**
 * Create the attempt row. Returns the Postgres error instead of throwing, so the service can
 * recognise a unique violation (a second attempt for the same candidate) and resume instead.
 */
export async function insertAttempt(input: {
  examId: string;
  candidateId: string;
  isSandbox: boolean;
  startedAt: string;
  endsAt: string;
}): Promise<{ id: string | null; error: { code?: string } | null }> {
  const { data, error } = await adminClient()
    .from("attempts")
    .insert({
      exam_id: input.examId,
      candidate_id: input.candidateId,
      is_sandbox: input.isSandbox,
      status: "in_progress",
      started_at: input.startedAt,
      ends_at: input.endsAt,
    })
    .select("id")
    .single();
  return { id: data?.id ?? null, error };
}

export async function deleteAttemptRow(id: string): Promise<void> {
  const { error } = await adminClient().from("attempts").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Atomic "finish": only changes the row if it is STILL in progress.
 * Returns the updated attempt, or null when someone else already finished it (idempotent submit).
 */
export async function finishAttempt(
  id: string,
  status: "submitted" | "auto_submitted",
  submittedAt: string,
): Promise<AttemptRecord | null> {
  const { data, error } = await adminClient()
    .from("attempts")
    .update({ status, submitted_at: submittedAt })
    .eq("id", id)
    .eq("status", "in_progress")
    .select("*")
    .returns<AttemptRow[]>();
  if (error) throw error;
  return data.length ? toRecord(data[0]) : null;
}

/** Set the final score + status graded. Never touches an attempt that is still in progress. */
export async function setGraded(id: string, score: number): Promise<void> {
  const { error } = await adminClient()
    .from("attempts")
    .update({ status: "graded", score })
    .eq("id", id)
    .in("status", ["submitted", "auto_submitted", "graded"]);
  if (error) throw error;
}

/**
 * Optimistic heartbeat update: set last_heartbeat_at = now ONLY IF it still holds the value we read.
 * If two tabs beat at the same moment, only one update changes the row, so only one of them
 * records an outage. Returns true when this request's update won.
 */
export async function touchHeartbeat(id: string, previousRaw: string | null, nowIso: string): Promise<boolean> {
  let query = adminClient().from("attempts").update({ last_heartbeat_at: nowIso }).eq("id", id).eq("status", "in_progress");
  query = previousRaw === null ? query.is("last_heartbeat_at", null) : query.eq("last_heartbeat_at", previousRaw);
  const { data, error } = await query.select("id");
  if (error) throw error;
  return data.length > 0;
}

// ---------- the frozen paper (attempt_questions) ----------

export type AttemptQuestionRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  position: number;
  snapshot: Snapshot;
  marks_awarded: number | string | null;
  feedback?: string | null;
};

export type PaperQuestion = {
  aqId: string;
  questionId: string;
  position: number;
  snapshot: Snapshot;
  marksAwarded: number | null;
  feedback: string | null; // the examiner's comment on a written answer
};

function toPaperQuestion(r: AttemptQuestionRow): PaperQuestion {
  return {
    aqId: r.id,
    questionId: r.question_id,
    position: r.position,
    snapshot: r.snapshot,
    marksAwarded: r.marks_awarded === null ? null : Number(r.marks_awarded),
    feedback: r.feedback ?? null,
  };
}

/** Insert the whole paper in ONE request (one SQL statement: all rows or none). */
export async function insertPaper(
  attemptId: string,
  rows: { questionId: string; position: number; snapshot: Snapshot }[],
): Promise<void> {
  const { error } = await adminClient()
    .from("attempt_questions")
    .insert(rows.map((r) => ({ attempt_id: attemptId, question_id: r.questionId, position: r.position, snapshot: r.snapshot })));
  if (error) throw error;
}

/** The attempt's paper, in position order. */
export async function listPaper(attemptId: string): Promise<PaperQuestion[]> {
  const { data, error } = await adminClient()
    .from("attempt_questions")
    .select("id, attempt_id, question_id, position, snapshot, marks_awarded, feedback")
    .eq("attempt_id", attemptId)
    .order("position")
    .returns<AttemptQuestionRow[]>();
  if (error) throw error;
  return data.map(toPaperQuestion);
}

/** One question of THIS attempt's paper, or null if the aqId belongs to another attempt / does not exist. */
export async function findPaperQuestion(attemptId: string, aqId: string): Promise<PaperQuestion | null> {
  const { data, error } = await adminClient()
    .from("attempt_questions")
    .select("id, attempt_id, question_id, position, snapshot, marks_awarded, feedback")
    .eq("id", aqId)
    .eq("attempt_id", attemptId)
    .maybeSingle<AttemptQuestionRow>();
  if (error) throw error;
  return data ? toPaperQuestion(data) : null;
}

/** Same as findPaperQuestion, but starting from the question id alone (the grading screen only knows aqId). */
export async function findPaperQuestionById(aqId: string): Promise<(PaperQuestion & { attemptId: string }) | null> {
  const { data, error } = await adminClient()
    .from("attempt_questions")
    .select("id, attempt_id, question_id, position, snapshot, marks_awarded, feedback")
    .eq("id", aqId)
    .maybeSingle<AttemptQuestionRow>();
  if (error) throw error;
  return data ? { ...toPaperQuestion(data), attemptId: data.attempt_id } : null;
}

/** The examiner's grade for one written answer. */
export async function saveGrade(aqId: string, marks: number, feedback: string | null, gradedBy: string): Promise<void> {
  const { error } = await adminClient()
    .from("attempt_questions")
    .update({ marks_awarded: marks, feedback, graded_by: gradedBy })
    .eq("id", aqId);
  if (error) throw error;
}

/**
 * Store auto-grading marks for objective questions in ONE statement (upsert on the primary key,
 * so every row already exists and is just updated). Written questions are never passed in here.
 */
export async function setObjectiveMarks(
  attemptId: string,
  marks: { question: PaperQuestion; marksAwarded: number }[],
): Promise<void> {
  if (marks.length === 0) return;
  const rows = marks.map(({ question: q, marksAwarded }) => ({
    id: q.aqId,
    attempt_id: attemptId,
    question_id: q.questionId,
    position: q.position,
    snapshot: q.snapshot,
    marks_awarded: marksAwarded,
  }));
  const { error } = await adminClient().from("attempt_questions").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
