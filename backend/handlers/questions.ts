// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockQuestions } from "@/backend/lib/mock";
import type { Question } from "@/shared/types";

export const GET = withErrors(async () => {
  await connection(); // run on every request, never cached
  return ok<Question[]>(mockQuestions);
});

export const POST = withErrors(async () => {
  return ok<Question>(mockQuestions[0], 201);
});
