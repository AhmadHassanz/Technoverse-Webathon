// GET /api/exams/[id]/grading?status=pending|all: the written-answer queue. See docs/CONTRACT.md section 9.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId, parseQuery } from "@/backend/lib/http";
import { getGradingQueue } from "@/backend/services/results.service";
import { gradingQuerySchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  const examId = parseId((await params).id, "Exam");
  const { status } = parseQuery(req, gradingQuerySchema);
  return ok(await getGradingQueue(user, examId, status));
});
