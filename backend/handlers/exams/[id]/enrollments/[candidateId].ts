// DELETE /api/exams/[id]/enrollments/[candidateId]: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { unenroll } from "@/backend/services/enrollment.service";

export const DELETE = withErrors(
  async (_req: Request, { params }: { params: Promise<{ id: string; candidateId: string }> }) => {
    const user = await requireRole("examiner", "admin");
    const { id, candidateId } = await params;
    return ok(await unenroll(user, parseId(id, "Exam"), parseId(candidateId, "Candidate")));
  },
);
