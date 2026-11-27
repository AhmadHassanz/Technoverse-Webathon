// PATCH /api/me/preferences: see docs/CONTRACT.md section 1.
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody } from "@/backend/lib/http";
import { updateMyPreferences } from "@/backend/services/users.service";
import { preferencesSchema } from "@/shared/validation";

export const PATCH = withErrors(async (req: Request) => {
  const user = await requireUser();
  return ok(await updateMyPreferences(user, await parseBody(req, preferencesSchema)));
});
