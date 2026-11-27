// POST /api/exams/[id]/results/publish: see docs/CONTRACT.md section 9.
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { publishResults } from "@/backend/services/results.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  return ok(await publishResults(user, parseId((await params).id, "Exam")));
});
