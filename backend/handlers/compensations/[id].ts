// STUB (mock data). Real version arrives in Stage 4; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockCompensation } from "@/backend/lib/mock";
import type { CompensationRequest } from "@/shared/types";

export const PATCH = withErrors(async () => {
  return ok<CompensationRequest>({ ...mockCompensation, status: "approved", decidedAt: new Date().toISOString() });
});
