// GET /api/verify/[code]: PUBLIC. Always 200; `valid: false` for unknown or unpublished codes. See docs/CONTRACT.md section 10.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { verifyCode } from "@/backend/services/report.service";

type Ctx = { params: Promise<{ code: string }> };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  await connection(); // live data, never cached
  return ok(await verifyCode((await params).code));
});
