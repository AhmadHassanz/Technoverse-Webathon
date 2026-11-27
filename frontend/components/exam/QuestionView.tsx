"use client";

import { Flag } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import type { AttemptQuestion } from "@/shared/types";

export type LocalAnswer = { selectedOptionIds: string[]; textAnswer: string; flagged: boolean };

const TYPE_TEXT = { mcq_single: "single answer", mcq_multi: "multiple answers", written: "written answer" } as const;
const MAX_TEXT = 10000;

export function QuestionView({
  question,
  index,
  total,
  answer,
  onChange,
  idPrefix = "q",
}: {
  question: AttemptQuestion;
  index: number;
  total: number;
  answer: LocalAnswer;
  onChange: (patch: Partial<LocalAnswer>) => void;
  idPrefix?: string;
}) {
  const multi = question.type === "mcq_multi";
  const headingId = `${idPrefix}-${question.aqId}-stem`;

  function toggle(optionId: string) {
    if (multi) {
      const has = answer.selectedOptionIds.includes(optionId);
      onChange({ selectedOptionIds: has ? answer.selectedOptionIds.filter((x) => x !== optionId) : [...answer.selectedOptionIds, optionId] });
    } else {
      onChange({ selectedOptionIds: [optionId] });
    }
  }

  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">
          Question {index + 1} of {total}
        </p>
        <span className="rounded-full bg-tint px-3 py-1 text-[0.6875rem] text-cobalt">
          {question.marks} mark{question.marks === 1 ? "" : "s"} · {TYPE_TEXT[question.type]}
        </span>
      </div>
      <h2 id={headingId} className="mt-5 whitespace-pre-line text-[1.25rem] leading-relaxed text-ink sm:text-[1.35rem]">
        {question.stem}
      </h2>

      {question.type === "written" ? (
        <div className="mt-6">
          <label htmlFor={`${idPrefix}-${question.aqId}-text`} className="text-[0.8125rem] text-mute">
            Write your answer below.
          </label>
          <textarea
            id={`${idPrefix}-${question.aqId}-text`}
            value={answer.textAnswer}
            maxLength={MAX_TEXT}
            onChange={(e) => onChange({ textAnswer: e.target.value })}
            className="mt-2 min-h-56 w-full resize-y rounded-md border border-line bg-paper px-4 py-3 text-[1rem] leading-relaxed text-ink focus:border-cobalt"
          />
          <p className="mt-1 text-right text-xs text-mute">
            <span className="num">{answer.textAnswer.length}</span> / {MAX_TEXT} characters
          </p>
        </div>
      ) : (
        <fieldset className="mt-6">
          <legend className="text-[0.8125rem] text-mute">{multi ? "Select all that apply." : "Select one answer."}</legend>
          <div className="mt-3 space-y-3">
            {question.options.map((o, i) => {
              const checked = answer.selectedOptionIds.includes(o.id);
              const inputId = `${idPrefix}-${question.aqId}-${o.id}`;
              return (
                <label
                  key={o.id}
                  htmlFor={inputId}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-[8px] border px-4 py-4 transition-colors sm:px-5",
                    checked ? "border-cobalt bg-tint" : "border-line bg-surface hover:border-cobalt/50",
                  )}
                >
                  <input
                    id={inputId}
                    type={multi ? "checkbox" : "radio"}
                    name={`${idPrefix}-${question.aqId}`}
                    checked={checked}
                    onChange={() => toggle(o.id)}
                    className="size-5 shrink-0 cursor-pointer accent-cobalt"
                  />
                  <span className="flex-1 text-[1rem] text-ink">{o.label}</span>
                  <span className="num text-xs text-mute" aria-hidden>
                    {String.fromCharCode(65 + i)}
                  </span>
                </label>
              );
            })}
          </div>
          {multi && answer.selectedOptionIds.length > 0 && (
            <button type="button" className="mt-3 text-xs text-cobalt hover:underline" onClick={() => onChange({ selectedOptionIds: [] })}>
              Clear selection
            </button>
          )}
          {!multi && answer.selectedOptionIds.length > 0 && (
            <button type="button" className="mt-3 text-xs text-cobalt hover:underline" onClick={() => onChange({ selectedOptionIds: [] })}>
              Clear answer
            </button>
          )}
        </fieldset>
      )}

      <div className="mt-7 flex items-center gap-4">
        <button
          type="button"
          aria-pressed={answer.flagged}
          onClick={() => onChange({ flagged: !answer.flagged })}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-md border px-5 text-[0.875rem] font-medium transition-colors",
            answer.flagged ? "border-warning bg-warning-soft text-warning" : "border-transparent bg-sand text-cobalt hover:bg-tint",
          )}
        >
          <Flag className="size-4" aria-hidden />
          {answer.flagged ? "Flagged for review" : "Flag for review"}
        </button>
        <span className="text-xs text-mute">{answer.flagged ? "You'll see it in the submit check." : "Not flagged"}</span>
      </div>
    </section>
  );
}
