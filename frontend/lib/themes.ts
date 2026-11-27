// The themes a user can pick. `swatch` = [page background, card, main accent] shown in the picker.
// The real colours live in app/globals.css ([data-theme="..."]); these are only previews.
import type { Preferences } from "@/shared/types";

export type ThemeName = Preferences["theme"];

export const THEME_OPTIONS: { value: ThemeName; label: string; note: string; swatch: [string, string, string] }[] = [
  { value: "light", label: "Light", note: "Clean and calm", swatch: ["#f8f7f4", "#fffffe", "#1b1918"] },
  { value: "dark", label: "Dark", note: "Charcoal, easy at night", swatch: ["#171615", "#1f1e1c", "#f1eee9"] },
  { value: "sepia", label: "Sepia", note: "Warm paper for long reading", swatch: ["#f4ecd8", "#fbf6e9", "#9a4a22"] },
  { value: "ocean", label: "Ocean", note: "Cool white and blue", swatch: ["#f1f6fb", "#ffffff", "#1f5fbf"] },
  { value: "forest", label: "Forest", note: "Deep green, mint accent", swatch: ["#0f1a14", "#15231b", "#6fcf97"] },
  { value: "midnight", label: "Midnight", note: "Navy with a soft blue", swatch: ["#0c1222", "#121a30", "#7aa2ff"] },
  { value: "contrast", label: "High contrast", note: "Black and yellow, thick borders", swatch: ["#060606", "#060606", "#ffd400"] },
];

export function themeLabel(value: ThemeName | undefined): string {
  return THEME_OPTIONS.find((t) => t.value === value)?.label ?? "Light";
}
