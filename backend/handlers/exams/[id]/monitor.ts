// GET /api/exams/[id]/monitor: live view for the exam owner (polled every 5 s). See docs/CONTRACT.md section 8.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { getMonitor } from "@/backend/services/monitor.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection(); // live data, never cached
  const user = await requireRole("examiner", "admin");
  return ok(await getMonitor(user, parseId((await params).id, "Exam")));
});
