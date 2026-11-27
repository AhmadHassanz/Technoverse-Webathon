"use client";

import { Check, Flag } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import type { AttemptQuestion } from "@/shared/types";

export type QState = { answered: boolean; flagged: boolean };

const pad2 = (n: number) => String(n).padStart(2, "0");

export function QuestionSquare({
  n,
  state,
  current,
  onClick,
  size = "md",
}: {
  n: number;
  state: QState;
  current?: boolean;
  onClick?: () => void;
  size?: "md" | "sm";
}) {
  const label = `Question ${n}, ${state.answered ? "answered" : "not answered"}${state.flagged ? ", flagged for review" : ""}${current ? ", current" : ""}`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={current ? "step" : undefined}
      className={cn(
        "num inline-flex items-center justify-center gap-1 rounded-[10px] border text-[0.8125rem] font-medium transition-all hover:-translate-y-px",
        size === "md" ? "h-11 w-full" : "h-10 w-12",
        state.flagged
          ? "border-warning/40 bg-warning-soft text-warning"
          : state.answered
            ? "border-cobalt bg-cobalt text-on-cobalt"
            : "border-line bg-surface text-ink hover:border-cobalt/60",
        current && "ring-2 ring-night ring-offset-2 ring-offset-surface",
      )}
    >
      {state.flagged ? <Flag className="size-3" aria-hidden /> : state.answered ? <Check className="size-3" aria-hidden /> : null}
      {pad2(n)}
    </button>
  );
}

export function Navigator({
  questions,
  states,
  current,
  onJump,
}: {
  questions: AttemptQuestion[];
  states: Record<string, QState>;
  current: number;
  onJump: (index: number) => void;
}) {
  const answered = questions.filter((q) => states[q.aqId]?.answered).length;
  const flagged = questions.filter((q) => states[q.aqId]?.flagged).length;
  const left = questions.length - answered;

  return (
    <nav aria-label="Question navigator" className="lg:rounded-[18px] lg:border lg:border-line lg:bg-surface lg:p-5 lg:shadow-card">
      <p className="eyebrow">Your progress</p>
      <p className="display mt-2 text-[1.3rem] leading-tight tracking-[-0.025em]">{questions.length} questions. Your pace.</p>
      <p className="mt-2 text-[0.8125rem] text-mute" aria-live="polite">
        {answered} answered · {flagged} flagged · {left} left
      </p>
      <div className="mt-5 grid grid-cols-5 gap-2">
        {questions.map((q, i) => (
          <QuestionSquare
            key={q.aqId}
            n={i + 1}
            state={states[q.aqId] ?? { answered: false, flagged: false }}
            current={i === current}
            onClick={() => onJump(i)}
          />
        ))}
      </div>

      <p className="eyebrow mt-8">Question key</p>
      <ul className="mt-3 space-y-2.5 text-[0.8125rem] text-ink">
        <li className="flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-[8px] bg-cobalt text-on-cobalt">
            <Check className="size-3.5" />
          </span>
          Answered
        </li>
        <li className="flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-[8px] border border-line bg-surface text-mute">–</span>
          Not answered
        </li>
        <li className="flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-[8px] border border-warning/40 bg-warning-soft text-warning">
            <Flag className="size-3.5" />
          </span>
          Flagged for review
        </li>
        <li className="flex items-center gap-3">
          <span className="num inline-flex size-8 items-center justify-center rounded-[8px] border border-line bg-surface text-[0.75rem] ring-2 ring-cobalt ring-offset-2 ring-offset-parchment">
            {pad2(current + 1)}
          </span>
          Current question
        </li>
      </ul>
      <p className="mt-6 text-xs leading-relaxed text-mute">
        Your answers save automatically.
        <br />
        You can revisit any question.
      </p>
    </nav>
  );
}
