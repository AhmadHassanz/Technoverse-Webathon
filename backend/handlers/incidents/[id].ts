// STUB (mock data). Real version arrives in Stage 4; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockIncident } from "@/backend/lib/mock";
import type { Incident } from "@/shared/types";

export const PATCH = withErrors(async () => {
  return ok<Incident>({ ...mockIncident, reviewed: true });
});
