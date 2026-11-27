// POST /api/auth/logout: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { logout } from "@/backend/services/auth.service";
import type { OkResult } from "@/shared/types";

export const POST = withErrors(async () => {
  await logout();
  return ok<OkResult>({ ok: true });
});
