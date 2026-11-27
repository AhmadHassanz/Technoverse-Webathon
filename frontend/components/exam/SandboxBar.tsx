"use client";

import { Eye, LogOut, Loader2, RotateCcw } from "lucide-react";

/** Yellow bar shown on sandbox (preview) attempts: nothing here is counted. */
export function SandboxBar({ onReset, onExit, busy }: { onReset: () => void; onExit: () => void; busy: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/40 bg-warning-soft px-4 py-2 text-[0.8125rem] text-warning sm:px-8" role="note">
      <p className="flex items-center gap-2 font-medium">
        <Eye className="size-4" aria-hidden /> Preview mode — not counted. Candidates never see this attempt.
      </p>
      <div className="flex gap-4">
        <button type="button" onClick={onReset} disabled={busy} className="inline-flex items-center gap-1.5 font-medium hover:underline disabled:opacity-50">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Reset preview
        </button>
        <button type="button" onClick={onExit} className="inline-flex items-center gap-1.5 font-medium hover:underline">
          <LogOut className="size-3.5" /> Exit
        </button>
      </div>
    </div>
  );
}
