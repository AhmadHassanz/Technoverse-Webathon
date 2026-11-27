// GET, PATCH, DELETE /api/questions/[id]: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { getQuestion, removeQuestion, updateQuestion } from "@/backend/services/questions.service";
import { questionSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await getQuestion(user, parseId((await params).id, "Question")));
});

export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  const id = parseId((await params).id, "Question");
  return ok(await updateQuestion(user, id, await parseBody(req, questionSchema)));
});

export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  return ok(await removeQuestion(user, parseId((await params).id, "Question")));
});
