// POST /api/exams/[id]/publish: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { publishExam } from "@/backend/services/assembly.service";

export const POST = withErrors(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("examiner", "admin");
  return ok(await publishExam(user, parseId((await params).id, "Exam")));
});
