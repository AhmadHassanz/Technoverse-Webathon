// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";

export const PUT = withErrors(async () => {
  return ok<{ savedAt: string }>({ savedAt: new Date().toISOString() });
});
