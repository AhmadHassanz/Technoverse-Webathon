// PUT /api/attempts/[id]/answers/[aqId]: autosave one answer. See docs/CONTRACT.md section 7.
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { saveAnswer } from "@/backend/services/answer.service";
import { answerSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string; aqId: string }> };

export const PUT = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, aqId } = await params;
  const attemptId = parseId(id, "Attempt");
  const questionId = parseId(aqId, "Question");
  return ok(await saveAnswer(user, attemptId, questionId, await parseBody(req, answerSchema)));
});
