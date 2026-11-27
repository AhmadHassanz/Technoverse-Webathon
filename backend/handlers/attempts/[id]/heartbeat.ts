// POST /api/attempts/[id]/heartbeat: every 15 s from the workspace. See docs/CONTRACT.md section 7.
// The body is ignored on purpose: nothing the client sends is used to measure time.
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { heartbeat } from "@/backend/services/heartbeat.service";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  return ok(await heartbeat(user, parseId((await params).id, "Attempt")));
});
