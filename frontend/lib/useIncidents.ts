"use client";

// Reports browser "indicators" (never proof of cheating) for the examiner's monitor.
// Fire-and-forget: a failed report never blocks or bothers the candidate.
// The server ignores duplicates within 5 s, finished attempts and sandbox previews.

import { useEffect } from "react";
import { apiPost } from "./api-client";
import type { ClientIncidentType } from "@/shared/types";

export function reportIncident(attemptId: string, type: ClientIncidentType, detail?: string) {
  apiPost(`/api/attempts/${attemptId}/incidents`, detail ? { type, detail } : { type }, { keepalive: true }).catch(() => {});
}

export function useIncidents(attemptId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let wasFullscreen = Boolean(document.fullscreenElement);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") reportIncident(attemptId, "tab_hidden", "Tab or window hidden");
    };
    const onBlur = () => {
      // Hidden tabs already report tab_hidden; blur alone = another window took focus.
      if (document.visibilityState === "visible") reportIncident(attemptId, "window_blur", "Exam window lost focus");
    };
    const onPaste = () => reportIncident(attemptId, "copy_paste", "Pasted text");
    const onCopy = () => reportIncident(attemptId, "copy_paste", "Copied text");
    const onFullscreen = () => {
      const now = Boolean(document.fullscreenElement);
      if (wasFullscreen && !now) reportIncident(attemptId, "fullscreen_exit", "Left full screen");
      wasFullscreen = now;
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [attemptId, enabled]);
}
