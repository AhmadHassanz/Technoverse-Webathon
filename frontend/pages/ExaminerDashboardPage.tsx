"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "@/frontend/components/shell/PageHeader";
import { Card, EmptyState, ErrorState, PageSkeleton, Select, StatTile, StatusBadge } from "@/frontend/components/ui";
import { buttonStyles } from "@/frontend/components/ui/button";
import { useAuth } from "@/frontend/lib/auth";
import { errorMessage } from "@/frontend/lib/api-client";
import { fmtDate, fmtTimeRange, greeting, plural } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import type { Exam, ExamState } from "@/shared/types";

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
          <div className="grid gap-5 sm:grid-cols-3">
            <StatTile label="Total examinations" value={pad2(exams.length)} note={`${drafts} drafts · ${published} published`} />
            <StatTile
              label="Ongoing now"
              value={pad2(ongoing.length)}
              note={`${ongoing.reduce((n, e) => n + e.attemptCount, 0)} candidates have started`}
            />
            <StatTile label="Candidates enrolled" value={enrolled} note="Across your examinations" />
          </div>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="display display-sm">Your examinations</h2>
            <div className="w-48">
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
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {shown.map((exam) => {
                const action = cardAction(exam);
                return (
                  <Card key={exam.id} as="article" className="flex flex-col px-5 py-5 sm:px-6">
                    <div>
                      <StatusBadge status={exam.state} />
                    </div>
                    <h3 className="mt-3 text-[1.25rem] leading-snug text-ink">{exam.title}</h3>
                    <p className="num mt-2 text-[0.8125rem] text-mute">
                      {fmtDate(exam.startAt)} · {fmtTimeRange(exam.startAt, exam.endAt)} · {exam.durationMin} min
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[0.8125rem] text-mute">{cardLine(exam)}</p>
                      <Link
                        href={`/examiner/exams/${exam.id}?tab=${action.tab}`}
                        className="inline-flex items-center gap-1 text-[0.875rem] font-medium text-cobalt hover:underline"
                      >
                        {action.label}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
