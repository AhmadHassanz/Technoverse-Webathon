"use client";

import { Check, Flag } from "lucide-react";
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
        <p className="flex items-center gap-2.5">
          <span className="num flex h-8 min-w-8 items-center justify-center rounded-[10px] bg-night px-2 text-[0.8125rem] font-medium text-lime">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[0.8125rem] font-medium text-mute">of {total}</span>
        </p>
        <span className="rounded-full bg-tint px-3 py-1 text-[0.6875rem] font-semibold text-cobalt">
          {question.marks} mark{question.marks === 1 ? "" : "s"}, {TYPE_TEXT[question.type]}
        </span>
      </div>
      <h2 id={headingId} className="mt-5 whitespace-pre-line text-[1.2rem] font-medium leading-[1.55] tracking-[-0.01em] text-ink sm:text-[1.35rem]">
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
            className="mt-2 min-h-56 w-full resize-y rounded-[14px] border border-line bg-paper px-4 py-3.5 text-[1rem] leading-relaxed text-ink transition-[border-color,box-shadow] focus:border-cobalt focus:shadow-[0_0_0_4px_var(--tint)] focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-mute">
            <span className="num">{answer.textAnswer.length}</span> / {MAX_TEXT} characters
          </p>
        </div>
      ) : (
        <fieldset className="mt-6">
          <legend className="text-[0.8125rem] text-mute">{multi ? "Select all that apply." : "Select one answer."}</legend>
          <div className="mt-3 space-y-2.5">
            {question.options.map((o, i) => {
              const checked = answer.selectedOptionIds.includes(o.id);
              const inputId = `${idPrefix}-${question.aqId}-${o.id}`;
              return (
                <label
                  key={o.id}
                  htmlFor={inputId}
                  className={cn(
                    "group flex cursor-pointer items-center gap-4 rounded-[14px] border px-3.5 py-3.5 transition-[color,background-color,border-color,box-shadow,transform] duration-200 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-tint sm:px-4",
                    checked
                      ? "border-cobalt bg-tint shadow-[0_8px_20px_-14px_var(--cobalt)]"
                      : "border-line bg-surface hover:-translate-y-px hover:border-cobalt/50 hover:shadow-card",
                  )}
                >
                  <input
                    id={inputId}
                    type={multi ? "checkbox" : "radio"}
                    name={`${idPrefix}-${question.aqId}`}
                    checked={checked}
                    onChange={() => toggle(o.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "num flex size-9 shrink-0 items-center justify-center text-[0.875rem] font-semibold transition-colors",
                      multi ? "rounded-[10px]" : "rounded-full",
                      checked ? "bg-cobalt text-on-cobalt" : "bg-sand text-mute group-hover:bg-tint group-hover:text-cobalt",
                    )}
                  >
                    {checked ? <Check className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-[1rem] leading-snug text-ink">{o.label}</span>
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
            "inline-flex h-10 items-center gap-2 rounded-[10px] border px-4 text-[0.8125rem] font-semibold transition-colors",
            answer.flagged ? "border-warning/40 bg-warning-soft text-warning" : "border-line bg-surface text-ink hover:bg-sand",
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
