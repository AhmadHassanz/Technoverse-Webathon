// GET, POST /api/admin/users: see docs/CONTRACT.md
import { connection } from "next/server";
import { z } from "zod";
import { ok } from "@/backend/lib/api-response";
import { requireRole } from "@/backend/lib/auth";
import { withErrors } from "@/backend/lib/errors";
import { parseBody, parseQuery } from "@/backend/lib/http";
import { createUser, listUsers } from "@/backend/services/users.service";
import { createUserSchema, optionalText } from "@/shared/validation";

const querySchema = z.object({
  role: z.enum(["admin", "examiner", "candidate"]).optional().catch(undefined),
  q: optionalText,
});

export const GET = withErrors(async (req: Request) => {
  await connection();
  const admin = await requireRole("admin");
  return ok(await listUsers(admin, parseQuery(req, querySchema)));
});

export const POST = withErrors(async (req: Request) => {
  const admin = await requireRole("admin");
  const input = await parseBody(req, createUserSchema);
  return ok(await createUser(admin, input), 201);
});
