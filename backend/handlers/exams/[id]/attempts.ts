// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockStartAttempt } from "@/backend/lib/mock";
import type { StartAttemptResult } from "@/shared/types";

export const POST = withErrors(async () => {
  return ok<StartAttemptResult>(mockStartAttempt, 201);
});
