"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Check, FileDown, X } from "lucide-react";
import { BackLink, EmptyState, ErrorState, PageSkeleton } from "@/frontend/components/ui";
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

  const ring = Math.max(0, Math.min(100, r.percentage));
  const C = 2 * Math.PI * 52;

  return (
    <>
      <BackLink href="/candidate#results">My examinations</BackLink>

      <section className="glow-iris animate-rise relative mt-5 overflow-hidden rounded-[24px] bg-night p-6 text-lime shadow-pop sm:p-8">
        <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="relative mx-auto size-[148px] lg:mx-0">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--night-line)" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={r.passed ? "var(--lime)" : "var(--danger-soft)"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C - (C * ring) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="display text-[2.6rem] leading-none text-lime">{r.score}</span>
              <span className="num mt-1 text-[0.75rem] text-night-mute">of {r.totalMarks} marks</span>
            </div>
          </div>
          <div className="min-w-0 text-center lg:text-left">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.8125rem] font-medium",
                r.passed ? "bg-lime text-on-lime" : "bg-danger-soft text-danger",
              )}
            >
              {r.passed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {r.passed ? "Passed" : "Not passed"}
            </span>
            <h1 className="display mt-4 text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.05] text-lime">{r.examTitle}</h1>
            <p className="mt-2 text-[0.875rem] text-night-mute">
              {pct(r.percentage, 1)} overall, Submitted {fmtDateTime(r.submittedAt)}, Published {fmtDate(r.publishedAt)}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {[
                { n: full, label: "full marks", cls: "text-lime" },
                { n: other, label: "partly / not correct", cls: "text-warning-soft" },
                { n: skipped, label: "skipped", cls: "text-night-mute" },
              ].map((s) => (
                <span key={s.label} className="inline-flex items-center gap-2 rounded-full border border-lime/10 bg-lime/5 px-3 py-1.5 text-[0.8125rem]">
                  <span className={cn("num font-semibold", s.cls)}>{s.n}</span> {s.label}
                </span>
              ))}
            </div>
          </div>
          <a
            href={`/api/reports/attempts/${r.attemptId}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lime px-6 text-[0.875rem] font-semibold text-on-lime transition-transform hover:-translate-y-0.5"
          >
            <FileDown className="size-4" /> Verified report (PDF)
          </a>
        </div>
      </section>

      <h2 className="display mt-10 text-[1.35rem] tracking-[-0.025em]">Question by question</h2>
      <p className="mt-1 text-[0.875rem] text-mute">Your response and the marking decision for every question.</p>

      <ol className="mt-5 space-y-3">
        {r.questions.map((q) => {
          const tone = q.marksAwarded >= q.marks ? "full" : q.marksAwarded > 0 ? "part" : "none";
          return (
            <li key={q.position} className="surface-card relative overflow-hidden p-4 sm:p-5">
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0 left-0 w-1",
                  tone === "full" ? "bg-success" : tone === "part" ? "bg-warning" : "bg-danger",
                )}
              />
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="num flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-sand text-[0.75rem] text-mute">
                  {pad2(q.position)}
                </span>
                <p className="min-w-0 flex-1 whitespace-pre-line break-words pt-1 text-[0.9375rem] leading-relaxed text-ink">{q.stem}</p>
                <span
                  className={cn(
                    "num shrink-0 rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold",
                    tone === "full"
                      ? "bg-success-soft text-success"
                      : tone === "part"
                        ? "bg-warning-soft text-warning"
                        : "bg-danger-soft text-danger",
                  )}
                >
                  {q.marksAwarded}/{q.marks}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-[0.8125rem] sm:ml-12 md:grid-cols-2">
                <div className="rounded-[12px] bg-paper px-3.5 py-3">
                  <dt className="meta-label">Your answer</dt>
                  <dd className="mt-1 whitespace-pre-line break-words text-ink">
                    {q.yourAnswer || <span className="italic text-mute">No answer</span>}
                  </dd>
                </div>
                <div className="rounded-[12px] bg-paper px-3.5 py-3">
                  <dt className="meta-label">Correct answer</dt>
                  <dd className="mt-1 break-words text-ink">
                    {q.correctAnswer ?? <span className="text-mute">Graded by examiner</span>}
                  </dd>
                </div>
                {q.feedback && (
                  <div className="rounded-[12px] border border-cobalt/20 bg-tint px-3.5 py-3 md:col-span-2">
                    <dt className="meta-label text-cobalt">Examiner feedback</dt>
                    <dd className="mt-1 text-ink">{q.feedback}</dd>
                  </div>
                )}
              </dl>
            </li>
          );
        })}
      </ol>
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
