"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck, Loader2, Lock } from "lucide-react";
import { Button, Card, Checkbox, EmptyState, ErrorState, Field, Input, PageSkeleton, Textarea } from "@/frontend/components/ui";
import { apiPatch, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { num, zodFields } from "@/frontend/lib/forms";
import { useApi } from "@/frontend/lib/useApi";
import { useToast } from "@/frontend/lib/toast";
import { gradeSchema } from "@/shared/validation";
import type { ExamDetail, GradingItem } from "@/shared/types";

/** One written answer at a time: marks (0..max) + feedback, Save & next. */
export function GradingTab({ exam }: { exam: ExamDetail }) {
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const { data, error, loading, reload, setData } = useApi<GradingItem[]>(`/api/exams/${exam.id}/grading?status=${showAll ? "all" : "pending"}`);
  const items = data ?? [];
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const locked = Boolean(exam.resultsPublishedAt);

  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState onRetry={reload} description={errorMessage(error)} />;

  const i = Math.min(index, Math.max(0, items.length - 1));
  const item = items[i];
  const pendingCount = showAll ? items.filter((x) => x.marksAwarded === null).length : items.length;

  async function save() {
    if (!item) return;
    const m = marks[item.aqId] ?? (item.marksAwarded !== null ? String(item.marksAwarded) : "");
    const f = feedback[item.aqId] ?? item.feedback ?? "";
    const parsed = gradeSchema.safeParse({ marksAwarded: num(m), feedback: f });
    if (!parsed.success) {
      setFields(zodFields(parsed.error));
      return;
    }
    if (parsed.data.marksAwarded > item.marks) {
      setFields({ marksAwarded: `Marks can't be more than ${item.marks}` });
      return;
    }
    setFields({});
    setBusy(true);
    try {
      const updated = await apiPatch<GradingItem>(`/api/attempt-questions/${item.aqId}/grade`, parsed.data);
      toast(`Saved ${updated.marksAwarded} / ${updated.marks} for ${updated.candidateName}.`);
      if (showAll) {
        setData((all) => (all ?? []).map((x) => (x.aqId === updated.aqId ? updated : x)));
        setIndex(Math.min(i + 1, items.length - 1));
      } else {
        setData((all) => (all ?? []).filter((x) => x.aqId !== updated.aqId)); // the next one slides into place
      }
    } catch (err) {
      const e = toApiError(err);
      if (e.fields) setFields(e.fields);
      else toast(errorMessage(e), "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="h-fit p-5">
        <p className="display text-[1.6rem]">
          {pendingCount} answer{pendingCount === 1 ? "" : "s"} pending
        </p>
        <Checkbox
          className="mt-5"
          label="Show all written answers (including graded)"
          checked={showAll}
          onChange={(e) => {
            setShowAll(e.target.checked);
            setIndex(0);
          }}
        />
        {locked && (
          <p className="mt-4 flex items-start gap-2 rounded-md bg-sand px-3 py-2.5 text-xs text-ink">
            <Lock className="mt-0.5 size-3.5 shrink-0" /> Results are published, so grading is locked.
          </p>
        )}
        {item && (
          <>
            <p className="eyebrow mt-6">Current response</p>
            <p className="mt-2 text-[1.05rem] text-ink">{item.candidateName}</p>
            <p className="text-xs text-mute">Question {item.position}</p>
            {items.length > 1 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs text-mute">Up next</p>
                <ul className="mt-2 space-y-2">
                  {items.slice(i + 1, i + 4).map((x) => (
                    <li key={x.aqId}>
                      <button type="button" className="text-left text-[0.8125rem] text-ink hover:text-cobalt" onClick={() => setIndex(items.indexOf(x))}>
                        {x.candidateName}
                        <span className="block text-xs text-mute">Question {x.position}{x.marksAwarded !== null ? ` · ${x.marksAwarded}/${x.marks}` : ""}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>

      {!item ? (
        <EmptyState
          icon={<CircleCheck className="size-5" strokeWidth={1.6} />}
          title={showAll ? "No written answers" : "Nothing left to grade"}
          description={
            showAll
              ? "This exam has no written answers from finished attempts yet."
              : "Every written answer from finished attempts is graded. Objective questions are marked automatically."
          }
        />
      ) : (
        <Card className="p-5 sm:p-7">
          <p className="eyebrow">
            Question {item.position} / written response · {i + 1} of {items.length}
          </p>
          <h3 className="display mt-4 whitespace-pre-line text-[1.55rem] leading-snug">{item.stem}</h3>
          <p className="mt-3 text-xs text-mute">Maximum: {item.marks} marks</p>
          <div className="mt-5 border-t border-line pt-5">
            <p className="meta-label">Candidate answer</p>
            <p className="mt-3 whitespace-pre-line text-[1rem] leading-relaxed text-ink">
              {item.textAnswer.trim() ? item.textAnswer : <span className="italic text-mute">Left blank.</span>}
            </p>
          </div>
          <form
            className="mt-7 grid gap-5 md:grid-cols-[180px_1fr]"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            noValidate
          >
            <Field label={`Marks awarded (max ${item.marks})`} htmlFor="grade-marks" error={fields.marksAwarded}>
              <Input
                id="grade-marks"
                key={`m-${item.aqId}`}
                type="number"
                min={0}
                max={item.marks}
                step="0.25"
                inputMode="decimal"
                disabled={locked}
                value={marks[item.aqId] ?? (item.marksAwarded !== null ? String(item.marksAwarded) : "")}
                onChange={(e) => setMarks({ ...marks, [item.aqId]: e.target.value })}
                invalid={Boolean(fields.marksAwarded)}
                autoFocus
              />
            </Field>
            <Field label="Feedback" htmlFor="grade-feedback" optional error={fields.feedback}>
              <Textarea
                id="grade-feedback"
                className="min-h-20"
                maxLength={1000}
                disabled={locked}
                value={feedback[item.aqId] ?? item.feedback ?? ""}
                onChange={(e) => setFeedback({ ...feedback, [item.aqId]: e.target.value })}
                placeholder="Shown to the candidate with their result."
              />
            </Field>
            <div className="flex flex-wrap justify-between gap-3 md:col-span-2">
              <Button variant="secondary" disabled={i === 0} onClick={() => setIndex(i - 1)}>
                Previous
              </Button>
              <Button type="submit" disabled={busy || locked}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                Save &amp; next <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
