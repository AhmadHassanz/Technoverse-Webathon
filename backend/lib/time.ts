// Time rules for attempts. The SERVER clock decides; the device clock is never trusted.
export const GRACE_MS = 5000; // network grace for a save already in flight when time ran out

export type AttemptTiming = {
  status: string;
  endsAt: string; // base deadline
  compensationSec: number; // approved outage compensation
};

/** Real deadline = base deadline + approved compensation. This is the `endsAt` the frontend sees. */
export function effectiveEnd(attempt: Pick<AttemptTiming, "endsAt" | "compensationSec">): Date {
  return new Date(new Date(attempt.endsAt).getTime() + attempt.compensationSec * 1000);
}

/** True when the attempt is still open but the deadline + grace has passed (must be auto-submitted). */
export function isExpired(attempt: AttemptTiming, now: Date = new Date()): boolean {
  return attempt.status === "in_progress" && now.getTime() > effectiveEnd(attempt).getTime() + GRACE_MS;
}

/** Exam state is DERIVED from status + clock, never stored (so it can never be out of sync). */
export function examState(
  exam: { status: "draft" | "published"; startAt: string; endAt: string },
  now: Date = new Date(),
): "draft" | "published" | "ongoing" | "completed" {
  if (exam.status === "draft") return "draft";
  if (now < new Date(exam.startAt)) return "published";
  if (now < new Date(exam.endAt)) return "ongoing";
  return "completed";
}
