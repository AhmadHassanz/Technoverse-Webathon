// Small form helpers shared by every page.
import type { z } from "zod";

/** Turn a zod error into { field: "first message" } so each input can show its own message. */
export function zodFields(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** "" -> NaN-safe number for controlled number inputs. */
export function num(value: string): number {
  return value.trim() === "" ? Number.NaN : Number(value);
}
