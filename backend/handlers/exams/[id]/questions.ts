// PUT /api/exams/[id]/questions: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { setExamQuestions } from "@/backend/services/assembly.service";
import { examQuestionsSchema } from "@/shared/validation";

export const PUT = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await requireRole("examiner", "admin");
  const id = parseId((await params).id, "Exam");
  return ok(await setExamQuestions(user, id, await parseBody(req, examQuestionsSchema)));
});
