// GET /api/auth/me: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireUser } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";

export const GET = withErrors(async () => {
  await connection(); // depends on the cookie, never cached
  return ok(await requireUser());
});
