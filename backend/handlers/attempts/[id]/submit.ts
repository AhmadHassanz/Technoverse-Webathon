// POST /api/attempts/[id]/submit: idempotent, safe to call twice. See docs/CONTRACT.md section 7.
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { submitAttempt } from "@/backend/services/attempt.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  return ok(await submitAttempt(user, parseId((await params).id, "Attempt")));
});
