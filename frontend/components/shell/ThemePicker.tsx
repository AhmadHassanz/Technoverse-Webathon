"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useAuth } from "@/frontend/lib/auth";
import { THEME_OPTIONS, themeLabel, type ThemeName } from "@/frontend/lib/themes";

/** A little preview of a theme: page colour, card colour and accent colour. */
export function ThemeSwatch({ swatch, className }: { swatch: [string, string, string]; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex size-9 shrink-0 overflow-hidden rounded-[10px] border border-line-strong", className)}
      style={{ background: swatch[0] }}
    >
      <span className="absolute inset-x-1.5 bottom-1.5 top-3 rounded-[4px]" style={{ background: swatch[1], boxShadow: "0 0 0 1px rgb(128 128 128 / 0.25)" }} />
      <span className="absolute left-2.5 top-1 h-1.5 w-4 rounded-full" style={{ background: swatch[2] }} />
    </span>
  );
}

/** Theme menu in the app header (all roles). Applies at once, then saves to the account. */
export function ThemePicker() {
  const { me, updatePreferences } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current: ThemeName = me?.preferences.theme ?? "light";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="sm:relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${themeLabel(current)}. Change theme`}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface pl-3 pr-3.5 text-[0.8125rem] font-medium text-ink transition-colors hover:border-line-strong"
      >
        <Palette className="size-4 text-mute" />
        <span className="hidden sm:inline">{themeLabel(current)}</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Theme"
          className="absolute inset-x-3 top-full z-[80] mt-1 rounded-[16px] border border-line bg-surface p-2 shadow-pop sm:inset-x-auto sm:right-0 sm:mt-2 sm:w-[19rem]"
        >
          <p className="meta-label px-2.5 pb-1.5 pt-1.5">Choose a theme</p>
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="option"
              aria-selected={current === t.value}
              onClick={() => {
                void updatePreferences({ theme: t.value }).catch(() => undefined);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-sand",
                current === t.value && "bg-sand",
              )}
            >
              <ThemeSwatch swatch={t.swatch} />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.875rem] font-medium text-ink">{t.label}</span>
                <span className="block truncate text-[0.75rem] text-mute">{t.note}</span>
              </span>
              {current === t.value && <Check className="size-4 shrink-0 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
