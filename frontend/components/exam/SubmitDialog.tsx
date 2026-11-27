"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import { Button, Modal } from "@/frontend/components/ui";
import { QuestionSquare, type QState } from "./Navigator";
import type { AttemptQuestion } from "@/shared/types";

export function SubmitDialog({
  open,
  onClose,
  questions,
  states,
  onJump,
  onSubmit,
  busy,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  questions: AttemptQuestion[];
  states: Record<string, QState>;
  onJump: (index: number) => void;
  onSubmit: () => void;
  busy: boolean;
  pending: number;
}) {
  const indexed = questions.map((q, i) => ({ q, i, s: states[q.aqId] ?? { answered: false, flagged: false } }));
  const answered = indexed.filter((x) => x.s.answered);
  const unanswered = indexed.filter((x) => !x.s.answered);
  const flagged = indexed.filter((x) => x.s.flagged);

  const group = (title: string, items: typeof indexed) =>
    items.length > 0 && (
      <div className="mt-5">
        <p className="text-[0.8125rem] text-ink">{title}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map(({ q, i, s }) => (
            <QuestionSquare
              key={q.aqId}
              n={i + 1}
              state={s}
              size="sm"
              onClick={() => {
                onJump(i);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      eyebrow="Before you finish"
      title="Submit your examination?"
      description="Review your progress. Select a question number to return to it before submitting."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Keep reviewing
          </Button>
          <Button onClick={onSubmit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Submitting…" : "Submit exam"}
          </Button>
        </>
      }
    >
      {group(`${answered.length} answered`, answered)}
      {group(`${unanswered.length} not answered`, unanswered)}
      {group(`${flagged.length} flagged for review`, flagged)}
      {unanswered.length > 0 && (
        <div className="mt-6 flex gap-2 rounded-md bg-warning-soft px-4 py-3 text-[0.8125rem] text-warning">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            You have {unanswered.length} unanswered question{unanswered.length === 1 ? "" : "s"}. Unanswered questions receive 0 marks.
          </p>
        </div>
      )}
      {pending > 0 && (
        <p className="mt-3 text-xs text-mute">
          {pending} answer{pending === 1 ? " is" : "s are"} still being saved; they are sent before submitting.
        </p>
      )}
      <p className="mt-4 text-xs text-mute">After submitting you cannot change your answers.</p>
    </Modal>
  );
}
