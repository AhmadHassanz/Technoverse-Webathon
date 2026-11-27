"use client";

import { AlarmClock, Clock } from "lucide-react";
import { mmss } from "@/frontend/lib/format";
import { cn } from "@/frontend/lib/utils";

/** Countdown from the server clock. Amber under 5 min, red under 1 min (with icon + text, not colour only). */
export function TimerPill({ remainingMs, compact }: { remainingMs: number; compact?: boolean }) {
  const s = Math.max(0, Math.floor(remainingMs / 1000));
  const state = s < 60 ? "critical" : s < 300 ? "low" : "normal";
  const Icon = state === "normal" ? Clock : AlarmClock;

  return (
    <div
      className={cn(
        "rounded-[8px] border",
        compact ? "px-3 py-1.5" : "px-4 py-2.5",
        state === "normal" && "border-cobalt bg-cobalt text-on-cobalt",
        state === "low" && "border-warning bg-warning-soft text-warning",
        state === "critical" && "border-danger bg-danger text-on-danger",
      )}
      role="timer"
      aria-label={`Time remaining ${mmss(s)}`}
    >
      {!compact && (
        <p className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-[0.08em] opacity-85">
          <Icon className="size-3" aria-hidden />
          {state === "normal" ? "Time remaining" : state === "low" ? "Under 5 minutes" : "Under 1 minute"}
        </p>
      )}
      <p className={cn("num leading-none", compact ? "text-[1.5rem]" : "mt-1 text-[2rem]")}>{mmss(s)}</p>
    </div>
  );
}
