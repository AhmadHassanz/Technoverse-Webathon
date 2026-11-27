"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BackLink, Button, Card, Checkbox, EmptyState, ErrorState, PageSkeleton } from "@/frontend/components/ui";
import { apiPost, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { fmtDate, fmtTime } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import type { CandidateExam, MyExams, StartAttemptResult } from "@/shared/types";

const RULES = [
  "Complete this examination independently. Do not use outside assistance.",
  "The timer keeps running if you leave the examination or lose connection.",
  "Answers save automatically. Offline answers stay on this device until they are synced.",
  "Use the question navigator to revisit answers and flag questions for review.",
  "When time runs out, your saved answers are submitted automatically.",
];

function InstructionsInner() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<MyExams>("/api/me/exams");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState onRetry={reload} description={errorMessage(error)} />;

  const all: CandidateExam[] = data ? [...data.available, ...data.upcoming, ...data.completed] : [];
  const exam = all.find((e) => e.examId === examId);
  if (!exam) {
    return (
      <EmptyState
        title="Exam not found"
        description="You are not enrolled in this exam, or it is not published yet."
        action={<BackLink href="/candidate">Back to my examinations</BackLink>}
      />
    );
  }

  const inProgress = exam.attempt?.status === "in_progress";
  const finished = exam.attempt && !inProgress;
  const today = new Date(exam.endAt).toDateString() === new Date().toDateString();

  async function start() {
    setBusy(true);
    setStartError(null);
    try {
      const r = await apiPost<StartAttemptResult>(`/api/exams/${examId}/attempts`, {});
      router.replace(`/attempt/${r.attemptId}`);
    } catch (err) {
      const e = toApiError(err);
      // 403 not enrolled · 409 already submitted · 410 not open yet / ended
      setStartError(
        e.status === 409
          ? "You have already submitted this exam. Each exam can be taken once."
          : e.status === 410
            ? `This exam is not open right now. ${e.message}`
            : e.status === 403
              ? "You are not enrolled in this exam."
              : errorMessage(e),
      );
      setBusy(false);
    }
  }

  return (
    <>
      <BackLink href="/candidate">My examinations</BackLink>
      <p className="sr-only">My examinations / instructions</p>
      <h1 className="display display-lg mt-3">Before you begin</h1>
      <p className="mt-3 text-[0.9375rem] text-mute">{exam.title}</p>

      <Card className="mt-8 grid grid-cols-2 gap-6 px-5 py-6 sm:px-7 md:grid-cols-4">
        {[
          ["Duration", `${exam.durationMin} minutes`],
          ["Total marks", `${exam.totalMarks} marks`],
          ["Opens", `${fmtDate(exam.startAt)}, ${fmtTime(exam.startAt)}`],
          ["Available until", `${today ? "Today" : fmtDate(exam.endAt)}, ${fmtTime(exam.endAt)}`],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="meta-label">{label}</p>
            <p className="display mt-3 text-[1.5rem] leading-tight text-cobalt">{value}</p>
          </div>
        ))}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.75fr_1fr]">
        <Card className="px-5 py-6 sm:px-7">
          <h2 className="display display-sm">A fair space to do your best.</h2>
          <ol className="mt-5 space-y-4">
            {RULES.map((rule, i) => (
              <li key={rule} className="grid grid-cols-[2.25rem_1fr] text-[0.9375rem] text-ink">
                <span className="num text-[0.8125rem] text-cobalt">{String(i + 1).padStart(2, "0")}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
          {exam.instructions.trim() && (
            <div className="mt-7 border-t border-line pt-5">
              <p className="meta-label">From your examiner</p>
              <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink">{exam.instructions}</p>
            </div>
          )}
        </Card>

        <Card className="flex flex-col px-5 py-6 sm:px-7">
          <h2 className="display text-[1.75rem] leading-tight">
            {inProgress ? "Your attempt is still running." : "Your time starts when you start the exam."}
          </h2>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-mute">
            {inProgress
              ? "Continue where you left off. Your saved answers and remaining time are kept."
              : "Find a quiet space and check your connection. You can continue after a refresh."}
          </p>
          <div className="mt-auto pt-8">
            {finished ? (
              <p className="rounded-md bg-sand px-4 py-3 text-sm text-ink">You have already submitted this exam.</p>
            ) : exam.canStart || inProgress ? (
              <>
                {!inProgress && (
                  <Checkbox label="I have read the instructions" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                )}
                <Button className="mt-6 w-full" disabled={busy || (!inProgress && !agreed)} onClick={() => void start()}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {inProgress ? "Continue exam" : "Start exam"}
                </Button>
              </>
            ) : (
              <p className="rounded-md bg-sand px-4 py-3 text-sm text-ink">{exam.blockedReason ?? "This exam is not open."}</p>
            )}
            {startError && (
              <p role="alert" className="mt-4 rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
                {startError}
              </p>
            )}
          </div>
        </Card>
      </div>
      <p className="mt-6 text-[0.8125rem] text-mute">Need help? Contact your examiner before starting.</p>
    </>
  );
}

export default function ExamInstructionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InstructionsInner />
    </Suspense>
  );
}
