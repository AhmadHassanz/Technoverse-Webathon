// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockEnrollResult, mockEnrollments } from "@/backend/lib/mock";
import type { EnrollResult, Enrollment } from "@/shared/types";

export const GET = withErrors(async () => {
  await connection(); // run on every request, never cached
  return ok<Enrollment[]>(mockEnrollments);
});

export const POST = withErrors(async () => {
  return ok<EnrollResult>(mockEnrollResult, 201);
});
