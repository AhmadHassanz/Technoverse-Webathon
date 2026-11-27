// PATCH /api/incidents/[id]: mark an incident reviewed. See docs/CONTRACT.md section 8.
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { reviewIncident } from "@/backend/services/monitor.service";
import { incidentReviewSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  const id = parseId((await params).id, "Incident");
  return ok(await reviewIncident(user, id, await parseBody(req, incidentReviewSchema)));
});
