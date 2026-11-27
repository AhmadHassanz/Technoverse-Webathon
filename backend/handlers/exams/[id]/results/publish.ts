// STUB (mock data). Real version arrives in Stage 4; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockExam } from "@/backend/lib/mock";
import type { Exam } from "@/shared/types";

export const POST = withErrors(async () => {
  return ok<Exam>({ ...mockExam, resultsPublishedAt: new Date().toISOString() });
});
