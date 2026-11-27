// POST /api/auth/signup: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { parseBody } from "@/backend/lib/http";
import { signup } from "@/backend/services/auth.service";
import { signupSchema } from "@/shared/validation";

export const POST = withErrors(async (req: Request) => {
  const input = await parseBody(req, signupSchema);
  return ok(await signup(input), 201);
});
