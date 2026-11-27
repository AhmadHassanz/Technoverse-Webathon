// SERVICE layer for exams: permission checks + rules (only drafts can be edited or deleted).
import { assertOwner } from "@/backend/lib/auth";
import { HttpError } from "@/backend/lib/errors";
import { deleteExamRow, findExam, insertExam, listExams, listPool, updateExamRow } from "@/backend/data/exams";
import { examSchema } from "@/shared/validation";
import type { Exam, ExamDetail, ExamInput, Me, OkResult } from "@/shared/types";

/** Load an exam and check the caller owns it (404 / 403). */
export async function loadOwnedExam(user: Me, id: string): Promise<Exam> {
  const found = await findExam(id);
  if (!found) throw new HttpError(404, "Exam not found");
  assertOwner(user, found.createdBy);
  return found.exam;
}

function assertDraft(exam: Exam, action: string) {
  if (exam.state !== "draft") throw new HttpError(409, `Only draft exams can be ${action}`);
}

export function getExams(user: Me): Promise<Exam[]> {
  return listExams(user.role === "admin" ? undefined : user.id);
}

export async function createExam(user: Me, input: ExamInput): Promise<Exam> {
  const id = await insertExam(input, user.id);
  return loadOwnedExam(user, id);
}

export async function getExamDetail(user: Me, id: string): Promise<ExamDetail> {
  const exam = await loadOwnedExam(user, id);
  return { ...exam, questions: await listPool(id) };
}

/** PATCH: merge the changes into the saved exam, then re-check ALL the rules on the merged result. */
export async function updateExam(user: Me, id: string, patch: Partial<ExamInput>): Promise<Exam> {
  const exam = await loadOwnedExam(user, id);
  assertDraft(exam, "edited");
  if (Object.keys(patch).length === 0) throw new HttpError(400, "Nothing to update");
  const merged = examSchema.parse({
    title: exam.title,
    instructions: exam.instructions,
    startAt: exam.startAt,
    endAt: exam.endAt,
    durationMin: exam.durationMin,
    totalMarks: exam.totalMarks,
    passMarks: exam.passMarks,
    shuffleQuestions: exam.shuffleQuestions,
    shuffleOptions: exam.shuffleOptions,
    ...patch,
  }); // a ZodError here becomes a 400 with fields
  await updateExamRow(id, merged);
  return loadOwnedExam(user, id);
}

export async function deleteExam(user: Me, id: string): Promise<OkResult> {
  const exam = await loadOwnedExam(user, id);
  assertDraft(exam, "deleted");
  await deleteExamRow(id);
  return { ok: true };
}
