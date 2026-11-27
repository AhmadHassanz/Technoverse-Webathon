// GET, POST /api/topics: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody } from "@/backend/lib/http";
import { createTopic, getTopics } from "@/backend/services/questions.service";
import { topicSchema } from "@/shared/validation";

export const GET = withErrors(async () => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await getTopics(user));
});

export const POST = withErrors(async (req: Request) => {
  const user = await requireRole("examiner", "admin");
  const { name } = await parseBody(req, topicSchema);
  return ok(await createTopic(user, name), 201);
});
