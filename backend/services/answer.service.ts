// SERVICE: saving answers (one at a time, or a whole offline outbox) and the scratchpad.
// Time and permission checks happen here; the newest-wins save itself is ONE atomic SQL function.
import { HttpError } from "@/backend/lib/errors";
import { effectiveEnd } from "@/backend/lib/time";
import type { Snapshot } from "@/backend/lib/grading";
import { findPaperQuestion, listPaper } from "@/backend/data/attempts";
import { saveAnswerAtomic, upsertScratchpad } from "@/backend/data/answers";
import { insertIncident } from "@/backend/data/monitoring";
import { assertOpen, isOpen, loadOwnAttempt } from "@/backend/services/attempt.service";
import type { AnswerInput, Me, SaveResult, ScratchpadInput, SyncInput, SyncResult } from "@/shared/types";

/**
 * Check an answer against the FROZEN question: options must belong to it, single choice = max 1,
 * written = no options. Returns the cleaned answer, or an error message.
 */
function cleanAnswer(q: Snapshot, input: AnswerInput): { selected: string[]; text: string } | { error: string } {
  const selected = [...new Set(input.selectedOptionIds)];
  if (q.type === "written") {
    if (selected.length) return { error: "Written questions have no options" };
    return { selected: [], text: input.textAnswer };
  }
  const known = new Set(q.options.map((o) => o.id));
  if (selected.some((id) => !known.has(id))) return { error: "Some selected options do not belong to this question" };
  if (q.type === "mcq_single" && selected.length > 1) return { error: "Select only one option for this question" };
  return { selected, text: "" }; // objective questions never store text
}

/** PUT /api/attempts/[id]/answers/[aqId] */
export async function saveAnswer(user: Me, attemptId: string, aqId: string, input: AnswerInput): Promise<SaveResult> {
  const now = new Date();
  const attempt = await loadOwnAttempt(user, attemptId, now);
  assertOpen(attempt, now); // 410 after submit or after deadline + 5 s grace

  const question = await findPaperQuestion(attempt.id, aqId);
  if (!question) throw new HttpError(404, "Question not found in this attempt");

  const clean = cleanAnswer(question.snapshot, input);
  if ("error" in clean) throw new HttpError(400, clean.error, { selectedOptionIds: clean.error });

  const accepted = await saveAnswerAtomic({
    attemptId: attempt.id,
    aqId,
    selectedOptionIds: clean.selected,
    textAnswer: clean.text,
    flagged: input.flagged,
    clientSeq: input.clientSeq,
  });
  // accepted = false is NOT an error: the server already has a newer save from this browser.
  return { aqId, accepted, savedAt: now.toISOString(), serverNow: now.toISOString(), endsAt: effectiveEnd(attempt).toISOString() };
}

/**
 * POST /api/attempts/[id]/sync: replay the offline outbox through the same rules.
 * Never 410: a closed attempt answers 200 with every item "late" (and ONE late_sync incident),
 * because client timestamps are never trusted to prove an answer was written in time.
 */
export async function syncAnswers(user: Me, attemptId: string, input: SyncInput): Promise<SyncResult> {
  const now = new Date();
  const attempt = await loadOwnAttempt(user, attemptId, now);
  const results: SyncResult["results"] = input.answers.map((a) => ({ aqId: a.aqId, accepted: false, reason: "late" }));

  if (!isOpen(attempt, now)) {
    if (input.answers.length && !attempt.isSandbox) {
      await insertIncident(attempt.id, "late_sync", `${input.answers.length} offline answer(s) arrived after the attempt ended`);
    }
    return { results, serverNow: now.toISOString(), endsAt: effectiveEnd(attempt).toISOString(), status: attempt.status };
  }

  const paper = new Map((await listPaper(attempt.id)).map((q) => [q.aqId, q]));

  // Group by question; inside one question replay oldest -> newest (ascending clientSeq).
  // Different questions are independent, so they are saved in parallel.
  const groups = new Map<string, number[]>();
  input.answers.forEach((a, i) => groups.set(a.aqId, [...(groups.get(a.aqId) ?? []), i]));

  await Promise.all(
    [...groups.entries()].map(async ([aqId, indexes]) => {
      indexes.sort((x, y) => input.answers[x].clientSeq - input.answers[y].clientSeq);
      const question = paper.get(aqId);
      for (const i of indexes) {
        const item = input.answers[i];
        const clean = question ? cleanAnswer(question.snapshot, item) : null;
        if (!clean || "error" in clean) {
          results[i] = { aqId, accepted: false, reason: "invalid" };
          continue;
        }
        const accepted = await saveAnswerAtomic({
          attemptId: attempt.id,
          aqId,
          selectedOptionIds: clean.selected,
          textAnswer: clean.text,
          flagged: item.flagged,
          clientSeq: item.clientSeq,
        });
        results[i] = { aqId, accepted, reason: accepted ? null : "stale" };
      }
    }),
  );

  return { results, serverNow: now.toISOString(), endsAt: effectiveEnd(attempt).toISOString(), status: attempt.status };
}

/** PUT /api/attempts/[id]/scratchpad */
export async function saveScratchpad(user: Me, attemptId: string, input: ScratchpadInput): Promise<{ savedAt: string }> {
  const now = new Date();
  const attempt = await loadOwnAttempt(user, attemptId, now);
  assertOpen(attempt, now);
  await upsertScratchpad(attempt.id, input.text, input.drawing, now.toISOString());
  return { savedAt: now.toISOString() };
}
