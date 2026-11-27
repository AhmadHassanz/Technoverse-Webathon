// SERVICE layer for enrollment. Only the exam owner (or an admin) manages it.
import { HttpError } from "@/backend/lib/errors";
import { listProfiles, findCandidatesByEmails } from "@/backend/data/users";
import { enrolledIds, hasAttempt, insertEnrollments, listEnrollments, removeEnrollment } from "@/backend/data/enrollments";
import { loadOwnedExam } from "@/backend/services/exams.service";
import type { Enrollment, EnrollResult, Me, OkResult, User } from "@/shared/types";

/** Search active candidates by name/email (max 20) for the "add candidates" picker. */
export function searchCandidates(_user: Me, q?: string): Promise<User[]> {
  return listProfiles({ role: "candidate", q, limit: 20, activeOnly: true });
}

export async function getEnrollments(user: Me, examId: string): Promise<Enrollment[]> {
  await loadOwnedExam(user, examId);
  return listEnrollments(examId);
}

/** Enroll by email. Unknown emails (or non-candidates) are reported in `notFound`, not an error. */
export async function enrollByEmail(user: Me, examId: string, emails: string[]): Promise<EnrollResult> {
  const exam = await loadOwnedExam(user, examId);
  if (exam.state === "completed") throw new HttpError(409, "This exam has finished, so candidates can't be enrolled");

  const unique = [...new Set(emails)];
  const found = await findCandidatesByEmails(unique);
  const foundEmails = new Set(found.map((f) => f.email));
  const already = await enrolledIds(examId);

  const fresh = found.filter((f) => !already.has(f.id));
  await insertEnrollments(examId, fresh.map((f) => f.id));
  return {
    enrolled: fresh.length,
    alreadyEnrolled: found.length - fresh.length,
    notFound: unique.filter((e) => !foundEmails.has(e)),
  };
}

/** Used by CSV import: enroll candidates by id (ignores ones already enrolled). Returns how many were new. */
export async function enrollIds(examId: string, candidateIds: string[]): Promise<number> {
  const already = await enrolledIds(examId);
  const fresh = [...new Set(candidateIds)].filter((id) => !already.has(id));
  await insertEnrollments(examId, fresh);
  return fresh.length;
}

export async function unenroll(user: Me, examId: string, candidateId: string): Promise<OkResult> {
  await loadOwnedExam(user, examId);
  if (await hasAttempt(examId, candidateId)) {
    throw new HttpError(409, "This candidate has already started the exam, so they can't be removed");
  }
  if (!(await removeEnrollment(examId, candidateId))) throw new HttpError(404, "This candidate is not enrolled");
  return { ok: true };
}
