"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Check, FileDown, X } from "lucide-react";
import { BackLink, Card, EmptyState, ErrorState, PageSkeleton, Table, Td, Th, THead, Tr } from "@/frontend/components/ui";
import { buttonStyles } from "@/frontend/components/ui/button";
import { errorMessage } from "@/frontend/lib/api-client";
import { fmtDate, fmtDateTime, pct } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import { cn } from "@/frontend/lib/utils";
import type { CandidateResult } from "@/shared/types";

const pad2 = (n: number) => String(n).padStart(2, "0");

function ResultInner() {
  const { examId } = useParams<{ examId: string }>();
  const { data: r, error, loading, reload } = useApi<CandidateResult>(`/api/me/results/${examId}`);

  if (loading && !r) return <PageSkeleton />;
  if (error && !r) {
    const back = <BackLink href="/candidate">Back to my examinations</BackLink>;
    if (error.status === 403) return <EmptyState title="Result not published yet" description="Your examiner has not published the results for this exam. Check back later." action={back} />;
    if (error.status === 404) return <EmptyState title="No result" description="You did not take this exam, or it does not exist." action={back} />;
    return <ErrorState onRetry={reload} description={errorMessage(error)} />;
  }
  if (!r) return null;

  const full = r.questions.filter((q) => q.marksAwarded >= q.marks).length;
  const skipped = r.questions.filter((q) => !q.yourAnswer.trim()).length;
  const other = r.questions.length - full - skipped;

  return (
    <>
      <BackLink href="/candidate#results">My examinations</BackLink>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow">My results</p>
          <h1 className="display display-lg mt-3 text-balance">Your hard work, in perspective.</h1>
          <p className="mt-3 text-[0.9375rem] text-mute">
            {r.examTitle} · Submitted {fmtDateTime(r.submittedAt)}
          </p>
        </div>
        <a href={`/api/reports/attempts/${r.attemptId}`} target="_blank" rel="noopener" className={cn(buttonStyles(), "w-full sm:w-auto")}>
          <FileDown className="size-4" /> Download verified report
        </a>
      </div>

      <Card className="mt-8 grid gap-6 px-5 py-6 sm:px-8 md:grid-cols-[auto_1fr_1fr] md:items-center md:gap-10">
        <p className="leading-none">
          <span className="num text-[4.5rem] text-cobalt">{r.score}</span>
          <span className="num ml-3 text-[1.4rem] text-mute">/ {r.totalMarks} marks</span>
        </p>
        <div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[0.8125rem]", r.passed ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            {r.passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {r.passed ? "Passed" : "Not passed"}
          </span>
          <p className="display mt-3 text-[1.6rem]">{pct(r.percentage, 1)} overall score</p>
        </div>
        <div>
          <p className="num text-[1.6rem] text-cobalt">{full} full marks</p>
          <p className="mt-1 text-[0.875rem] text-mute">
            {other} partly or not correct · {skipped} skipped
          </p>
          <p className="mt-3 text-xs text-mute">Published {fmtDate(r.publishedAt)}</p>
        </div>
      </Card>

      <h2 className="display display-sm mt-10">Question-by-question</h2>
      <p className="mt-1 text-[0.875rem] text-mute">Your response and the marking decision for every question.</p>

      {/* desktop table */}
      <div className="mt-5 hidden md:block">
        <Table>
          <THead>
            <tr>
              <Th>Q</Th>
              <Th className="w-[30%]">Question</Th>
              <Th>Your answer</Th>
              <Th>Correct answer</Th>
              <Th>Marks</Th>
              <Th>Feedback</Th>
            </tr>
          </THead>
          <tbody>
            {r.questions.map((q) => (
              <Tr key={q.position}>
                <Td className="num align-top">{pad2(q.position)}</Td>
                <Td className="align-top">
                  <p className="line-clamp-3 whitespace-pre-line text-ink">{q.stem}</p>
                </Td>
                <Td className="align-top">
                  <p className="whitespace-pre-line">{q.yourAnswer || <span className="italic text-mute">No answer</span>}</p>
                </Td>
                <Td className="align-top">{q.correctAnswer ?? <span className="text-mute">Graded by examiner</span>}</Td>
                <Td className={cn("num align-top", q.marksAwarded >= q.marks ? "text-cobalt" : q.marksAwarded > 0 ? "text-warning" : "text-danger")}>
                  {q.marksAwarded} / {q.marks}
                </Td>
                <Td className="align-top text-[0.8125rem] text-mute">{q.feedback ?? "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* mobile cards */}
      <ul className="mt-5 space-y-3 md:hidden">
        {r.questions.map((q) => (
          <li key={q.position} className="surface-card px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[0.9375rem] text-ink">
                <span className="num text-mute">{pad2(q.position)} · </span>
                {q.stem}
              </p>
              <span className={cn("num shrink-0 text-sm", q.marksAwarded >= q.marks ? "text-cobalt" : "text-danger")}>
                {q.marksAwarded}/{q.marks}
              </span>
            </div>
            <dl className="mt-3 space-y-1.5 text-[0.8125rem]">
              <div>
                <dt className="meta-label">Your answer</dt>
                <dd className="whitespace-pre-line text-ink">{q.yourAnswer || "No answer"}</dd>
              </div>
              {q.correctAnswer && (
                <div>
                  <dt className="meta-label">Correct answer</dt>
                  <dd className="text-ink">{q.correctAnswer}</dd>
                </div>
              )}
              {q.feedback && (
                <div>
                  <dt className="meta-label">Feedback</dt>
                  <dd className="text-mute">{q.feedback}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function CandidateResultPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResultInner />
    </Suspense>
  );
}
