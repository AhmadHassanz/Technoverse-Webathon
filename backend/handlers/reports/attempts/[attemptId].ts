// GET /api/reports/attempts/[attemptId]: the candidate's result as a PDF with QR + verification code.
// See docs/CONTRACT.md section 10. Opened with a plain link, so the session cookie is enough.
import { connection } from "next/server";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { buildAttemptReport } from "@/backend/services/report.service";

type Ctx = { params: Promise<{ attemptId: string }> };

export const GET = withErrors(async (req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireUser(); // the service allows the candidate (own) or the exam owner/admin
  const attemptId = parseId((await params).attemptId, "Attempt");
  const { bytes, filename } = await buildAttemptReport(user, attemptId, new URL(req.url).origin);
  return new Response(new Blob([bytes as BlobPart], { type: "application/pdf" }), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "private, no-store" },
  });
});
