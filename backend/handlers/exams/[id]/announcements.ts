// GET, POST /api/exams/[id]/announcements: see docs/CONTRACT.md section 8.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole, requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseId } from "@/backend/lib/http";
import { getAnnouncements, postAnnouncement } from "@/backend/services/monitor.service";
import { announcementSchema } from "@/shared/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireUser(); // the service allows the owner/admin or an enrolled candidate
  return ok(await getAnnouncements(user, parseId((await params).id, "Exam")));
});

export const POST = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireRole("examiner", "admin");
  const examId = parseId((await params).id, "Exam");
  const { message } = await parseBody(req, announcementSchema);
  return ok(await postAnnouncement(user, examId, message), 201);
});
