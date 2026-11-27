// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockSubmit } from "@/backend/lib/mock";
import type { SubmitResult } from "@/shared/types";

export const POST = withErrors(async () => {
  return ok<SubmitResult>(mockSubmit);
});
