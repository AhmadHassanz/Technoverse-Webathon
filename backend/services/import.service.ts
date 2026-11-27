// SERVICE layer for CSV import (candidates and questions).
// Flow for both: read + check header -> validate EVERY row with the shared zod schemas -> (dryRun stops here)
// -> write the valid rows. Invalid rows are reported (row 1 = first data row) and skipped; they never block good rows.
import { z } from "zod";
import { readCsv, type CsvRow } from "@/backend/lib/csv";
import { HttpError } from "@/backend/lib/errors";
import { createAuthUser, findExistingEmails } from "@/backend/data/users";
import { insertQuestion } from "@/backend/data/questions";
import { insertTopic, listTopics } from "@/backend/data/topics";
import { loadOwnedExam } from "@/backend/services/exams.service";
import { enrollIds } from "@/backend/services/enrollment.service";
import { emailSchema, fullNameSchema, passwordSchema, questionSchema, topicSchema } from "@/shared/validation";
import type { ImportInput, ImportResult, ImportRowError, Me, QuestionInput } from "@/shared/types";

const DEFAULT_PASSWORD = "Demo@1234";
const LETTERS = ["a", "b", "c", "d", "e", "f"] as const;

/** Run `fn` over items, a few at a time (keeps big imports fast without flooding the database). */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += limit) await Promise.all(items.slice(i, i + limit).map(fn));
}

function issueErrors(rowNo: number, issues: z.core.$ZodIssue[], fieldOf: (key: string, message: string) => string): ImportRowError[] {
  const seen = new Set<string>();
  const errors: ImportRowError[] = [];
  for (const issue of issues) {
    const key = issue.path.length ? String(issue.path[0]) : "row";
    const field = fieldOf(key, issue.message);
    if (seen.has(field)) continue; // one message per column is enough
    seen.add(field);
    errors.push({ row: rowNo, field, message: issue.message });
  }
  return errors;
}

// ---------------------------------------------------------------- candidates

const candidateRowSchema = z.object({ fullName: fullNameSchema, email: emailSchema, password: passwordSchema });
const candidateField = (k: string) => (k === "fullName" ? "full_name" : k);

export async function importCandidates(user: Me, input: ImportInput): Promise<ImportResult> {
  if (input.examId) {
    const exam = await loadOwnedExam(user, input.examId);
    if (exam.state === "completed") throw new HttpError(409, "This exam has finished, so candidates can't be enrolled");
  }
  const rows = readCsv(input.csv, ["full_name", "email"], ["password"]);

  const errors: ImportRowError[] = [];
  const valid: { rowNo: number; fullName: string; email: string; password: string }[] = [];
  const seenEmails = new Set<string>();
  rows.forEach((row, i) => {
    const rowNo = i + 1;
    const parsed = candidateRowSchema.safeParse({
      fullName: row.full_name ?? "",
      email: row.email ?? "",
      password: row.password ? row.password : DEFAULT_PASSWORD,
    });
    if (!parsed.success) return void errors.push(...issueErrors(rowNo, parsed.error.issues, candidateField));
    if (seenEmails.has(parsed.data.email)) {
      return void errors.push({ row: rowNo, field: "email", message: "This email appears more than once in the file" });
    }
    seenEmails.add(parsed.data.email);
    valid.push({ rowNo, ...parsed.data });
  });

  // Emails that already have an account are skipped (but still enrolled if they are candidates).
  const existing = await findExistingEmails(valid.map((v) => v.email));
  const fresh = valid.filter((v) => !existing.has(v.email));
  const skipped = valid.length - fresh.length;
  const toEnroll = valid.map((v) => existing.get(v.email)).filter((e) => e && e.role === "candidate" && e.isActive).map((e) => e!.id);

  let created = 0;
  if (!input.dryRun) {
    await mapLimit(fresh, 10, async (v) => {
      const { userId, error } = await createAuthUser({ email: v.email, password: v.password, fullName: v.fullName });
      if (error || !userId) {
        errors.push({ row: v.rowNo, field: "email", message: "Could not create this account" });
        return;
      }
      created++;
      toEnroll.push(userId);
    });
    if (input.examId) await enrollIds(input.examId, toEnroll);
  }

  errors.sort((a, b) => a.row - b.row);
  return { totalRows: rows.length, validRows: valid.length, created, skipped, errors };
}

// ----------------------------------------------------------------- questions

const PLACEHOLDER_TOPIC = "00000000-0000-4000-8000-000000000000"; // real topic id is filled in at write time
const questionField = (k: string, message: string) => {
  if (k === "topicId") return "topic";
  if (k === "negativeMarks") return "negative_marks";
  if (k === "multiScheme") return "multi_scheme";
  if (k === "options") return /correct/i.test(message) ? "correct" : "option_a";
  return k;
};

type ParsedQuestion = { rowNo: number; topic: string; input: QuestionInput };

/** Turn one CSV row into a QuestionInput (or a list of errors). */
function questionFromRow(row: CsvRow, rowNo: number): ParsedQuestion | ImportRowError[] {
  const errors: ImportRowError[] = [];
  const labels = LETTERS.map((l) => ({ letter: l.toUpperCase(), label: row[`option_${l}`] ?? "" })).filter((o) => o.label !== "");
  const correct = (row.correct ?? "").split(";").map((c) => c.trim().toUpperCase()).filter(Boolean);
  const unknown = correct.filter((c) => !labels.some((o) => o.letter === c));
  if (unknown.length) errors.push({ row: rowNo, field: "correct", message: `Correct answer ${unknown.join(", ")} has no matching option` });

  const topic = topicSchema.safeParse({ name: row.topic ?? "" });
  if (!topic.success) errors.push({ row: rowNo, field: "topic", message: topic.error.issues[0].message });

  const num = (v: string | undefined) => (v === undefined || v === "" ? undefined : Number(v));
  const parsed = questionSchema.safeParse({
    topicId: PLACEHOLDER_TOPIC,
    type: (row.type ?? "").toLowerCase(),
    difficulty: (row.difficulty ?? "").toLowerCase(),
    marks: row.marks === "" || row.marks === undefined ? NaN : Number(row.marks),
    stem: row.stem ?? "",
    multiScheme: row.multi_scheme ? row.multi_scheme.toLowerCase() : undefined,
    negativeMarks: num(row.negative_marks),
    options: labels.map((o) => ({ label: o.label, isCorrect: correct.includes(o.letter) })),
  });
  if (!parsed.success) errors.push(...issueErrors(rowNo, parsed.error.issues, questionField));

  const onePerField = errors.filter((e, i) => errors.findIndex((x) => x.field === e.field) === i);
  if (onePerField.length || !parsed.success || !topic.success) return onePerField;
  return { rowNo, topic: topic.data.name, input: parsed.data };
}

export async function importQuestions(user: Me, input: ImportInput): Promise<ImportResult> {
  const rows = readCsv(
    input.csv,
    ["topic", "type", "difficulty", "marks", "stem", "option_a", "option_b", "correct"],
    ["option_c", "option_d", "option_e", "option_f", "multi_scheme", "negative_marks"],
  );

  const errors: ImportRowError[] = [];
  const valid: ParsedQuestion[] = [];
  rows.forEach((row, i) => {
    const result = questionFromRow(row, i + 1);
    if (Array.isArray(result)) errors.push(...result);
    else valid.push(result);
  });

  let created = 0;
  if (!input.dryRun && valid.length) {
    // Find or create each topic once (topics belong to the importing user).
    const topicIds = new Map((await listTopics(user.id)).map((t) => [t.name, t.id]));
    for (const name of new Set(valid.map((v) => v.topic))) {
      if (topicIds.has(name)) continue;
      const { topic, error } = await insertTopic(name, user.id);
      if (error || !topic) throw error ?? new Error("Topic was not created");
      topicIds.set(name, topic.id);
    }
    await mapLimit(valid, 10, async (v) => {
      try {
        await insertQuestion({ ...v.input, topicId: topicIds.get(v.topic)! }, user.id);
        created++;
      } catch (e) {
        console.error("Question import failed for a row:", e);
        errors.push({ row: v.rowNo, field: "row", message: "Could not save this row" });
      }
    });
  }

  errors.sort((a, b) => a.row - b.row);
  return { totalRows: rows.length, validRows: valid.length, created, skipped: 0, errors };
}
