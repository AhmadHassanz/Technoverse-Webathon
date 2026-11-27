// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockExamDetail } from "@/backend/lib/mock";
import type { ExamDetail } from "@/shared/types";

export const PUT = withErrors(async () => {
  return ok<ExamDetail>(mockExamDetail);
});
