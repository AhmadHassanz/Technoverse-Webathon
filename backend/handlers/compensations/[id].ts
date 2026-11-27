// PATCH /api/compensations/[id]: approve or reject outage compensation. See docs/CONTRACT.md section 8.
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { decideCompensation } from "@/backend/services/monitor.service";
import { compensationDecisionSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  const id = parseId((await params).id, "Request");
  const { decision } = await parseBody(req, compensationDecisionSchema);
  return ok(await decideCompensation(user, id, decision));
});
