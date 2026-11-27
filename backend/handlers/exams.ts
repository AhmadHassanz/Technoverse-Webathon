// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockExam } from "@/backend/lib/mock";
import type { Exam } from "@/shared/types";

export const GET = withErrors(async () => {
  await connection(); // run on every request, never cached
  return ok<Exam[]>([mockExam]);
});

export const POST = withErrors(async () => {
  return ok<Exam>(mockExam, 201);
});
