// PATCH /api/attempt-questions/[aqId]/grade: grade one written answer. See docs/CONTRACT.md section 9.
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { gradeAnswer } from "@/backend/services/results.service";
import { gradeSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ aqId: string }> };

export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  const aqId = parseId((await params).aqId, "Answer");
  return ok(await gradeAnswer(user, aqId, await parseBody(req, gradeSchema)));
});
