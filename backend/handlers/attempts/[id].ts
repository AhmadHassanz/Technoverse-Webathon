// GET, DELETE /api/attempts/[id]: see docs/CONTRACT.md section 7.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { deleteSandboxAttempt, getAttemptView } from "@/backend/services/attempt.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection(); // live data, never cached
  const user = await requireUser();
  return ok(await getAttemptView(user, parseId((await params).id, "Attempt")));
});

export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  return ok(await deleteSandboxAttempt(user, parseId((await params).id, "Attempt")));
});
