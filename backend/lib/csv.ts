// CSV reading for the two import endpoints (papaparse wrapper).
// It checks the limits (1 MB, 500 rows) and the header BEFORE any row is looked at.
import Papa from "papaparse";
import { HttpError } from "@/backend/lib/errors";

export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_CSV_ROWS = 500;

export type CsvRow = Record<string, string>;

/**
 * Parse CSV text into rows (row 1 = first data row).
 * `required` columns must exist; `optional` columns may exist; any other column is rejected.
 */
export function readCsv(text: string, required: string[], optional: string[]): CsvRow[] {
  if (Buffer.byteLength(text, "utf8") > MAX_CSV_BYTES) throw new HttpError(400, "The CSV file is larger than 1 MB");

  const parsed = Papa.parse<CsvRow>(text.replace(/^﻿/, ""), {
    header: true,
    delimiter: ",",
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });

  if (parsed.errors.some((e) => e.type === "Quotes")) {
    throw new HttpError(400, "The CSV has a quote that is never closed");
  }
  const header = parsed.meta.fields ?? [];
  const missing = required.filter((c) => !header.includes(c));
  const unknown = header.filter((c) => ![...required, ...optional].includes(c));
  if (missing.length || unknown.length) {
    const parts = [];
    if (missing.length) parts.push(`missing column(s): ${missing.join(", ")}`);
    if (unknown.length) parts.push(`unknown column(s): ${unknown.join(", ")}`);
    throw new HttpError(400, `Wrong CSV header (${parts.join("; ")}). Expected: ${[...required, ...optional].join(",")}`, {
      csv: "The first line must be the exact header from the guide",
    });
  }
  if (parsed.data.length === 0) throw new HttpError(400, "The CSV has no data rows", { csv: "No data rows" });
  if (parsed.data.length > MAX_CSV_ROWS) throw new HttpError(400, `The CSV has more than ${MAX_CSV_ROWS} rows`, { csv: "Too many rows" });
  return parsed.data;
}
