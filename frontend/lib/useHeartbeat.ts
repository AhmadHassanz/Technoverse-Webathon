"use client";

// Heartbeat every 15 s while the workspace is open.
// Browsers throttle normal timers in background tabs (Chrome: about once per minute after ~5 minutes),
// which would make a candidate who simply switched tabs look "offline" (the server flags gaps > 45 s).
// Timers inside a dedicated Web Worker are not throttled that way, so the tick comes from a tiny worker.
// We also beat immediately when the tab is hidden/shown again and when the connection returns.

import { useEffect, useRef } from "react";

const WORKER_SRC = (ms: number) => `setInterval(function(){postMessage(1)},${ms});`;

export function useHeartbeat(enabled: boolean, beat: () => void, intervalMs = 15000) {
  const beatRef = useRef(beat);
  useEffect(() => {
    beatRef.current = beat;
  });

  useEffect(() => {
    if (!enabled) return;
    let last = 0;
    const tick = (force = false) => {
      const now = Date.now();
      if (!force && now - last < 3000) return; // collapse bursts (blur + visibilitychange + focus)
      last = now;
      beatRef.current();
    };

    let worker: Worker | null = null;
    let workerUrl: string | null = null;
    let fallback: number | null = null;
    try {
      workerUrl = URL.createObjectURL(new Blob([WORKER_SRC(intervalMs)], { type: "text/javascript" }));
      worker = new Worker(workerUrl);
      worker.onmessage = () => tick(true);
    } catch {
      fallback = window.setInterval(() => tick(true), intervalMs);
    }

    const onVisibility = () => tick();
    const onOnline = () => tick(true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    tick(true);

    return () => {
      worker?.terminate();
      if (workerUrl) URL.revokeObjectURL(workerUrl);
      if (fallback) window.clearInterval(fallback);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [enabled, intervalMs]);
}
