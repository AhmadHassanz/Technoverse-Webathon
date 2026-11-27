// GET, POST /api/exams/[id]/enrollments: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { enrollByEmail, getEnrollments } from "@/backend/services/enrollment.service";
import { enrollSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await getEnrollments(user, parseId((await params).id, "Exam")));
});

export const POST = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  const id = parseId((await params).id, "Exam");
  const { emails } = await parseBody(req, enrollSchema);
  return ok(await enrollByEmail(user, id, emails), 201);
});
