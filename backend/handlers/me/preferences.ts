// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockPreferences } from "@/backend/lib/mock";
import type { Preferences } from "@/shared/types";

export const PATCH = withErrors(async () => {
  return ok<Preferences>(mockPreferences);
});
