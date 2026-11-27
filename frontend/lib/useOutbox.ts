"use client";

// Offline-safe answer saving for the exam workspace (FRONTEND_PLAN section 7).
// Every change is written to localStorage FIRST (outbox:<attemptId>), then sent.
// An entry leaves the outbox only after the server has confirmed it (or said it is stale / invalid / late),
// so a refresh, a crash or a lost connection never loses an answer.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { apiPost, apiPut, toApiError } from "./api-client";
import type { Answer, AnswerInput, AttemptStatus, SaveResult, SyncResult } from "@/shared/types";

export type OutboxEntry = AnswerInput & { aqId: string };
export type ServerClock = { serverNow: string; endsAt: string };

const outboxKey = (id: string) => `outbox:${id}`;
const seqKey = (id: string) => `seq:${id}`;

export function readOutbox(attemptId: string): Record<string, OutboxEntry> {
  try {
    return JSON.parse(window.localStorage.getItem(outboxKey(attemptId)) || "{}");
  } catch {
    return {};
  }
}

function writeOutbox(attemptId: string, box: Record<string, OutboxEntry>) {
  try {
    if (Object.keys(box).length) window.localStorage.setItem(outboxKey(attemptId), JSON.stringify(box));
    else window.localStorage.removeItem(outboxKey(attemptId));
  } catch {
    // storage full or blocked: the answer is still sent directly
  }
}

function readSeq(attemptId: string): number {
  try {
    return Number(window.localStorage.getItem(seqKey(attemptId))) || 0;
  } catch {
    return 0;
  }
}

/** Forget everything stored for a finished attempt. */
export function clearAttemptStorage(attemptId: string) {
  try {
    window.localStorage.removeItem(outboxKey(attemptId));
    window.localStorage.removeItem(seqKey(attemptId));
  } catch {
    // ignore
  }
}

// navigator.onLine as a React value (no effects needed).
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useBrowserOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}

type Handlers = {
  onClock: (c: ServerClock) => void;
  onEnded: (status?: AttemptStatus) => void;
  onLate: () => void;
  onInvalid: () => void;
};

const MAX_SYNC = 200;

export function useOutbox(attemptId: string, handlers: Handlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const browserOnline = useBrowserOnline();
  const [count, setCount] = useState(0);
  const [inflight, setInflight] = useState(0);
  const [netDown, setNetDown] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const seqRef = useRef(0);
  const sending = useRef(new Set<string>());
  const timers = useRef(new Map<string, number>());
  const flushing = useRef(false);

  const refreshCount = useCallback(() => setCount(Object.keys(readOutbox(attemptId)).length), [attemptId]);

  /** Remove the outbox entry for aqId if the server now has this (or a newer) version of it. */
  const settle = useCallback(
    (aqId: string, sentSeq: number) => {
      const box = readOutbox(attemptId);
      if (box[aqId] && box[aqId].clientSeq <= sentSeq) {
        delete box[aqId];
        writeOutbox(attemptId, box);
      }
      refreshCount();
    },
    [attemptId, refreshCount],
  );

  /**
   * Call once after GET /api/attempts/[id]. Sets the clientSeq counter to the highest number seen
   * (local counter, server answers, outbox), and returns the server answers merged with the outbox
   * (the outbox wins when its clientSeq is higher).
   */
  const init = useCallback(
    (serverAnswers: Answer[]): Record<string, OutboxEntry> => {
      const box = readOutbox(attemptId);
      const merged: Record<string, OutboxEntry> = {};
      for (const a of serverAnswers) {
        merged[a.aqId] = {
          aqId: a.aqId,
          selectedOptionIds: a.selectedOptionIds,
          textAnswer: a.textAnswer,
          flagged: a.flagged,
          clientSeq: a.clientSeq,
        };
      }
      for (const entry of Object.values(box)) {
        const server = merged[entry.aqId];
        if (!server || entry.clientSeq > server.clientSeq) merged[entry.aqId] = entry;
        else delete box[entry.aqId]; // the server already has it (or newer)
      }
      writeOutbox(attemptId, box);
      seqRef.current = Math.max(
        readSeq(attemptId),
        ...serverAnswers.map((a) => a.clientSeq),
        ...Object.values(box).map((e) => e.clientSeq),
        0,
      );
      refreshCount();
      return merged;
    },
    [attemptId, refreshCount],
  );

  const nextSeq = useCallback(() => {
    seqRef.current = Math.max(seqRef.current, readSeq(attemptId)) + 1;
    try {
      window.localStorage.setItem(seqKey(attemptId), String(seqRef.current));
    } catch {
      // ignore
    }
    return seqRef.current;
  }, [attemptId]);

  const sendOne = useCallback(
    async (aqId: string) => {
      if (sending.current.has(aqId)) return; // the running loop below picks up newer versions
      sending.current.add(aqId);
      setInflight((n) => n + 1);
      try {
        for (let round = 0; round < 5; round++) {
          const entry = readOutbox(attemptId)[aqId];
          if (!entry) break;
          try {
            const res = await apiPut<SaveResult>(`/api/attempts/${attemptId}/answers/${aqId}`, {
              selectedOptionIds: entry.selectedOptionIds,
              textAnswer: entry.textAnswer,
              flagged: entry.flagged,
              clientSeq: entry.clientSeq,
            });
            setNetDown(false);
            settle(aqId, entry.clientSeq); // accepted true or false: either way the server has it
            handlersRef.current.onClock(res);
          } catch (err) {
            const e = toApiError(err);
            if (e.status === 0) setNetDown(true); // keep it; it is synced later
            else if (e.status === 410) handlersRef.current.onEnded();
            else if (e.status === 400) {
              settle(aqId, entry.clientSeq);
              handlersRef.current.onInvalid();
            }
            break; // 403/500: stays in the outbox, retried by the next sync
          }
        }
      } finally {
        sending.current.delete(aqId);
        setInflight((n) => n - 1);
      }
    },
    [attemptId, settle],
  );

  /** Store the change locally, then send it (immediately, or after 800 ms for typing). */
  const queue = useCallback(
    (entry: OutboxEntry, debounce: boolean) => {
      const box = readOutbox(attemptId);
      box[entry.aqId] = entry;
      writeOutbox(attemptId, box);
      refreshCount();
      const old = timers.current.get(entry.aqId);
      if (old) window.clearTimeout(old);
      if (debounce) {
        timers.current.set(
          entry.aqId,
          window.setTimeout(() => {
            timers.current.delete(entry.aqId);
            void sendOne(entry.aqId);
          }, 800),
        );
      } else {
        timers.current.delete(entry.aqId);
        void sendOne(entry.aqId);
      }
    },
    [attemptId, refreshCount, sendOne],
  );

  /** Replay the whole outbox with POST /sync (on reconnect, every heartbeat, on load, before submit). */
  const flush = useCallback(async () => {
    if (flushing.current) return;
    const entries = Object.values(readOutbox(attemptId));
    if (!entries.length) return;
    flushing.current = true;
    setSyncing(true);
    try {
      for (let i = 0; i < entries.length; i += MAX_SYNC) {
        const chunk = entries.slice(i, i + MAX_SYNC);
        const res = await apiPost<SyncResult>(`/api/attempts/${attemptId}/sync`, { answers: chunk });
        setNetDown(false);
        handlersRef.current.onClock(res);
        let late = false;
        for (const r of res.results) {
          const sent = chunk.find((c) => c.aqId === r.aqId);
          if (r.reason === "late") late = true;
          if (sent) settle(r.aqId, sent.clientSeq);
        }
        if (late) handlersRef.current.onLate();
        if (res.status !== "in_progress") {
          handlersRef.current.onEnded(res.status);
          break;
        }
      }
    } catch (err) {
      if (toApiError(err).status === 0) setNetDown(true);
    } finally {
      flushing.current = false;
      setSyncing(false);
    }
  }, [attemptId, settle]);

  // Send whatever is waiting as soon as the browser says we're back online.
  useEffect(() => {
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flush]);

  // Stop pending debounce timers when leaving the page (the outbox keeps the data).
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  return {
    count,
    saving: inflight > 0,
    syncing,
    offline: !browserOnline || netDown,
    init,
    nextSeq,
    queue,
    flush,
  };
}
