"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import { Button, Modal, Skeleton } from "@/frontend/components/ui";
import { apiGet, apiPost, errorMessage } from "@/frontend/lib/api-client";
import { fmtExamLine } from "@/frontend/lib/format";
import { useToast } from "@/frontend/lib/toast";
import type { Exam, PublishCheck } from "@/shared/types";

/** Calls publish-check, shows the checklist; Publish is enabled only when canPublish. */
export function PublishReviewModal({
  exam,
  open,
  onClose,
  onPublished,
}: {
  exam: Exam;
  open: boolean;
  onClose: () => void;
  onPublished: (exam: Exam) => void;
}) {
  const { toast } = useToast();
  const [check, setCheck] = useState<PublishCheck | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    apiGet<PublishCheck>(`/api/exams/${exam.id}/publish-check`).then(
      (c) => {
        if (!alive) return;
        setCheck(c);
        setLoadError(null);
      },
      (err) => alive && setLoadError(errorMessage(err)),
    );
    return () => {
      alive = false;
      setCheck(null);
    };
  }, [open, exam.id, version]);

  async function publish() {
    setBusy(true);
    try {
      const updated = await apiPost<Exam>(`/api/exams/${exam.id}/publish`, {});
      toast("Exam published. Enrolled candidates can now see it.");
      onPublished(updated);
    } catch (err) {
      toast(errorMessage(err), "danger");
      setVersion((v) => v + 1); // re-check: something changed
    } finally {
      setBusy(false);
    }
  }

  const problems = check?.problems ?? [];
  const passed: string[] = [];
  if (check) {
    passed.push("Required details and schedule are complete");
    if (!problems.some((p) => /question|pool|blueprint|marks/i.test(p)))
      passed.push(`Paper: ${check.summary.paperQuestionCount} questions · ${check.summary.paperMarks} marks`);
    if (!problems.some((p) => /candidate|enrol/i.test(p))) passed.push(`${check.summary.enrolledCount} candidates enrolled`);
    if (!problems.some((p) => /option|correct|answer key/i.test(p))) passed.push("All answer keys and marking schemes are valid");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Publish review"
      title={
        !check
          ? "Checking your exam…"
          : check.canPublish
            ? "Ready to publish."
            : `Resolve ${problems.length} issue${problems.length === 1 ? "" : "s"} to publish.`
      }
      description={`${exam.title} is still a draft. Candidates cannot access it yet.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Back to exam
          </Button>
          <div className="flex flex-col items-end gap-1">
            <Button onClick={() => void publish()} disabled={!check?.canPublish || busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {check && !check.canPublish ? "Publish unavailable" : "Publish exam"}
            </Button>
          </div>
        </>
      }
    >
      {loadError ? (
        <div className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">
          {loadError}{" "}
          <button type="button" className="font-medium underline" onClick={() => setVersion((v) => v + 1)}>
            Retry
          </button>
        </div>
      ) : !check ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-20" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : (
        <>
          <div className="rounded-[10px] border border-cobalt/30 bg-tint px-5 py-4">
            <p className="text-[1rem] text-cobalt">
              {check.summary.poolSize} questions in pool · {check.summary.paperQuestionCount} per paper · {check.summary.paperMarks} marks
            </p>
            <p className="mt-2 text-xs text-mute">
              {fmtExamLine(exam.startAt, exam.endAt, exam.durationMin, exam.totalMarks)} · {check.summary.enrolledCount} enrolled
            </p>
          </div>
          <p className="meta-label mt-6">Publish checklist</p>
          <ul className="mt-3 space-y-2.5 text-[0.9375rem]">
            {problems.map((p) => (
              <li key={p} className="flex items-start gap-2 text-danger">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="sr-only">Problem: </span>
                  {p}
                </span>
              </li>
            ))}
            {passed.map((p) => (
              <li key={p} className="flex items-start gap-2 text-ink">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          {!check.canPublish && <p className="mt-5 text-xs text-mute">Publish is enabled only after every check passes.</p>}
        </>
      )}
    </Modal>
  );
}
