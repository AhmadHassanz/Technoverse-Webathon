"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/frontend/components/ui";
import { apiPatch, apiPost, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { num, zodFields } from "@/frontend/lib/forms";
import { useToast } from "@/frontend/lib/toast";
import { cn } from "@/frontend/lib/utils";
import { questionSchema, topicSchema } from "@/shared/validation";
import type { Difficulty, MultiScheme, Question, QuestionType, Topic } from "@/shared/types";

export const TYPE_LABEL: Record<QuestionType, string> = {
  mcq_single: "Single choice",
  mcq_multi: "Multiple choice",
  written: "Written",
};

export const DIFF_TONE: Record<Difficulty, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

type Opt = { label: string; isCorrect: boolean };

const blankOptions = (): Opt[] => [
  { label: "", isCorrect: true },
  { label: "", isCorrect: false },
  { label: "", isCorrect: false },
  { label: "", isCorrect: false },
];

export function QuestionEditor({
  open,
  question,
  topics,
  onClose,
  onSaved,
  onTopicCreated,
}: {
  open: boolean;
  question: Question | null; // null = new
  topics: Topic[];
  onClose: () => void;
  onSaved: (q: Question) => void;
  onTopicCreated: (t: Topic) => void;
}) {
  const { toast } = useToast();
  const [topicId, setTopicId] = useState(question?.topicId ?? topics[0]?.id ?? "");
  const [type, setType] = useState<QuestionType>(question?.type ?? "mcq_single");
  const [stem, setStem] = useState(question?.stem ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? "medium");
  const [marks, setMarks] = useState(question ? String(question.marks) : "2");
  const [negativeMarks, setNegativeMarks] = useState(question ? String(question.negativeMarks) : "0");
  const [multiScheme, setMultiScheme] = useState<MultiScheme>(question?.multiScheme ?? "all_or_nothing");
  const [options, setOptions] = useState<Opt[]>(
    question && question.options.length ? question.options.map((o) => ({ label: o.label, isCorrect: o.isCorrect })) : blankOptions(),
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [newTopic, setNewTopic] = useState<string | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);

  function changeType(next: QuestionType) {
    setType(next);
    if (next === "mcq_single") {
      // keep exactly one correct
      const first = options.findIndex((o) => o.isCorrect);
      setOptions(options.map((o, i) => ({ ...o, isCorrect: i === (first < 0 ? 0 : first) })));
    }
  }

  function toggleCorrect(index: number) {
    setOptions(
      options.map((o, i) =>
        type === "mcq_single" ? { ...o, isCorrect: i === index } : i === index ? { ...o, isCorrect: !o.isCorrect } : o,
      ),
    );
  }

  async function addTopic() {
    const parsed = topicSchema.safeParse({ name: newTopic ?? "" });
    if (!parsed.success) {
      setTopicError(parsed.error.issues[0].message);
      return;
    }
    try {
      const t = await apiPost<Topic>("/api/topics", parsed.data);
      onTopicCreated(t);
      setTopicId(t.id);
      setNewTopic(null);
      setTopicError(null);
    } catch (err) {
      const e = toApiError(err);
      setTopicError(e.fields?.name ?? errorMessage(e));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = questionSchema.safeParse({
      topicId,
      type,
      stem,
      difficulty,
      marks: num(marks),
      negativeMarks: type === "written" ? 0 : num(negativeMarks),
      multiScheme,
      options: type === "written" ? [] : options,
    });
    if (!parsed.success) {
      const f = zodFields(parsed.error);
      if (f.topicId) f.topicId = "Choose a topic (or add a new one)";
      setFields(f);
      return;
    }
    setFields({});
    setBusy(true);
    try {
      const saved = question
        ? await apiPatch<Question>(`/api/questions/${question.id}`, parsed.data)
        : await apiPost<Question>("/api/questions", parsed.data);
      toast(question ? "Question updated." : "Question added to the bank.");
      onSaved(saved);
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.fields) setFields(apiErr.fields);
      else toast(errorMessage(apiErr), "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={question ? "Question bank / edit" : "Question bank / new question"}
      title={question ? "Edit question" : "New question"}
      description={question ? "Changes apply to future papers only; attempts already started keep their copy." : undefined}
      width="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="question-form" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {question ? "Save changes" : "Add question"}
          </Button>
        </>
      }
    >
      <form id="question-form" onSubmit={save} noValidate className="space-y-5">
        <div role="radiogroup" aria-label="Question type" className="grid grid-cols-3 gap-1 rounded-md border border-line bg-sand p-1">
          {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => changeType(t)}
              className={cn(
                "h-9 rounded-[5px] text-[0.8125rem] transition-colors",
                type === t ? "bg-surface font-medium text-cobalt shadow-sm" : "text-mute hover:text-ink",
              )}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <Field label="Topic" htmlFor="q-topic" error={fields.topicId}>
          {newTopic === null ? (
            <div className="flex gap-2">
              <div className="flex-1">
                <Select id="q-topic" value={topicId} onChange={(e) => setTopicId(e.target.value)} invalid={Boolean(fields.topicId)}>
                  {topics.length === 0 && <option value="">No topics yet</option>}
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Button variant="secondary" onClick={() => setNewTopic("")}>
                <Plus className="size-4" /> New topic
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                id="q-topic"
                autoFocus
                placeholder="e.g. Normalisation"
                value={newTopic}
                maxLength={60}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addTopic();
                  }
                }}
                invalid={Boolean(topicError)}
                aria-label="New topic name"
              />
              <Button onClick={() => void addTopic()}>Add</Button>
              <Button variant="quiet" onClick={() => { setNewTopic(null); setTopicError(null); }}>
                Cancel
              </Button>
            </div>
          )}
          {topicError && <p role="alert" className="text-xs text-danger">{topicError}</p>}
        </Field>

        <Field label="Question" htmlFor="q-stem" hint={`${stem.length} / 2000`} error={fields.stem}>
          <Textarea
            id="q-stem"
            value={stem}
            maxLength={2000}
            onChange={(e) => setStem(e.target.value)}
            placeholder="Which normal form removes transitive dependencies?"
            invalid={Boolean(fields.stem)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Difficulty" htmlFor="q-diff" error={fields.difficulty}>
            <Select id="q-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </Field>
          <Field label="Marks" htmlFor="q-marks" error={fields.marks}>
            <Input
              id="q-marks"
              type="number"
              min={0}
              max={100}
              step="0.5"
              inputMode="decimal"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              invalid={Boolean(fields.marks)}
            />
          </Field>
          {type !== "written" && (
            <Field label="Negative marks" htmlFor="q-neg" hint="0 = off" error={fields.negativeMarks}>
              <Input
                id="q-neg"
                type="number"
                min={0}
                step="0.25"
                inputMode="decimal"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(e.target.value)}
                invalid={Boolean(fields.negativeMarks)}
              />
            </Field>
          )}
        </div>

        {type === "mcq_multi" && (
          <Field label="Marking scheme" htmlFor="q-scheme">
            <Select id="q-scheme" value={multiScheme} onChange={(e) => setMultiScheme(e.target.value as MultiScheme)}>
              <option value="all_or_nothing">All or nothing</option>
              <option value="partial">Partial credit</option>
            </Select>
          </Field>
        )}

        {type !== "written" ? (
          <fieldset>
            <legend className="text-[0.8125rem] font-medium text-ink">
              Options <span className="font-normal text-mute">({type === "mcq_single" ? "mark the one correct answer" : "mark every correct answer"})</span>
            </legend>
            <ul className="mt-3 space-y-2.5">
              {options.map((o, i) => {
                const letter = String.fromCharCode(65 + i);
                return (
                  <li key={i} className="flex items-center gap-2.5">
                    <input
                      type={type === "mcq_single" ? "radio" : "checkbox"}
                      name="correct"
                      checked={o.isCorrect}
                      onChange={() => toggleCorrect(i)}
                      className="size-4 shrink-0 cursor-pointer accent-cobalt"
                      aria-label={`Option ${letter} is correct`}
                    />
                    <span className="num w-4 text-sm text-mute" aria-hidden>
                      {letter}
                    </span>
                    <Input
                      value={o.label}
                      maxLength={500}
                      onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      placeholder={`Option ${letter}`}
                      aria-label={`Option ${letter} text`}
                      className="h-10"
                    />
                    <button
                      type="button"
                      aria-label={`Remove option ${letter}`}
                      disabled={options.length <= 2}
                      onClick={() => setOptions(options.filter((_, j) => j !== i))}
                      className="rounded-md p-2 text-mute hover:bg-sand hover:text-danger disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {fields.options && (
              <p role="alert" className="mt-2 text-xs text-danger">
                {fields.options}
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              disabled={options.length >= 6}
              onClick={() => setOptions([...options, { label: "", isCorrect: false }])}
            >
              <Plus className="size-4" /> Add option ({options.length}/6)
            </Button>
          </fieldset>
        ) : (
          <p className="rounded-md bg-tint px-4 py-3 text-[0.8125rem] text-cobalt">
            Written answers are graded by you in the Grading tab after the exam.
          </p>
        )}
      </form>
    </Modal>
  );
}
