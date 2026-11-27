"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarClock, CircleCheck, Clock3, ClipboardList, FileCheck2, Hourglass } from "lucide-react";
import { PageHeader } from "@/frontend/components/shell/PageHeader";
import { Card, EmptyState, ErrorState, PageSkeleton, StatusBadge } from "@/frontend/components/ui";
import { useAuth } from "@/frontend/lib/auth";
import { errorMessage } from "@/frontend/lib/api-client";
import { countdownLabel, fmtDate, fmtDateTime, fmtTime, fmtTimeRange, greeting } from "@/frontend/lib/format";
import { Button } from "@/frontend/components/ui/button";
import { useApi } from "@/frontend/lib/useApi";
import { useNow } from "@/frontend/lib/useNow";
import { cn } from "@/frontend/lib/utils";
import type { CandidateExam, MyExams } from "@/shared/types";

function SectionTitle({ id, title, count, children }: { id?: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-24 first:mt-0" aria-labelledby={`${title}-h`}>
      <div className="mb-4 flex items-center gap-3">
        <h2 id={`${title}-h`} className="display text-[1.25rem] tracking-[-0.025em]">
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="num rounded-full bg-sand px-2 py-0.5 text-[0.6875rem] text-mute">{count}</span>
        )}
      </div>
      {children}
    </section>
  );
}

/** Big dark card for an exam that is open right now. */
function LiveCard({ exam, now }: { exam: CandidateExam; now: number }) {
  const inProgress = exam.attempt?.status === "in_progress";
  const left = Date.parse(exam.endAt) - now;
  const sameDay = new Date(exam.endAt).toDateString() === new Date(now).toDateString();
  return (
    <article className="glow-iris relative overflow-hidden rounded-[22px] bg-night p-6 text-lime shadow-pop sm:p-8">
      <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-lime px-2.5 py-1 text-[0.8125rem] font-medium text-on-lime">
            {inProgress ? "In progress" : "Open now"}
          </p>
          <h3 className="display mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.05] text-lime">{exam.title}</h3>
          <div className="mt-5 flex flex-wrap gap-2 text-[0.8125rem]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/15 bg-lime/5 px-3 py-1.5">
              <Clock3 className="size-3.5 text-lime" /> {exam.durationMin} minutes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/15 bg-lime/5 px-3 py-1.5">
              <FileCheck2 className="size-3.5 text-lime" /> {exam.totalMarks} marks
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/15 bg-lime/5 px-3 py-1.5">
              <Hourglass className="size-3.5 text-lime" /> Closes {fmtTime(exam.endAt)}
              {sameDay ? " today" : `, ${fmtDate(exam.endAt)}`}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <p className="text-[0.75rem] text-night-mute">
            Window closes in <span className="num text-[0.875rem] text-lime">{countdownLabel(left)}</span>
          </p>
          {inProgress ? (
            <Link
              href={`/attempt/${exam.attempt!.id}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lime px-7 text-[0.9375rem] font-semibold text-on-lime  transition-transform hover:-translate-y-0.5"
            >
              Continue exam <ArrowRight className="size-4" />
            </Link>
          ) : exam.canStart ? (
            <Link
              href={`/candidate/exams/${exam.examId}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lime px-7 text-[0.9375rem] font-semibold text-on-lime  transition-transform hover:-translate-y-0.5"
            >
              Read instructions & start <ArrowRight className="size-4" />
            </Link>
          ) : (
            <span className="text-sm text-night-mute">{exam.blockedReason}</span>
          )}
        </div>
      </div>
    </article>
  );
}

function UpcomingCard({ exam, now }: { exam: CandidateExam; now: number }) {
  return (
    <Card as="article" className="flex flex-col p-5 transition-shadow hover:shadow-pop">
      <div className="flex items-center justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-[12px] bg-tint text-cobalt">
          <CalendarClock className="size-5" />
        </span>
        <span className="num rounded-full bg-night px-2.5 py-1 text-[0.6875rem] text-lime" aria-label={`Opens in ${countdownLabel(Date.parse(exam.startAt) - now)}`}>
          in {countdownLabel(Date.parse(exam.startAt) - now)}
        </span>
      </div>
      <h3 className="display mt-4 text-[1.2rem] leading-snug tracking-[-0.025em]">{exam.title}</h3>
      <p className="mt-1.5 text-[0.8125rem] text-mute">
        {fmtDate(exam.startAt)}, {fmtTimeRange(exam.startAt, exam.endAt)}
      </p>
      <div className="mt-auto flex items-center gap-3 border-t border-line-soft pt-4 text-[0.75rem] text-mute">
        <span>{exam.durationMin} min</span>
        <span className="size-1 rounded-full bg-line-strong" />
        <span>{exam.totalMarks} marks</span>
        <span className="ml-auto font-medium text-mute">Not open yet</span>
      </div>
    </Card>
  );
}

function CompletedRow({ exam }: { exam: CandidateExam }) {
  const badge = exam.attempt?.status ?? "not_started";
  const canView = exam.resultPublished && exam.attempt;
  const meta = exam.attempt?.submittedAt ? `Submitted ${fmtDateTime(exam.attempt.submittedAt)}` : exam.blockedReason ?? "Closed";
  const inner = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[12px]",
          canView ? "bg-success-soft text-success" : "bg-sand text-mute",
        )}
      >
        <CircleCheck className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-medium text-ink">{exam.title}</p>
        <p className="mt-0.5 truncate text-[0.75rem] text-mute">
          {meta}, {exam.totalMarks} marks
        </p>
      </div>
      <div className="hidden sm:block">
        <StatusBadge status={badge} />
      </div>
      {canView ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[0.8125rem] font-semibold text-cobalt">
          Result <ArrowUpRight className="size-4" />
        </span>
      ) : (
        <span className="hidden shrink-0 text-[0.75rem] text-mute md:block">
          {exam.attempt ? "Awaiting publication" : "Not taken"}
        </span>
      )}
    </>
  );
  const cls = "flex items-center gap-4 px-4 py-3.5 sm:px-5";
  return canView ? (
    <Link href={`/candidate/results/${exam.examId}`} className={cn(cls, "transition-colors hover:bg-paper")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default function CandidateDashboardPage() {
  const { me } = useAuth();
  const { data, error, loading, reload } = useApi<MyExams>("/api/me/exams");
  const now = useNow(1000);
  const [doneLimit, setDoneLimit] = useState(10); // completed list: 10 at first, then 10 more per click
  const first = me?.fullName.split(" ")[0] ?? "";
  const published = data?.completed.filter((e) => e.resultPublished && e.attempt).length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="My examinations"
        title={`${greeting()}, ${first}.`}
        description="Everything you are enrolled in, in one calm place. Times are in your local time."
      />
      {loading && !data ? (
        <PageSkeleton />
      ) : error && !data ? (
        <ErrorState onRetry={reload} description={errorMessage(error)} />
      ) : data ? (
        <div className="animate-rise">
          <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: "Open now", value: data.available.length },
              { label: "Upcoming", value: data.upcoming.length },
              { label: "Results ready", value: published },
            ].map((s) => (
              <div key={s.label} className="min-w-0 rounded-[16px] border border-line bg-surface px-2.5 py-3.5 sm:px-5">
                <p className="display text-[1.75rem] leading-none tracking-[-0.04em]">{String(s.value).padStart(2, "0")}</p>
                <p className="mt-1.5 text-[0.75rem] leading-tight text-mute sm:text-[0.8125rem]">{s.label}</p>
              </div>
            ))}
          </div>

          <SectionTitle title="Available now" count={data.available.length}>
            {data.available.length ? (
              <div className="space-y-4">
                {data.available.map((e) => (
                  <LiveCard key={e.examId} exam={e} now={now} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ClipboardList className="size-5" strokeWidth={1.8} />}
                title="Nothing open right now"
                description="When an exam you are enrolled in opens, it appears here."
              />
            )}
          </SectionTitle>

          <SectionTitle title="Upcoming" count={data.upcoming.length}>
            {data.upcoming.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.upcoming.map((e) => (
                  <UpcomingCard key={e.examId} exam={e} now={now} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarClock className="size-5" strokeWidth={1.8} />}
                title="No upcoming exams"
                description="Scheduled exams show here with a live countdown."
              />
            )}
          </SectionTitle>

          <SectionTitle id="results" title="Completed & results" count={data.completed.length}>
            {data.completed.length ? (
              <>
              <Card className="divide-y divide-line-soft overflow-hidden">
                {data.completed.slice(0, doneLimit).map((e) => (
                  <CompletedRow key={e.examId} exam={e} />
                ))}
              </Card>
              {data.completed.length > doneLimit && (
                <div className="mt-5 flex flex-col items-center gap-2">
                  <p className="text-[0.8125rem] text-mute">
                    Showing {doneLimit} of {data.completed.length}
                  </p>
                  <Button variant="secondary" onClick={() => setDoneLimit((n) => n + 10)}>
                    Show more
                  </Button>
                </div>
              )}
              </>
            ) : (
              <EmptyState
                icon={<CircleCheck className="size-5" strokeWidth={1.8} />}
                title="No completed exams yet"
                description="Finished exams and published results appear here."
              />
            )}
          </SectionTitle>

        </div>
      ) : null}
    </>
  );
}
