// GET /api/me/exams: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { getMyExams } from "@/backend/services/my-exams.service";

export const GET = withErrors(async () => {
  await connection();
  const user = await requireRole("candidate");
  return ok(await getMyExams(user));
});
