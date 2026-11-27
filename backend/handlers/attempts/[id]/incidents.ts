// POST /api/attempts/[id]/incidents: browser-detected events. See docs/CONTRACT.md section 7.
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { reportIncident } from "@/backend/services/heartbeat.service";
import { incidentSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const attemptId = parseId((await params).id, "Attempt");
  return ok(await reportIncident(user, attemptId, await parseBody(req, incidentSchema)));
});
