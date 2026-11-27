// GET, POST /api/exams: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody } from "@/backend/lib/http";
import { createExam, getExams } from "@/backend/services/exams.service";
import { examSchema } from "@/shared/validation";

export const GET = withErrors(async () => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await getExams(user));
});

export const POST = withErrors(async (req: Request) => {
  const user = await requireRole("examiner", "admin");
  const input = await parseBody(req, examSchema);
  return ok(await createExam(user, input), 201);
});
