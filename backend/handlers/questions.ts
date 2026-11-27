// GET, POST /api/questions: see docs/CONTRACT.md
import { connection } from "next/server";
import { z } from "zod";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseQuery } from "@/backend/lib/http";
import { createQuestion, getQuestions } from "@/backend/services/questions.service";
import { optionalText, questionSchema, uuid } from "@/shared/validation";

// A bad filter value is ignored (treated as "no filter") instead of failing the whole list.
const querySchema = z.object({
  topicId: uuid.optional().catch(undefined),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().catch(undefined),
  type: z.enum(["mcq_single", "mcq_multi", "written"]).optional().catch(undefined),
  q: optionalText,
});

export const GET = withErrors(async (req: Request) => {
  await connection();
  const user = await requireRole("examiner", "admin");
  return ok(await getQuestions(user, parseQuery(req, querySchema)));
});

export const POST = withErrors(async (req: Request) => {
  const user = await requireRole("examiner", "admin");
  const input = await parseBody(req, questionSchema);
  return ok(await createQuestion(user, input), 201);
});
