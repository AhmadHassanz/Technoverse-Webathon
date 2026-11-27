// STUB (mock data). Real version arrives in its stage; see docs/CONTRACT.md.
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { withErrors } from "@/backend/lib/errors";
import { mockTopic } from "@/backend/lib/mock";
import type { Topic } from "@/shared/types";

export const GET = withErrors(async () => {
  await connection(); // run on every request, never cached
  return ok<Topic[]>([mockTopic]);
});

export const POST = withErrors(async () => {
  return ok<Topic>(mockTopic, 201);
});
