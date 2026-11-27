// GET /api/health: see docs/CONTRACT.md
import { connection } from "next/server";
import { ok } from "@/backend/lib/api-response";
import type { HealthStatus } from "@/shared/types";

export async function GET() {
  await connection(); // run on every request (not frozen at build time)
  return ok<HealthStatus>({ status: "ok", time: new Date().toISOString() });
}
