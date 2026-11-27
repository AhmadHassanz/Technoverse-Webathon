"use client";

import { useState } from "react";
import { CircleCheck, FileDown } from "lucide-react";
import { Button, ConfirmModal, EmptyState, ErrorState, PageSkeleton, StatTile, StatusBadge, Table, Td, Th, THead, Tr } from "@/frontend/components/ui";
import { apiPost, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { fmtDateTime, pct, round } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import { useToast } from "@/frontend/lib/toast";
import type { Exam, ExamDetail, ExamResults } from "@/shared/types";

export function ResultsTab({ exam, onPublished }: { exam: ExamDetail; onPublished: (e: Exam) => void }) {
  const { toast } = useToast();
  const { data, error, loading, reload, setData } = useApi<ExamResults>(`/api/exams/${exam.id}/results`);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState onRetry={reload} description={errorMessage(error)} />;
  if (!data) return null;

  const { stats, rows } = data;
  const published = Boolean(data.exam.resultsPublishedAt);
  const graded = rows.filter((r) => r.score !== null).length;
  const passed = rows.filter((r) => r.passed).length;

  async function publish() {
    setBusy(true);
    setPublishError(null);
    try {
      const updated = await apiPost<Exam>(`/api/exams/${exam.id}/results/publish`, {});
      setData((d) => (d ? { ...d, exam: updated } : d));
      onPublished(updated);
      setConfirmOpen(false);
      toast("Results published. Candidates can now see their own result.");
    } catch (err) {
      const e = toApiError(err);
      setPublishError(e.status === 409 ? e.message : errorMessage(e)); // show the server's reason verbatim
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Submissions" value={rows.length} note={`${exam.enrolledCount} enrolled`} />
        <StatTile label="Average score" value={stats.attempts ? round(stats.average) : "—"} note={`of ${exam.totalMarks} marks, ${pct(stats.averagePercentage)}`} />
        <StatTile label="Pass rate" value={stats.attempts ? pct(stats.passRate, 1) : "—"} note={`${passed} of ${graded} graded candidates passed`} />
        <StatTile label="Grading complete" value={`${graded}/${rows.length}`} note={graded === rows.length ? "Ready for review and publication" : "Finish grading in the Grading tab"} />
      </div>

      {published ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-success/30 bg-success-soft px-5 py-4 text-success">
          <CircleCheck className="size-5" aria-hidden />
          <p className="text-[1rem]">Results published {fmtDateTime(data.exam.resultsPublishedAt)}. Grading is locked.</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-cobalt/30 bg-tint px-5 py-4">
          <div>
            <p className="text-[1.125rem] text-cobalt">Results are not yet visible to candidates.</p>
            <p className="mt-1 text-xs text-mute">
              Possible once the exam window has ended, nobody is still writing and every written answer is graded. Candidates see only their own result.
            </p>
          </div>
          <Button
            onClick={() => {
              setPublishError(null);
              setConfirmOpen(true);
            }}
          >
            Publish results
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState title="No attempts yet" description="Results appear here when candidates finish the exam." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Candidate</Th>
              <Th>Score</Th>
              <Th>Percentage</Th>
              <Th>Outcome</Th>
              <Th>Grading</Th>
              <Th>Submitted</Th>
              <Th>Report</Th>
            </tr>
          </THead>
          <tbody>
            {rows.map((r) => (
              <Tr key={r.attemptId}>
                <Td>
                  <p className="font-medium text-ink">{r.candidateName}</p>
                  <p className="text-xs text-mute">{r.email}</p>
                </Td>
                <Td className="num">{r.score === null ? "—" : `${r.score} / ${exam.totalMarks}`}</Td>
                <Td className="num">{pct(r.percentage, 1)}</Td>
                <Td>{r.passed === null ? <span className="text-mute">Pending</span> : r.passed ? <span className="text-success">Pass</span> : <span className="text-danger">Not passed</span>}</Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td className="num text-[0.8125rem] text-mute">{fmtDateTime(r.submittedAt)}</Td>
                <Td>
                  <a href={`/api/reports/attempts/${r.attemptId}`} target="_blank" rel="noopener" className="text-[0.8125rem] text-cobalt hover:underline">
                    {published ? "Download PDF" : "Provisional PDF"}
                  </a>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={`/api/reports/exams/${exam.id}`}
          target="_blank"
          rel="noopener"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-5 text-[0.9rem] font-medium text-cobalt hover:bg-tint"
        >
          <FileDown className="size-4" /> Download exam report
        </a>
        <p className="text-xs text-mute">{rows.length} results, candidates who never started are listed in the Candidates tab</p>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        eyebrow="Publish results"
        title="Publish results to candidates?"
        description="Each candidate will see their own score, the correct answers and your feedback, and can download a verified report. Grading is locked afterwards."
        warning={publishError ?? "This can't be undone"}
        warningDetail={publishError ? "Fix this, then try again." : "Check the marks above first."}
        confirmLabel="Publish results"
        tone="primary"
        onConfirm={() => void publish()}
        busy={busy}
      />
    </div>
  );
}
