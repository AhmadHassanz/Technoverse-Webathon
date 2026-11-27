// TEMPORARY mock data for stub endpoints, so the frontend never waits.
// Only GET /api/verify/[code] is still a stub (Stage 5). Delete this file when it is real.
import type { VerifyResult } from "@/shared/types";

export const mockVerify: VerifyResult = {
  valid: true,
  examTitle: "Networking Midterm",
  candidateInitials: "A. R.",
  score: 14,
  totalMarks: 16,
  percentage: 87.5,
  passed: true,
  issuedAt: "2026-12-02T10:05:00.000Z",
};
