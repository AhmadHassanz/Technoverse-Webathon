// GET, PATCH, DELETE /api/exams/[id]: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { deleteExam, getExamDetail, updateExam } from "@/backend/services/exams.service";
import { examPatchSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await getExamDetail(user, parseId((await params).id, "Exam")));
});

export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  const id = parseId((await params).id, "Exam");
  return ok(await updateExam(user, id, await parseBody(req, examPatchSchema)));
});

export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  return ok(await deleteExam(user, parseId((await params).id, "Exam")));
});
