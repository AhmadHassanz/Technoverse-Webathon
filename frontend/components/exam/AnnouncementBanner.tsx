"use client";

import { Megaphone, X } from "lucide-react";
import { fmtTime } from "@/frontend/lib/format";
import type { Announcement } from "@/shared/types";

/** New examiner announcements (from the attempt + every heartbeat). Dismissible; the list stays available. */
export function AnnouncementBanner({
  items,
  dismissed,
  onDismiss,
}: {
  items: Announcement[];
  dismissed: Set<string>;
  onDismiss: (id: string) => void;
}) {
  const open = items.filter((a) => !dismissed.has(a.id));
  if (open.length === 0) return null;
  return (
    <div className="border-b border-cobalt/30 bg-tint px-4 py-2.5 sm:px-8" role="status" aria-live="polite">
      {open.map((a) => (
        <div key={a.id} className="flex items-start gap-3 py-1 text-[0.875rem] text-cobalt">
          <Megaphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="flex-1">
            <span className="font-medium">Announcement from your examiner at {fmtTime(a.createdAt)}: </span>
            {a.message}
          </p>
          <button type="button" aria-label="Dismiss announcement" onClick={() => onDismiss(a.id)} className="rounded p-0.5 hover:bg-tint-strong">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
