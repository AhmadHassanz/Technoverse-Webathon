"use client";

import Link from "next/link";
import { CloudOff } from "lucide-react";
import { buttonStyles } from "@/frontend/components/ui/button";
import { fmtDate, fmtTime } from "@/frontend/lib/format";
import type { AttemptStatus } from "@/shared/types";

export function SubmittedScreen({
  title,
  status,
  submittedAt,
  questionCount,
  attemptId,
  sandboxExamId,
  timeUpOffline,
  timeUp,
}: {
  title: string;
  status: AttemptStatus | null;
  submittedAt: string | null;
  questionCount: number;
  attemptId: string;
  sandboxExamId?: string | null;
  timeUpOffline?: boolean;
  /** The timer reached 00:00 and the app submitted for the candidate. */
  timeUp?: boolean;
}) {
  const back = sandboxExamId ? `/examiner/exams/${sandboxExamId}?tab=questions` : "/candidate";
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-cobalt px-6 py-6 sm:px-12">
        <p className="display text-[1.75rem] leading-none text-on-cobalt">ExamCore</p>
      </header>
      <main className="mx-auto max-w-[680px] px-5 py-16 sm:py-24">
        {timeUpOffline ? (
          <>
            <p className="eyebrow">Time is up</p>
            <h1 className="display display-lg mt-5">Your saved answers will be submitted automatically.</h1>
            <p className="mt-6 flex items-start gap-2 text-[1rem] text-ink">
              <CloudOff className="mt-1 size-5 shrink-0 text-danger" aria-hidden />
              We could not reach the server, but the exam closes on the server too. Answers already saved there are kept and submitted for you.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">{sandboxExamId ? "Preview complete" : "Examination complete"}</p>
            <h1 className="display display-xl mt-5">You can take a breath.</h1>
            <p className="mt-6 text-[1.125rem] leading-relaxed text-ink">
              {submittedAt
                ? `Your answers were ${status === "auto_submitted" || timeUp ? "submitted automatically when time ran out" : "submitted"} at ${fmtTime(submittedAt)} on ${fmtDate(submittedAt)}.`
                : "Your answers were submitted."}
            </p>
          </>
        )}
        <div className="mt-10 rounded-[10px] bg-parchment px-6 py-5">
          <p className="display text-[1.5rem]">{title}</p>
          <p className="num mt-2 text-[0.8125rem] text-mute">
            Attempt {attemptId.slice(0, 8).toUpperCase()} · {questionCount} questions{status ? ` · ${status.replace(/_/g, " ")}` : ""}
          </p>
          <p className="mt-2 text-[0.8125rem] text-mute">
            {sandboxExamId ? "This was a preview; it is not counted anywhere." : "Your result will appear once your examiner publishes it."}
          </p>
        </div>
        <Link href={back} replace className={`${buttonStyles()} mt-10`}>
          {sandboxExamId ? "Back to exam" : "Back to dashboard"}
        </Link>
        <p className="mt-6 text-[0.8125rem] text-mute">Your submission is securely recorded. No further action is needed.</p>
      </main>
    </div>
  );
}
