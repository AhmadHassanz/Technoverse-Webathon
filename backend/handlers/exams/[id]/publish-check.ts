// GET /api/exams/[id]/publish-check: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { checkExam } from "@/backend/services/assembly.service";

export const GET = withErrors(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await checkExam(user, parseId((await params).id, "Exam")));
});
