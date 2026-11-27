// POST /api/exams/[id]/attempts: start (or resume) an attempt. See docs/CONTRACT.md section 7.
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId, parseOptionalBody } from "@/backend/lib/http";
import { startAttempt } from "@/backend/services/attempt.service";
import { startAttemptSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const examId = parseId((await params).id, "Exam");
  const input = await parseOptionalBody(req, startAttemptSchema); // empty body = {} = real attempt
  const result = await startAttempt(user, examId, input.sandbox === true);
  return ok(result, result.resumed ? 200 : 201);
});
