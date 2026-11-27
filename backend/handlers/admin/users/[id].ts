// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockCandidate } from "@/backend/lib/mock";
import type { User } from "@/shared/types";

export const PATCH = withErrors(async () => {
  return ok<User>(mockCandidate);
});
