"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, FilePen, Plus, Radio, Send } from "lucide-react";
import { PageHeader } from "@/frontend/components/shell/PageHeader";
import { EmptyState, ErrorState, PageSkeleton, Select, StatTile, StatusBadge } from "@/frontend/components/ui";
import { buttonStyles } from "@/frontend/components/ui/button";
import { useAuth } from "@/frontend/lib/auth";
import { errorMessage } from "@/frontend/lib/api-client";
import { fmtDate, fmtTimeRange, greeting, plural } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import { cn } from "@/frontend/lib/utils";
import type { Exam, ExamState } from "@/shared/types";

const STATE_STYLE: Record<ExamState, { icon: typeof Radio; tile: string; bar: string }> = {
  draft: { icon: FilePen, tile: "bg-sand text-mute", bar: "bg-line-strong" },
  published: { icon: Send, tile: "bg-tint text-cobalt", bar: "bg-cobalt" },
  ongoing: { icon: Radio, tile: "bg-night text-lime", bar: "bg-lime" },
  completed: { icon: CheckCircle2, tile: "bg-success-soft text-success", bar: "bg-success" },
};

/** Where each exam card leads, depending on its state. */
function cardAction(exam: Exam): { label: string; tab: string } {
  if (exam.state === "draft") return { label: "Continue editing", tab: "details" };
  if (exam.state === "ongoing") return { label: "Monitor examination", tab: "monitor" };
  if (exam.state === "completed") return { label: exam.resultsPublishedAt ? "View results" : "Grade & publish", tab: exam.resultsPublishedAt ? "results" : "grading" };
  return { label: "Manage examination", tab: "details" };
}

function cardLine(exam: Exam): string {
  if (exam.state === "draft") return `${plural(exam.enrolledCount, "candidate")} enrolled · ${plural(exam.questionCount, "question")}`;
  if (exam.state === "completed")
    return `${plural(exam.attemptCount, "submission")} · ${exam.resultsPublishedAt ? "results published" : "results not published"}`;
  if (exam.state === "ongoing") return `${exam.enrolledCount} enrolled · ${exam.attemptCount} started`;
  return `${exam.enrolledCount} enrolled · ${plural(exam.questionCount, "question")}`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export default function ExaminerDashboardPage() {
  const { me } = useAuth();
  const { data, error, loading, reload } = useApi<Exam[]>("/api/exams");
  const [filter, setFilter] = useState<ExamState | "all">("all");
  const exams = useMemo(() => data ?? [], [data]);
  const shown = filter === "all" ? exams : exams.filter((e) => e.state === filter);

  const drafts = exams.filter((e) => e.state === "draft").length;
  const published = exams.filter((e) => e.state === "published").length;
  const ongoing = exams.filter((e) => e.state === "ongoing");
  const enrolled = exams.reduce((n, e) => n + e.enrolledCount, 0);
  const name = me?.fullName.split(" ").slice(0, 2).join(" ") ?? "";

  return (
    <>
      <PageHeader
        eyebrow="Examiner / overview"
        title={`${greeting()}, ${name}.`}
        description="Keep every examination on course. All times are shown in your local time."
        action={
          <Link href="/examiner/exams/new" className={buttonStyles()}>
            <Plus className="size-4" />
            New exam
          </Link>
        }
      />

      {loading && !data ? (
        <PageSkeleton />
      ) : error && !data ? (
        <ErrorState onRetry={reload} description={errorMessage(error)} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
            <StatTile label="Total examinations" value={pad2(exams.length)} note={`${drafts} drafts · ${published} published`} />
            <StatTile
              label="Ongoing now"
              value={pad2(ongoing.length)}
              note={`${ongoing.reduce((n, e) => n + e.attemptCount, 0)} candidates have started`}
            />
            <StatTile label="Candidates enrolled" value={enrolled} note="Across your examinations" />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="display text-[1.25rem] tracking-[-0.025em]">Your examinations</h2>
              <span className="num rounded-full bg-sand px-2 py-0.5 text-[0.6875rem] text-mute">{shown.length}</span>
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="state-filter" className="sr-only">
                Filter by status
              </label>
              <Select id="state-filter" value={filter} onChange={(e) => setFilter(e.target.value as ExamState | "all")}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </Select>
            </div>
          </div>

          {exams.length === 0 ? (
            <EmptyState
              className="mt-5"
              icon={<ClipboardList className="size-5" strokeWidth={1.6} />}
              title="No exams yet"
              description="Create your first examination, then add questions and candidates."
              action={
                <Link href="/examiner/exams/new" className={buttonStyles()}>
                  <Plus className="size-4" /> Create exam
                </Link>
              }
            />
          ) : shown.length === 0 ? (
            <EmptyState className="mt-5" title="Nothing here" description="No examinations have this status." />
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {shown.map((exam) => {
                const action = cardAction(exam);
                return (
                  <Link
                    key={exam.id}
                    href={`/examiner/exams/${exam.id}?tab=${action.tab}`}
                    className="group relative flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
                  >
                    <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", STATE_STYLE[exam.state].bar)} />
                    <div className="flex items-start justify-between gap-3">
                      <span className={cn("flex size-10 items-center justify-center rounded-[12px]", STATE_STYLE[exam.state].tile)}>
                        {(() => {
                          const Icon = STATE_STYLE[exam.state].icon;
                          return <Icon className="size-[18px]" />;
                        })()}
                      </span>
                      <StatusBadge status={exam.state} />
                    </div>
                    <h3 className="display mt-4 text-[1.15rem] leading-snug tracking-[-0.025em] text-ink">{exam.title}</h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-mute">
                      <CalendarDays className="size-3.5" />
                      {fmtDate(exam.startAt)} · {fmtTimeRange(exam.startAt, exam.endAt)} · {exam.durationMin} min
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
                      <p className="text-[0.75rem] text-mute">{cardLine(exam)}</p>
                      <span className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-cobalt">
                        {action.label}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
