// GET /api/reports/exams/[examId]: statistics + score table as a PDF, for the exam owner. See docs/CONTRACT.md section 10.
import { connection } from "next/server";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseId } from "@/backend/lib/http";
import { buildExamReport } from "@/backend/services/report.service";

type Ctx = { params: Promise<{ examId: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  const { bytes, filename } = await buildExamReport(user, parseId((await params).examId, "Exam"));
  return new Response(new Blob([bytes as BlobPart], { type: "application/pdf" }), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "private, no-store" },
  });
});
