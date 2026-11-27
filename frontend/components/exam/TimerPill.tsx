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
        "rounded-[12px] border transition-colors",
        compact ? "flex items-center gap-2 px-3 py-1.5" : "px-4 py-2",
        state === "normal" && "border-white/10 bg-white/[0.06] text-white",
        state === "low" && "border-[#f6c25c]/50 bg-[#f6c25c]/15 text-[#f6c25c]",
        state === "critical" && "animate-pulse border-[#ff8593] bg-[#ff8593] text-[#2a0a10]",
      )}
      role="timer"
      aria-label={`Time remaining ${mmss(s)}`}
    >
      {compact && <Icon className={cn("size-4", state === "normal" && "text-lime")} aria-hidden />}
      {!compact && (
        <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.1em] opacity-80">
          <Icon className={cn("size-3", state === "normal" && "text-lime")} aria-hidden />
          {state === "normal" ? "Time remaining" : state === "low" ? "Under 5 minutes" : "Under 1 minute"}
        </p>
      )}
      <p className={cn("num font-medium leading-none tracking-[-0.04em]", compact ? "text-[1.35rem]" : "mt-1 text-[1.75rem]")}>{mmss(s)}</p>
    </div>
  );
}
