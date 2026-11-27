"use client";

import { Check, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

export type SaveState = "saved" | "saving" | "offline" | "reconnecting";

/** Always tells the truth about what is saved. Lives in an aria-live region. */
export function SaveStatusPill({ state, pending, className }: { state: SaveState; pending: number; className?: string }) {
  const map = {
    saved: { Icon: Check, text: "All answers saved", cls: "bg-success-soft text-success" },
    saving: { Icon: Loader2, text: "Saving…", cls: "bg-sand text-mute" },
    offline: { Icon: CloudOff, text: `Offline · ${pending} on device`, cls: "bg-danger-soft text-danger" },
    reconnecting: { Icon: RefreshCw, text: `Syncing ${pending} answer${pending === 1 ? "" : "s"}…`, cls: "bg-tint text-cobalt" },
  }[state];
  const { Icon } = map;
  return (
    <p
      aria-live="polite"
      className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-medium", map.cls, className)}
    >
      <Icon className={cn("size-3.5", (state === "saving" || state === "reconnecting") && "animate-spin")} aria-hidden />
      {map.text}
    </p>
  );
}
