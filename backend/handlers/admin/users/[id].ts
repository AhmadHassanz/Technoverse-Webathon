// PATCH /api/admin/users/[id]: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { updateUser } from "@/backend/services/users.service";
import { updateUserSchema } from "@/shared/validation";

export const PATCH = withErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireRole("admin");
  const id = parseId((await params).id, "User");
  const input = await parseBody(req, updateUserSchema);
  return ok(await updateUser(admin, id, input));
});
