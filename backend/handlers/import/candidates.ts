// POST /api/import/candidates: see docs/CONTRACT.md
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody } from "@/backend/lib/http";
import { importCandidates } from "@/backend/services/import.service";
import { importSchema } from "@/shared/validation";

export const POST = withErrors(async (req: Request) => {
  const user = await requireRole("examiner", "admin");
  return ok(await importCandidates(user, await parseBody(req, importSchema)));
});
