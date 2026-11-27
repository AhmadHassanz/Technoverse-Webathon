// GET /api/me/results/[examId]: the candidate's own published result. See docs/CONTRACT.md section 6.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { getMyResult } from "@/backend/services/results.service";

type Ctx = { params: Promise<{ examId: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireRole("candidate");
  return ok(await getMyResult(user, parseId((await params).examId, "Exam")));
});
