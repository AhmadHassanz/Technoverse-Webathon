"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Eye, FileDown, Loader2, Undo2 } from "lucide-react";
import {
  BackLink,
  Button,
  ConfirmModal,
  EmptyState,
  ErrorState,
  PageSkeleton,
  StatusBadge,
  Tabs,
} from "@/frontend/components/ui";
import { PublishReviewModal } from "@/frontend/components/exam/PublishReviewModal";
import { DetailsTab } from "@/frontend/components/exam/tabs/DetailsTab";
import { QuestionsTab } from "@/frontend/components/exam/tabs/QuestionsTab";
import { CandidatesTab } from "@/frontend/components/exam/tabs/CandidatesTab";
import { MonitorTab } from "@/frontend/components/exam/tabs/MonitorTab";
import { GradingTab } from "@/frontend/components/exam/tabs/GradingTab";
import { ResultsTab } from "@/frontend/components/exam/tabs/ResultsTab";
import { AnalyticsTab } from "@/frontend/components/exam/tabs/AnalyticsTab";
import { apiPost, errorMessage } from "@/frontend/lib/api-client";
import { fmtExamLine } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import { useToast } from "@/frontend/lib/toast";
import type { Exam, ExamDetail, StartAttemptResult } from "@/shared/types";

const TABS = ["details", "questions", "candidates", "monitor", "grading", "results", "analytics"] as const;
type Tab = (typeof TABS)[number];
const LABELS: Record<Tab, string> = {
  details: "Details",
  questions: "Questions",
  candidates: "Candidates",
  monitor: "Monitor",
  grading: "Grading",
  results: "Results",
  analytics: "Analytics",
};

function ExamPageInner() {
  const { examId } = useParams<{ examId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const requested = search.get("tab") as Tab | null;
  const tab: Tab = requested && TABS.includes(requested) ? requested : "details";

  const { data: exam, error, loading, reload, setData } = useApi<ExamDetail>(`/api/exams/${examId}`);
  const [publishOpen, setPublishOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [busy, setBusy] = useState<"preview" | "unpublish" | null>(null);

  const merge = (patch: Partial<ExamDetail>) => setData((d) => (d ? { ...d, ...patch } : d));

  if (loading && !exam) return <PageSkeleton />;
  if (error && !exam) {
    if (error.status === 404)
      return <EmptyState title="Exam not found" description="It may have been deleted." action={<BackLink href="/examiner">Back to overview</BackLink>} />;
    if (error.status === 403)
      return <EmptyState title="You don't have access" description="Only the examiner who created this exam (or an admin) can open it." action={<BackLink href="/examiner">Back to overview</BackLink>} />;
    return <ErrorState onRetry={reload} description={errorMessage(error)} />;
  }
  if (!exam) return null;

  async function preview() {
    setBusy("preview");
    try {
      const r = await apiPost<StartAttemptResult>(`/api/exams/${examId}/attempts`, { sandbox: true });
      router.push(`/attempt/${r.attemptId}`);
    } catch (err) {
      toast(errorMessage(err), "danger");
      setBusy(null);
    }
  }

  async function unpublish() {
    setBusy("unpublish");
    try {
      const updated = await apiPost<Exam>(`/api/exams/${examId}/unpublish`, {});
      merge(updated);
      toast("Back to draft. You can edit it again.");
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBusy(null);
      setUnpublishOpen(false);
    }
  }

  return (
    <>
      <BackLink href="/examiner">All examinations</BackLink>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="eyebrow">Examinations / {exam.state}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="display display-lg text-balance">{exam.title}</h1>
            <StatusBadge status={exam.state} />
          </div>
          <p className="num mt-3 text-[0.875rem] text-mute">
            {fmtExamLine(exam.startAt, exam.endAt, exam.durationMin, exam.totalMarks)} · pass {exam.passMarks}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => void preview()} disabled={busy !== null || exam.questions.length === 0} title={exam.questions.length === 0 ? "Add questions first" : "Try the exam as a candidate (not counted)"}>
            {busy === "preview" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            Preview
          </Button>
          {exam.state === "draft" && <Button onClick={() => setPublishOpen(true)}>Publish exam</Button>}
          {exam.state === "published" && (
            <Button variant="secondary" onClick={() => setUnpublishOpen(true)}>
              <Undo2 className="size-4" /> Unpublish
            </Button>
          )}
          {exam.state === "completed" && (
            <a href={`/api/reports/exams/${exam.id}`} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-5 text-[0.9rem] font-medium text-cobalt hover:border-cobalt/60 hover:bg-tint">
              <FileDown className="size-4" /> Exam report
            </a>
          )}
        </div>
      </div>

      <Tabs
        className="mt-7 overflow-x-auto"
        items={TABS.map((t) => ({
          value: t,
          label: LABELS[t],
          count: t === "questions" ? exam.questionCount : t === "candidates" ? exam.enrolledCount : undefined,
        }))}
        value={tab}
        onChange={(t) => router.replace(`/examiner/exams/${examId}?tab=${t}`, { scroll: false })}
      />

      <div className="mt-7">
        {tab === "details" && <DetailsTab exam={exam} onChanged={merge} />}
        {tab === "questions" && (
          <QuestionsTab key={exam.state} exam={exam} onChanged={(d) => setData(() => d)} />
        )}
        {tab === "candidates" && <CandidatesTab exam={exam} onCountChanged={(n) => merge({ enrolledCount: n })} />}
        {tab === "monitor" && <MonitorTab exam={exam} />}
        {tab === "grading" && <GradingTab exam={exam} />}
        {tab === "results" && <ResultsTab exam={exam} onPublished={merge} />}
        {tab === "analytics" && <AnalyticsTab exam={exam} />}
      </div>

      <PublishReviewModal
        exam={exam}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={(e) => {
          merge(e);
          setPublishOpen(false);
        }}
      />
      <ConfirmModal
        open={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        eyebrow="Unpublish"
        title="Move this exam back to draft?"
        description="Candidates will no longer see it until you publish again. This is only possible before it starts and while nobody has an attempt."
        confirmLabel="Unpublish"
        tone="primary"
        onConfirm={() => void unpublish()}
        busy={busy === "unpublish"}
      />
    </>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExamPageInner />
    </Suspense>
  );
}
