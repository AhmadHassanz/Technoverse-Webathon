"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { THEME_OPTIONS } from "@/frontend/lib/themes";
import { ThemeSwatch } from "@/frontend/components/shell/ThemePicker";
import type { Preferences } from "@/shared/types";

const SHORTCUTS: [string, string][] = [
  ["← / →", "Previous / next question"],
  ["1 – 6", "Choose option 1 to 6"],
  ["F", "Flag for review"],
  ["S", "Open scratchpad"],
];

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="meta-label">{label}</p>
      <div role="radiogroup" aria-label={label} className="mt-2 grid gap-1 rounded-md border border-line bg-sand p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn("h-8 rounded-[5px] text-[0.8125rem]", value === o.value ? "bg-surface font-medium text-cobalt" : "text-mute hover:text-ink")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Workspace settings: applied instantly and saved with PATCH /api/me/preferences. */
export function SettingsPopover({
  open,
  onClose,
  prefs,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  prefs: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Workspace settings"
      className="fixed inset-x-3 bottom-3 z-[85] max-h-[85vh] overflow-y-auto rounded-[10px] border border-line bg-surface p-5 shadow-[0_24px_60px_-30px_rgba(19,40,70,0.5)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[340px]"
    >
      <div className="flex items-center justify-between">
        <p className="display text-[1.35rem]">Settings</p>
        <button type="button" aria-label="Close settings" onClick={onClose} className="rounded p-1 text-mute hover:bg-sand">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <p className="meta-label">Theme</p>
          <div role="radiogroup" aria-label="Theme" className="mt-2 grid grid-cols-2 gap-2">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={prefs.theme === t.value}
                onClick={() => onChange({ theme: t.value })}
                className={cn(
                  "flex items-center gap-2 rounded-md border p-1.5 pr-2 text-left text-[0.8125rem]",
                  prefs.theme === t.value ? "border-ink bg-sand font-medium text-ink" : "border-line text-mute hover:text-ink",
                )}
              >
                <ThemeSwatch swatch={t.swatch} className="size-7 rounded-[7px]" />
                <span className="min-w-0 truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Segmented
          label="Text size"
          value={prefs.fontScale}
          onChange={(v) => onChange({ fontScale: v })}
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
          ]}
        />
        <Segmented
          label="Navigator side"
          value={prefs.navigatorSide}
          onChange={(v) => onChange({ navigatorSide: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
          ]}
        />
        <Segmented
          label="Layout"
          value={prefs.layout}
          onChange={(v) => onChange({ layout: v })}
          options={[
            { value: "single", label: "One at a time" },
            { value: "scroll", label: "All in one page" },
          ]}
        />
        <div>
          <p className="meta-label">Keyboard shortcuts</p>
          <dl className="mt-2 space-y-1.5 text-[0.8125rem]">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="num rounded bg-sand px-1.5 text-ink">{k}</dt>
                <dd className="text-mute">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
