// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockAttemptView } from "@/backend/lib/mock";
import type { AttemptView, OkResult } from "@/shared/types";

export const GET = withErrors(async () => {
  await connection(); // run on every request, never cached
  return ok<AttemptView>(mockAttemptView);
});

export const DELETE = withErrors(async () => {
  return ok<OkResult>({ ok: true });
});
