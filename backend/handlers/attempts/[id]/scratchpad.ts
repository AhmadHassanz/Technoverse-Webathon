// PUT /api/attempts/[id]/scratchpad: see docs/CONTRACT.md section 7.
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { saveScratchpad } from "@/backend/services/answer.service";
import { scratchpadSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const attemptId = parseId((await params).id, "Attempt");
  return ok(await saveScratchpad(user, attemptId, await parseBody(req, scratchpadSchema)));
});
