// SERVICE: live monitoring for the exam owner: monitor view, announcements, incident review,
// compensation decisions (innovation 5.3). Incidents are INDICATORS for a human to review, never proof.
import { assertOwner } from "@/backend/lib/auth";
import { HttpError } from "@/backend/lib/errors";
import { effectiveEnd } from "@/backend/lib/time";
import { findAttempt, setCompensationSec } from "@/backend/data/attempts";
import { findExam } from "@/backend/data/exams";
import { isEnrolled } from "@/backend/data/enrollments";
import {
  attemptProgress, claimCompensation, findCompensation, findIncident, incidentCounts, insertAnnouncement, listAnnouncements,
  listCompensations, listIncidents, reopenCompensation, updateIncidentReview,
} from "@/backend/data/monitoring";
import { finalizeIfExpired, listFinalizedAttempts } from "@/backend/services/attempt.service";
import { loadOwnedExam } from "@/backend/services/exams.service";
import type {
  Announcement, CompensationRequest, Incident, IncidentReviewInput, Me, MonitorView,
} from "@/shared/types";

const ONLINE_MS = 45_000; // a heartbeat within the last 45 s = online
const MAX_COMPENSATION_SEC = 600; // total extra time per attempt is capped at 10 minutes

/** GET /api/exams/[id]/monitor (the frontend polls every 5 s). Real attempts only. */
export async function getMonitor(user: Me, examId: string): Promise<MonitorView> {
  const exam = await loadOwnedExam(user, examId);
  const attempts = await listFinalizedAttempts(examId); // expired attempts are closed first
  const [progress, counts, incidents, compensations] = await Promise.all([
    attemptProgress(examId),
    incidentCounts(examId),
    listIncidents(examId, 50),
    listCompensations(examId),
  ]);
  const now = Date.now();

  const rows = attempts
    .map((a) => {
      const online = a.status === "in_progress" && a.lastHeartbeatAt !== null && now - new Date(a.lastHeartbeatAt).getTime() <= ONLINE_MS;
      return {
        attemptId: a.id,
        candidateId: a.candidateId,
        fullName: a.fullName,
        email: a.email,
        status: a.status,
        answeredCount: progress.get(a.id)?.answered ?? 0,
        questionCount: progress.get(a.id)?.questions ?? 0,
        startedAt: a.startedAt,
        endsAt: effectiveEnd(a).toISOString(),
        lastSeenAt: a.lastHeartbeatAt ? new Date(a.lastHeartbeatAt).toISOString() : null,
        online,
        incidentCount: counts.get(a.id) ?? 0,
      };
    })
    .sort((x, y) => x.fullName.localeCompare(y.fullName));

  const inProgress = rows.filter((r) => r.status === "in_progress").length;
  return {
    exam: { id: exam.id, title: exam.title, state: exam.state, endAt: exam.endAt },
    summary: {
      enrolled: exam.enrolledCount,
      notStarted: Math.max(0, exam.enrolledCount - rows.length),
      inProgress,
      submitted: rows.length - inProgress,
      online: rows.filter((r) => r.online).length,
    },
    attempts: rows,
    incidents,
    compensations,
  };
}

// ---------- announcements ----------

/** GET /api/exams/[id]/announcements: the exam owner (or admin), or a candidate enrolled in a non-draft exam. */
export async function getAnnouncements(user: Me, examId: string): Promise<Announcement[]> {
  const found = await findExam(examId);
  if (!found) throw new HttpError(404, "Exam not found");
  if (user.role === "candidate") {
    if (found.exam.state === "draft" || !(await isEnrolled(examId, user.id))) throw new HttpError(403, "You don't have access to this");
  } else {
    assertOwner(user, found.createdBy);
  }
  return listAnnouncements(examId, 50);
}

/** POST /api/exams/[id]/announcements: candidates see it on their next heartbeat. */
export async function postAnnouncement(user: Me, examId: string, message: string): Promise<Announcement> {
  const exam = await loadOwnedExam(user, examId);
  if (exam.state === "draft") throw new HttpError(409, "Publish the exam before sending announcements");
  return insertAnnouncement(examId, message, user.id);
}

// ---------- incident review ----------

/** PATCH /api/incidents/[id]: the examiner marks an incident reviewed and may add a note. Never changes scores. */
export async function reviewIncident(user: Me, incidentId: string, input: IncidentReviewInput): Promise<Incident> {
  const found = await findIncident(incidentId);
  if (!found) throw new HttpError(404, "Incident not found");
  await loadOwnedExam(user, found.examId); // 404 / 403
  await updateIncidentReview(incidentId, input.reviewed, input.reviewerNote);
  const fresh = await findIncident(incidentId);
  return (fresh ?? found).incident;
}

// ---------- compensation decisions ----------

/**
 * PATCH /api/compensations/[id]
 *  - rejected: just marks it (allowed any time while pending)
 *  - approved: adds the measured gap to the attempt's extra time, capped at 600 s in total,
 *    and only while the attempt is still in progress (otherwise 409)
 * The request is "claimed" first (only a pending one can be), so two clicks can never add the time twice.
 */
export async function decideCompensation(user: Me, id: string, decision: "approved" | "rejected"): Promise<CompensationRequest> {
  const found = await findCompensation(id);
  if (!found) throw new HttpError(404, "Request not found");
  await loadOwnedExam(user, found.examId); // 404 / 403
  if (found.request.status !== "pending") throw new HttpError(409, "This request was already decided");

  const reread = async () => (await findCompensation(id))?.request ?? found.request;
  const alreadyDecided = () => new HttpError(409, "This request was already decided");

  if (decision === "rejected") {
    if (!(await claimCompensation(id, "rejected", user.id, new Date().toISOString()))) throw alreadyDecided();
    return reread();
  }

  const attempt = await findAttempt(found.request.attemptId);
  if (!attempt) throw new HttpError(404, "Attempt not found");
  if ((await finalizeIfExpired(attempt)).status !== "in_progress") {
    throw new HttpError(409, "The attempt has already finished, so time can't be added");
  }
  if (!(await claimCompensation(id, "approved", user.id, new Date().toISOString()))) throw alreadyDecided();

  // Add the time with an optimistic update; retry if another change landed in between.
  for (let tries = 0; tries < 3; tries++) {
    const current = await findAttempt(attempt.id);
    if (!current || current.status !== "in_progress") break;
    const next = Math.min(MAX_COMPENSATION_SEC, current.compensationSec + found.request.gapSec);
    if (await setCompensationSec(current.id, current.compensationSec, next)) return reread();
  }
  await reopenCompensation(id); // the time was not added, so the request goes back to pending
  throw new HttpError(409, "The attempt has just finished or changed, so time can't be added. Please try again");
}
