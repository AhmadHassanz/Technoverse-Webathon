"use client";

import { CircleAlert } from "lucide-react";
import { Badge, Card, EmptyState, ErrorState, PageSkeleton, StatTile, Table, Td, Th, THead, Tr } from "@/frontend/components/ui";
import { TYPE_LABEL } from "@/frontend/components/exam/QuestionEditor";
import { errorMessage } from "@/frontend/lib/api-client";
import { pct, round } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import type { ExamAnalytics, ExamDetail } from "@/shared/types";

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function Histogram({ data }: { data: ExamAnalytics["distribution"] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex h-48 items-end gap-2 border-b border-line" role="img" aria-label={`Score distribution: ${data.map((d) => `${d.bucket}%: ${d.count}`).join(", ")}`}>
        {data.map((d) => (
          <div key={d.bucket} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="num mb-1 text-[0.6875rem] text-mute">{d.count}</span>
            <div className="w-full max-w-10 rounded-t-[3px] bg-cobalt" style={{ height: `${(d.count / max) * 80}%`, minHeight: d.count ? 4 : 1 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <span key={d.bucket} className="num flex-1 text-center text-[0.625rem] text-mute">
            {d.bucket}
          </span>
        ))}
      </div>
    </div>
  );
}

function FairnessBars({ data }: { data: ExamAnalytics["fairness"] }) {
  const span = Math.max(10, ...data.map((f) => Math.abs(f.deviationPct)));
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,7rem)_1fr_4rem] gap-3 text-[0.625rem] text-mute">
        <span />
        <div className="flex justify-between">
          <span>−{round(span, 0)}% easier</span>
          <span>0%</span>
          <span>+{round(span, 0)}% harder</span>
        </div>
        <span />
      </div>
      <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        {data.map((f) => {
          const w = (Math.abs(f.deviationPct) / span) * 50;
          return (
            <li key={f.attemptId} className="grid grid-cols-[minmax(0,7rem)_1fr_4rem] items-center gap-3 text-[0.8125rem]">
              <span className="truncate text-ink" title={f.candidateName}>
                {f.candidateName}
              </span>
              <div className="relative h-3">
                <div className="absolute inset-y-[-4px] left-1/2 w-px bg-line" aria-hidden />
                <div
                  className={f.deviationPct >= 0 ? "absolute inset-y-0 left-1/2 rounded-r-[2px] bg-cobalt" : "absolute inset-y-0 rounded-l-[2px] bg-cobalt/60"}
                  style={f.deviationPct >= 0 ? { width: `${w}%` } : { width: `${w}%`, right: "50%" }}
                />
              </div>
              <span className="num text-right text-xs text-cobalt">
                {f.deviationPct > 0 ? "+" : ""}
                {round(f.deviationPct, 1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AnalyticsTab({ exam }: { exam: ExamDetail }) {
  const { data, error, loading, reload } = useApi<ExamAnalytics>(`/api/exams/${exam.id}/analytics`);
  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState onRetry={reload} description={errorMessage(error)} />;
  if (!data) return null;
  const { stats } = data;
  if (stats.attempts === 0) {
    return <EmptyState title="Not enough data yet" description="Analytics appear once candidates have finished and been graded." />;
  }
  const spread = Math.max(...data.fairness.map((f) => Math.abs(f.deviationPct)), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Mean score" value={pct(stats.averagePercentage)} note={`${round(stats.average)} of ${exam.totalMarks} marks`} />
        <StatTile label="Median" value={round(stats.median)} note={`of ${exam.totalMarks} marks`} />
        <StatTile label="Highest / lowest" value={`${round(stats.highest)} / ${round(stats.lowest)}`} note="marks" />
        <StatTile label="Pass rate" value={pct(stats.passRate)} note={`${stats.attempts} scored attempts`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h3 className="display display-sm">Score distribution</h3>
          <p className="mt-1 text-xs text-mute">{stats.attempts} scored attempts · 10 equal score bands (% of paper marks)</p>
          <div className="mt-6">
            <Histogram data={data.distribution} />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h3 className="display display-sm">Paper fairness</h3>
          <p className="mt-1 text-xs text-mute">
            How hard each candidate&apos;s random paper was compared with the average paper. Largest gap: {round(spread, 1)}%.
          </p>
          <div className="mt-5">
            {data.fairness.length ? <FairnessBars data={data.fairness} /> : <p className="text-sm text-mute">Every candidate got the same paper.</p>}
          </div>
        </Card>
      </div>

      <Table>
        <THead>
          <tr>
            <Th className="w-[34%]">Question</Th>
            <Th>Shown</Th>
            <Th>Correct</Th>
            <Th>Skipped</Th>
            <Th>Most chosen wrong</Th>
            <Th>Labelled → observed</Th>
            <Th>Review</Th>
          </tr>
        </THead>
        <tbody>
          {data.questions.map((q, i) => (
            <Tr key={q.questionId}>
              <Td>
                <p className="line-clamp-2 text-ink">
                  <span className="num text-mute">Q{String(i + 1).padStart(2, "0")} · </span>
                  {q.stem}
                </p>
                <p className="text-xs text-mute">{TYPE_LABEL[q.type]}</p>
              </Td>
              <Td className="num">{q.timesShown}</Td>
              <Td className="num">{pct(q.correctPct)}</Td>
              <Td className="num">{pct(q.skippedPct)}</Td>
              <Td className="text-[0.8125rem]">{q.mostChosenWrong ? `${q.mostChosenWrong.label} · ${pct(q.mostChosenWrong.pct)}` : "—"}</Td>
              <Td className="whitespace-nowrap">
                {cap(q.labelledDifficulty)} → {q.observedDifficulty ? cap(q.observedDifficulty) : <span className="text-mute">not enough data</span>}
              </Td>
              <Td>
                {q.mismatch ? (
                  <Badge tone="warning">
                    <CircleAlert className="size-3" /> Mismatch
                  </Badge>
                ) : q.observedDifficulty ? (
                  <span className="text-[0.8125rem] text-mute">Matched</span>
                ) : (
                  <span className="text-xs text-mute">—</span>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
