// SERVICE: verifiable result reports (PDF + QR code) and the public verify lookup.
//  - candidate report: the candidate (own, results published) or the exam owner/admin
//  - exam report: the exam owner/admin
// A verification code is created the first time a PUBLISHED result is downloaded and never changes.
import QRCode from "qrcode";
import { assertOwner } from "@/backend/lib/auth";
import { HttpError } from "@/backend/lib/errors";
import { isUniqueViolation } from "@/backend/lib/http";
import { colors, latin1, PdfWriter } from "@/backend/lib/pdf";
import { generateCode, initials, normalizeCode } from "@/backend/lib/verification";
import { findAttempt, listPaper } from "@/backend/data/attempts";
import { listAnswers } from "@/backend/data/answers";
import { findExam } from "@/backend/data/exams";
import { findCodeForAttempt, findVerification, insertVerification } from "@/backend/data/reports";
import { findProfile } from "@/backend/data/users";
import { finalizeIfExpired } from "@/backend/services/attempt.service";
import { getResults } from "@/backend/services/results.service";
import type { Me, VerifyResult } from "@/shared/types";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "27 Nov 2026, 08:05 UTC" */
const when = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${d.toISOString().slice(11, 16)} UTC`;
};
const capital = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max).trimEnd()}...` : s);

/** The attempt's code; creates it if missing. Two requests at once end up with the same code. */
async function getOrCreateCode(attemptId: string): Promise<string> {
  for (let tries = 0; tries < 5; tries++) {
    const existing = await findCodeForAttempt(attemptId);
    if (existing) return existing;
    const code = generateCode();
    const { error } = await insertVerification(attemptId, code);
    if (!error) return code;
    if (!isUniqueViolation(error)) throw error;
    // unique violation = someone else just created this attempt's code (or the code clashed): look again
  }
  throw new Error("Could not create a verification code");
}

// ---------- public verify ----------

/** GET /api/verify/[code]: always answers; unknown, unpublished or tampered codes are simply `valid: false`. */
export async function verifyCode(raw: string): Promise<VerifyResult> {
  const code = normalizeCode(raw);
  if (!code) return { valid: false };
  const issued = await findVerification(code);
  if (!issued) return { valid: false };

  const attempt = await findAttempt(issued.attemptId);
  if (!attempt || attempt.isSandbox || attempt.status !== "graded" || attempt.score === null) return { valid: false };
  const found = await findExam(attempt.examId);
  if (!found || !found.exam.resultsPublishedAt) return { valid: false };

  const [paper, profile] = await Promise.all([listPaper(attempt.id), findProfile(attempt.candidateId)]);
  const total = round2(paper.reduce((sum, q) => sum + Number(q.snapshot.marks), 0));
  return {
    valid: true,
    examTitle: found.exam.title,
    candidateInitials: initials(profile?.full_name ?? ""), // never the full name or the email
    score: attempt.score,
    totalMarks: total,
    percentage: total > 0 ? round2((attempt.score / total) * 100) : 0,
    passed: attempt.score >= found.exam.passMarks,
    issuedAt: issued.issuedAt,
  };
}

// ---------- candidate result PDF ----------

/** GET /api/reports/attempts/[attemptId] */
export async function buildAttemptReport(user: Me, attemptId: string, origin: string): Promise<{ bytes: Uint8Array; filename: string }> {
  const raw = await findAttempt(attemptId);
  const found = raw ? await findExam(raw.examId) : null;
  if (!raw || !found || raw.isSandbox) throw new HttpError(404, "Attempt not found");

  const published = found.exam.resultsPublishedAt !== null;
  if (user.role === "candidate") {
    if (raw.candidateId !== user.id) throw new HttpError(403, "You don't have access to this");
    if (!published) throw new HttpError(403, "Results are not published yet");
  } else {
    assertOwner(user, found.createdBy);
  }

  const attempt = await finalizeIfExpired(raw);
  if (attempt.status !== "graded" || attempt.score === null) throw new HttpError(409, "This result is not ready yet (grading is not finished)");
  const exam = found.exam;

  const [paper, answers, profile] = await Promise.all([listPaper(attempt.id), listAnswers(attempt.id), findProfile(attempt.candidateId)]);
  const answerOf = new Map(answers.map((a) => [a.aqId, a]));
  const total = round2(paper.reduce((sum, q) => sum + Number(q.snapshot.marks), 0));
  const percentage = total > 0 ? round2((attempt.score / total) * 100) : 0;
  const passed = attempt.score >= exam.passMarks;
  const code = published ? await getOrCreateCode(attempt.id) : null; // no code before publishing

  const pdf = await PdfWriter.create(`Result report - ${exam.title}`, "Result report");
  pdf.paragraph(exam.title, { size: 20, bold: true, color: colors.accent });
  pdf.paragraph("Candidate result report", { size: 11, color: colors.muted });
  pdf.space(8);
  pdf.rule();
  const info: [string, string][] = [
    ["Candidate", `${profile?.full_name ?? ""} (${profile?.email ?? ""})`],
    ["Submitted", attempt.submittedAt ? when(attempt.submittedAt) : "-"],
    ["Attempt status", capital(attempt.status)],
  ];
  for (const [label, value] of info) {
    pdf.row([{ text: label, x: pdf.left, width: 110, bold: true, color: colors.muted }, { text: value, x: pdf.left + 110, width: pdf.contentWidth - 110 }], { size: 10 });
  }
  pdf.space(12);
  pdf.callout(
    [
      { text: `Score: ${attempt.score} / ${total}   (${percentage}%)`, size: 18, bold: true },
      { text: passed ? `PASSED (pass marks: ${exam.passMarks})` : `NOT PASSED (pass marks: ${exam.passMarks})`, size: 11, bold: true, color: passed ? colors.good : colors.bad },
    ],
    passed ? colors.goodSoft : colors.badSoft,
    passed ? colors.good : colors.bad,
  );
  pdf.space(14);
  pdf.paragraph("Answers by question", { size: 12, bold: true });
  pdf.space(3);

  // per-question table
  const cols = { n: 24, q: 175, mine: 120, right: 120, marks: 60 };
  const x = { n: pdf.left, q: pdf.left + cols.n, mine: pdf.left + cols.n + cols.q, right: pdf.left + cols.n + cols.q + cols.mine, marks: pdf.left + cols.n + cols.q + cols.mine + cols.right };
  pdf.row(
    [
      { text: "#", x: x.n, width: cols.n, bold: true },
      { text: "Question", x: x.q, width: cols.q, bold: true },
      { text: "Your answer", x: x.mine, width: cols.mine, bold: true },
      { text: "Correct answer", x: x.right, width: cols.right, bold: true },
      { text: "Marks", x: x.marks, width: cols.marks, bold: true },
    ],
    { fill: colors.head },
  );
  let n = 0;
  for (const q of paper) {
    const zebra = n++ % 2 === 1 ? { fill: colors.zebra } : {};
    const a = answerOf.get(q.aqId);
    const written = q.snapshot.type === "written";
    const labels = (ids: string[]) => q.snapshot.options.filter((o) => ids.includes(o.id)).map((o) => o.label).join(", ");
    const mine = written ? a?.textAnswer || "(no answer)" : labels(a?.selectedOptionIds ?? []) || "(no answer)";
    const right = written ? "Graded by examiner" : labels(q.snapshot.options.filter((o) => o.isCorrect).map((o) => o.id));
    const awarded = q.marksAwarded ?? 0;
    pdf.row([
      { text: String(q.position), x: x.n, width: cols.n },
      { text: clip(q.snapshot.stem, 220), x: x.q, width: cols.q }, // very long questions are shortened so no page is left half empty
      { text: clip(mine, 220), x: x.mine, width: cols.mine },
      { text: clip(right, 220), x: x.right, width: cols.right },
      { text: `${awarded} / ${q.snapshot.marks}`, x: x.marks, width: cols.marks, bold: true, color: awarded > 0 ? colors.good : awarded < 0 ? colors.bad : colors.text },
    ], zebra);
    if (written && q.feedback) pdf.row([{ text: "", x: x.n, width: cols.n }, { text: `Feedback: ${clip(q.feedback, 300)}`, x: x.q, width: pdf.contentWidth - cols.n, color: colors.muted }], { size: 8, ...zebra });
  }

  // verification block
  pdf.space(14);
  pdf.ensure(130);
  if (code) {
    const url = `${origin}/verify/${code}`;
    const png = await QRCode.toBuffer(url, { type: "png", margin: 1, width: 240 });
    pdf.rule();
    pdf.paragraph("Verify this report", { size: 12, bold: true });
    pdf.paragraph("Scan the QR code or open the link and enter the code. The page shows the exam, initials, score and date.", { size: 9, color: colors.muted });
    pdf.space(4);
    pdf.image(await pdf.embedPng(png), 90);
    pdf.paragraph(`Verification code: ${code}`, { size: 12, bold: true });
    pdf.paragraph(url, { size: 8, color: colors.muted });
  } else {
    pdf.paragraph("PROVISIONAL: results are not published yet, so this report has no verification code.", { size: 10, bold: true, color: colors.bad });
  }

  return { bytes: await pdf.save(), filename: latin1(`result-${(profile?.full_name ?? "candidate").replace(/\s+/g, "-")}.pdf`).replace(/[^A-Za-z0-9._-]/g, "") };
}

// ---------- exam report PDF ----------

/** GET /api/reports/exams/[examId]: statistics + score table for the exam owner. */
export async function buildExamReport(user: Me, examId: string): Promise<{ bytes: Uint8Array; filename: string }> {
  const { exam, stats, rows } = await getResults(user, examId); // owner check + 404/403 inside

  const pdf = await PdfWriter.create(`Exam report - ${exam.title}`, "Exam report");
  pdf.paragraph(exam.title, { size: 20, bold: true, color: colors.accent });
  pdf.paragraph("Exam report for the examiner", { size: 11, color: colors.muted });
  pdf.space(2);
  pdf.paragraph(`${when(exam.startAt)}  to  ${when(exam.endAt)}   |   ${exam.durationMin} min   |   total ${exam.totalMarks}, pass ${exam.passMarks}`, { size: 9, color: colors.muted });
  pdf.paragraph(exam.resultsPublishedAt ? `Results published ${when(exam.resultsPublishedAt)}` : "Results not published yet", { size: 9, color: colors.muted });
  pdf.space(6);
  pdf.rule();

  pdf.paragraph("Statistics (graded attempts)", { size: 12, bold: true });
  pdf.space(2);
  const statRows: [string, string][] = [
    ["Attempts", String(stats.attempts)],
    ["Average score", String(stats.average)],
    ["Median", String(stats.median)],
    ["Highest / Lowest", `${stats.highest} / ${stats.lowest}`],
    ["Pass rate", `${stats.passRate}%`],
    ["Average percentage", `${stats.averagePercentage}%`],
  ];
  for (const [label, value] of statRows) {
    pdf.row([{ text: label, x: pdf.left, width: 170, color: colors.muted }, { text: value, x: pdf.left + 170, width: 120, bold: true }], { size: 10 });
  }
  pdf.space(14);

  pdf.paragraph("Scores", { size: 12, bold: true });
  pdf.space(2);
  const c = { name: 125, email: 150, status: 75, score: 50, pct: 50, res: 49 };
  const x = { name: pdf.left, email: pdf.left + c.name, status: pdf.left + c.name + c.email, score: pdf.left + c.name + c.email + c.status, pct: pdf.left + c.name + c.email + c.status + c.score, res: pdf.left + c.name + c.email + c.status + c.score + c.pct };
  pdf.row(
    [
      { text: "Candidate", x: x.name, width: c.name, bold: true },
      { text: "Email", x: x.email, width: c.email, bold: true },
      { text: "Status", x: x.status, width: c.status, bold: true },
      { text: "Score", x: x.score, width: c.score, bold: true },
      { text: "%", x: x.pct, width: c.pct, bold: true },
      { text: "Result", x: x.res, width: c.res, bold: true },
    ],
    { fill: colors.head },
  );
  if (rows.length === 0) pdf.paragraph("No attempts yet.", { size: 10, color: colors.muted });
  let n = 0;
  for (const r of rows) {
    const zebra = n++ % 2 === 1 ? { fill: colors.zebra } : {};
    pdf.row([
      { text: r.candidateName, x: x.name, width: c.name },
      { text: r.email, x: x.email, width: c.email },
      { text: capital(r.status), x: x.status, width: c.status },
      { text: r.score === null ? "-" : String(r.score), x: x.score, width: c.score },
      { text: r.percentage === null ? "-" : `${r.percentage}%`, x: x.pct, width: c.pct },
      { text: r.passed === null ? "-" : r.passed ? "Pass" : "Fail", x: x.res, width: c.res, color: r.passed === null ? colors.muted : r.passed ? colors.good : colors.bad, bold: true },
    ], zebra);
  }

  return { bytes: await pdf.save(), filename: `exam-report-${exam.title.replace(/\s+/g, "-").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 60) || "exam"}.pdf` };
}
