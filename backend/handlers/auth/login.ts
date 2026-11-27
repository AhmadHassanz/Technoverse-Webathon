// POST /api/auth/login: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { parseBody } from "@/backend/lib/http";
import { login } from "@/backend/services/auth.service";
import { loginSchema } from "@/shared/validation";

export const POST = withErrors(async (req: Request) => {
  const input = await parseBody(req, loginSchema);
  return ok(await login(input));
});
