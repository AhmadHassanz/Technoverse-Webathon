"use client";

import Link from "next/link";
import { CalendarClock, CircleCheck, ClipboardList } from "lucide-react";
import { PageHeader } from "@/frontend/components/shell/PageHeader";
import { Card, EmptyState, ErrorState, PageSkeleton, StatusBadge } from "@/frontend/components/ui";
import { buttonStyles } from "@/frontend/components/ui/button";
import { errorMessage } from "@/frontend/lib/api-client";
import { countdownLabel, fmtDate, fmtDateTime, fmtTime, fmtTimeRange } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import { useNow } from "@/frontend/lib/useNow";
import { cn } from "@/frontend/lib/utils";
import type { CandidateExam, MyExams } from "@/shared/types";

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-9 scroll-mt-24 first:mt-0" aria-labelledby={`${title}-h`}>
      <h2 id={`${title}-h`} className="mb-4 text-[1.25rem] text-ink">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ExamCard({ exam, kind, now }: { exam: CandidateExam; kind: "available" | "upcoming" | "completed"; now: number }) {
  const sameDay = new Date(exam.endAt).toDateString() === new Date(now).toDateString();
  const inProgress = exam.attempt?.status === "in_progress";
  const badge = kind === "completed" ? exam.attempt?.status ?? "not_started" : exam.state;

  let meta: string;
  if (kind === "available") meta = `Available until ${fmtTime(exam.endAt)}${sameDay ? " today" : `, ${fmtDate(exam.endAt)}`}`;
  else if (kind === "upcoming") meta = `${fmtDate(exam.startAt)} · ${fmtTimeRange(exam.startAt, exam.endAt)}`;
  else meta = exam.attempt?.submittedAt ? `Submitted ${fmtDateTime(exam.attempt.submittedAt)}` : exam.blockedReason ?? "Closed";

  let action: React.ReactNode;
  if (kind === "available") {
    action = inProgress ? (
      <Link href={`/attempt/${exam.attempt!.id}`} className={cn(buttonStyles(), "w-full sm:w-auto")}>
        Continue exam
      </Link>
    ) : exam.canStart ? (
      <Link href={`/candidate/exams/${exam.examId}`} className={cn(buttonStyles(), "w-full sm:w-auto")}>
        Read instructions
      </Link>
    ) : (
      <span className="text-sm text-mute">{exam.blockedReason}</span>
    );
  } else if (kind === "upcoming") {
    action = (
      <span className={cn(buttonStyles({ variant: "quiet" }), "w-full cursor-default bg-sand text-mute hover:bg-sand sm:w-auto")} aria-disabled>
        Not available yet
      </span>
    );
  } else {
    action = exam.resultPublished && exam.attempt ? (
      <Link href={`/candidate/results/${exam.examId}`} className={cn(buttonStyles({ variant: "secondary" }), "w-full sm:w-auto")}>
        View result
      </Link>
    ) : (
      <span className="text-sm text-mute">{exam.attempt ? "Result not published yet" : exam.blockedReason}</span>
    );
  }

  return (
    <Card as="article" className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-end sm:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={badge} />
          {kind === "upcoming" && (
            <span className="num text-[0.75rem] uppercase tracking-wide text-cobalt" aria-label={`Opens in ${countdownLabel(Date.parse(exam.startAt) - now)}`}>
              Opens in {countdownLabel(Date.parse(exam.startAt) - now)}
            </span>
          )}
        </div>
        <h3 className="display mt-3 text-[1.6rem] leading-tight">{exam.title}</h3>
        <p className="mt-2 text-[0.875rem] text-mute">{meta}</p>
        <p className="mt-2 text-[0.8125rem] text-ink">
          {exam.durationMin} minutes · {exam.totalMarks} marks
        </p>
      </div>
      <div className="sm:text-right">{action}</div>
    </Card>
  );
}

export default function CandidateDashboardPage() {
  const { data, error, loading, reload } = useApi<MyExams>("/api/me/exams");
  const now = useNow(1000);

  return (
    <>
      <PageHeader
        eyebrow="My examinations"
        title="Ready when you are."
        description="Your assigned examinations, in one place. Times are shown in your local time."
      />
      {loading && !data ? (
        <PageSkeleton />
      ) : error && !data ? (
        <ErrorState onRetry={reload} description={errorMessage(error)} />
      ) : data ? (
        <div className="max-w-[1140px]">
          <Section title="Available now">
            {data.available.length ? (
              data.available.map((e) => <ExamCard key={e.examId} exam={e} kind="available" now={now} />)
            ) : (
              <EmptyState icon={<ClipboardList className="size-5" strokeWidth={1.6} />} title="Nothing open right now" description="When an exam you are enrolled in opens, it appears here." />
            )}
          </Section>
          <Section title="Upcoming">
            {data.upcoming.length ? (
              data.upcoming.map((e) => <ExamCard key={e.examId} exam={e} kind="upcoming" now={now} />)
            ) : (
              <EmptyState icon={<CalendarClock className="size-5" strokeWidth={1.6} />} title="No upcoming exams" description="Scheduled exams show here with a countdown." />
            )}
          </Section>
          <Section id="results" title="Completed">
            {data.completed.length ? (
              data.completed.map((e) => <ExamCard key={e.examId} exam={e} kind="completed" now={now} />)
            ) : (
              <EmptyState icon={<CircleCheck className="size-5" strokeWidth={1.6} />} title="No completed exams yet" description="Finished exams and published results appear here." />
            )}
          </Section>
        </div>
      ) : null}
    </>
  );
}
