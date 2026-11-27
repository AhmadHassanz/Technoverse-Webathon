// GET /api/exams/[id]/analytics: see docs/CONTRACT.md section 9.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { getAnalytics } from "@/backend/services/results.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await getAnalytics(user, parseId((await params).id, "Exam")));
});
