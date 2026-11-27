// STUB (mock data). Real version arrives in Stage 4; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockGradingItems } from "@/backend/lib/mock";
import type { GradingItem } from "@/shared/types";

export const PATCH = withErrors(async () => {
  return ok<GradingItem>({ ...mockGradingItems[0], marksAwarded: 8, feedback: "Good answer" });
});
