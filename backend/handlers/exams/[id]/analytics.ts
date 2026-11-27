// STUB (mock data). Real version arrives in Stage 4; see docs/CONTRACT.md.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockAnalytics } from "@/backend/lib/mock";
import type { ExamAnalytics } from "@/shared/types";

export const GET = withErrors(async () => {
  await connection(); // run on every request, never cached
  return ok<ExamAnalytics>(mockAnalytics);
});
