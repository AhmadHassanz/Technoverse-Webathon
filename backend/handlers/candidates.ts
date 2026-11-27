// GET /api/candidates?q=: see docs/CONTRACT.md
import { connection } from "next/server";
import { z } from "zod";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseQuery } from "@/backend/lib/http";
import { searchCandidates } from "@/backend/services/enrollment.service";
import { optionalText } from "@/shared/validation";

export const GET = withErrors(async (req: Request) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  const { q } = parseQuery(req, z.object({ q: optionalText }));
  return ok(await searchCandidates(user, q));
});
