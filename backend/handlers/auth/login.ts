// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockMe } from "@/backend/lib/mock";
import type { Me } from "@/shared/types";

export const POST = withErrors(async () => {
  return ok<Me>(mockMe);
});
