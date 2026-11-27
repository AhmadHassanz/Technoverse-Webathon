// SERVICE: heartbeat (innovation 5.3, outage detection) and browser-reported incidents.
import { effectiveEnd } from "@/backend/lib/time";
import { touchHeartbeat } from "@/backend/data/attempts";
import { hasRecentIncident, insertCompensationRequest, insertIncident, listAnnouncements } from "@/backend/data/monitoring";
import { loadOwnAttempt } from "@/backend/services/attempt.service";
import type { HeartbeatResult, IncidentInput, Me, OkResult } from "@/shared/types";

const OUTAGE_MS = 45_000; // no heartbeat for more than 45 s = the candidate was offline
const DUPLICATE_MS = 5_000; // same incident type within 5 s = one event

/**
 * POST /api/attempts/[id]/heartbeat (the workspace calls it every 15 s).
 * The gap is measured ONLY from server timestamps (last beat vs now), never from the client.
 * A gap > 45 s creates an `offline` incident + a PENDING compensation request; the examiner
 * decides in the monitor (Stage 4). Nothing is granted automatically.
 */
export async function heartbeat(user: Me, attemptId: string): Promise<HeartbeatResult> {
  const now = new Date();
  const attempt = await loadOwnAttempt(user, attemptId, now);

  if (attempt.status === "in_progress") {
    const previous = attempt.lastHeartbeatAt; // raw DB value
    // Only the request whose conditional update wins may record the outage (two tabs = one record).
    const won = await touchHeartbeat(attempt.id, previous, now.toISOString());
    if (won && previous && !attempt.isSandbox) {
      const gapMs = now.getTime() - new Date(previous).getTime();
      if (gapMs > OUTAGE_MS) {
        const gapSec = Math.round(gapMs / 1000);
        await insertIncident(attempt.id, "offline", `No connection for about ${gapSec} s`);
        await insertCompensationRequest(attempt.id, gapSec);
      }
    }
  }

  return {
    serverNow: now.toISOString(),
    endsAt: effectiveEnd(attempt).toISOString(),
    status: attempt.status,
    announcements: await listAnnouncements(attempt.examId, 50),
  };
}

/**
 * POST /api/attempts/[id]/incidents: browser-detected events (tab hidden, blur, fullscreen exit, copy/paste).
 * They are INDICATORS for a human to review, never proof, and never change scores.
 * Ignored (still "ok") for finished or sandbox attempts and for the same type within 5 s.
 */
export async function reportIncident(user: Me, attemptId: string, input: IncidentInput): Promise<OkResult> {
  const now = new Date();
  const attempt = await loadOwnAttempt(user, attemptId, now);
  if (attempt.status !== "in_progress" || attempt.isSandbox) return { ok: true };
  const since = new Date(now.getTime() - DUPLICATE_MS).toISOString();
  if (await hasRecentIncident(attempt.id, input.type, since)) return { ok: true };
  await insertIncident(attempt.id, input.type, input.detail ? input.detail : null);
  return { ok: true };
}
