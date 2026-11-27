"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Card, Checkbox, Field, Input, Textarea } from "@/frontend/components/ui";
import { toApiError, errorMessage } from "@/frontend/lib/api-client";
import { toLocalInput } from "@/frontend/lib/format";
import { num, zodFields } from "@/frontend/lib/forms";
import { useToast } from "@/frontend/lib/toast";
import { examSchema } from "@/shared/validation";
import type { Exam, ExamInput } from "@/shared/types";

type Values = {
  title: string;
  instructions: string;
  startAt: string; // datetime-local text
  endAt: string;
  durationMin: string;
  totalMarks: string;
  passMarks: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

function initialValues(exam?: Exam | null): Values {
  if (exam) {
    return {
      title: exam.title,
      instructions: exam.instructions,
      startAt: toLocalInput(exam.startAt),
      endAt: toLocalInput(exam.endAt),
      durationMin: String(exam.durationMin),
      totalMarks: String(exam.totalMarks),
      passMarks: String(exam.passMarks),
      shuffleQuestions: exam.shuffleQuestions,
      shuffleOptions: exam.shuffleOptions,
    };
  }
  // Sensible defaults: tomorrow 09:00-10:00, 60 minutes.
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60000);
  return {
    title: "",
    instructions: "",
    startAt: toLocalInput(start.toISOString()),
    endAt: toLocalInput(end.toISOString()),
    durationMin: "60",
    totalMarks: "",
    passMarks: "",
    shuffleQuestions: true,
    shuffleOptions: true,
  };
}

/** datetime-local text -> ISO (UTC). Empty or invalid stays as typed so zod reports it. */
const toIso = (v: string) => {
  const d = new Date(v);
  return v && !Number.isNaN(d.getTime()) ? d.toISOString() : v;
};

export function ExamForm({
  exam,
  readOnly,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  exam?: Exam | null;
  readOnly?: boolean;
  submitLabel: string;
  onSubmit: (input: ExamInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const [values, setValues] = useState<Values>(() => initialValues(exam));
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = examSchema.safeParse({
      title: values.title,
      instructions: values.instructions,
      startAt: toIso(values.startAt),
      endAt: toIso(values.endAt),
      durationMin: num(values.durationMin),
      totalMarks: num(values.totalMarks),
      passMarks: num(values.passMarks),
      shuffleQuestions: values.shuffleQuestions,
      shuffleOptions: values.shuffleOptions,
    });
    if (!parsed.success) {
      setFields(zodFields(parsed.error));
      return;
    }
    setFields({});
    setBusy(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.fields) setFields(apiErr.fields);
      toast(apiErr.fields ? "Please fix the highlighted fields." : errorMessage(apiErr), "danger");
    } finally {
      setBusy(false);
    }
  }

  const windowMin =
    values.startAt && values.endAt ? Math.round((Date.parse(values.endAt) - Date.parse(values.startAt)) / 60000) : NaN;

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={readOnly || busy} className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-7">
          <h2 className="meta-label">Basics</h2>
          <Field label="Exam title" htmlFor="ex-title" error={fields.title}>
            <Input
              id="ex-title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Database Systems - Midterm"
              maxLength={120}
              invalid={Boolean(fields.title)}
            />
          </Field>
          <Field
            label="Instructions for candidates"
            htmlFor="ex-instructions"
            optional
            hint={`${values.instructions.length} / 5000 characters. Shown before the candidate starts.`}
            error={fields.instructions}
          >
            <Textarea
              id="ex-instructions"
              value={values.instructions}
              onChange={(e) => set("instructions", e.target.value)}
              placeholder="Answer all questions. Calculators are not allowed."
              maxLength={5000}
              invalid={Boolean(fields.instructions)}
            />
          </Field>
        </Card>

        <Card className="space-y-5 p-5 sm:p-7">
          <h2 className="meta-label">Schedule</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Opens at" htmlFor="ex-start" error={fields.startAt}>
              <Input
                id="ex-start"
                type="datetime-local"
                value={values.startAt}
                onChange={(e) => set("startAt", e.target.value)}
                invalid={Boolean(fields.startAt)}
              />
            </Field>
            <Field label="Closes at" htmlFor="ex-end" error={fields.endAt}>
              <Input
                id="ex-end"
                type="datetime-local"
                value={values.endAt}
                onChange={(e) => set("endAt", e.target.value)}
                invalid={Boolean(fields.endAt)}
              />
            </Field>
            <Field
              label="Duration (minutes)"
              htmlFor="ex-duration"
              hint={Number.isFinite(windowMin) && windowMin > 0 ? `The window is ${windowMin} minutes long.` : "1 to 600 minutes."}
              error={fields.durationMin}
            >
              <Input
                id="ex-duration"
                type="number"
                min={1}
                max={600}
                step={1}
                inputMode="numeric"
                value={values.durationMin}
                onChange={(e) => set("durationMin", e.target.value)}
                invalid={Boolean(fields.durationMin)}
              />
            </Field>
          </div>
          <p className="text-xs text-mute">
            Candidates can start any time inside the window. Each attempt lasts the duration, but never past the closing time.
          </p>
        </Card>

        <Card className="space-y-5 p-5 sm:p-7">
          <h2 className="meta-label">Marks &amp; paper</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Total marks" htmlFor="ex-total" hint="Must equal the marks of each candidate's paper." error={fields.totalMarks}>
              <Input
                id="ex-total"
                type="number"
                min={0}
                step="0.5"
                inputMode="decimal"
                value={values.totalMarks}
                onChange={(e) => set("totalMarks", e.target.value)}
                invalid={Boolean(fields.totalMarks)}
              />
            </Field>
            <Field label="Pass marks" htmlFor="ex-pass" error={fields.passMarks}>
              <Input
                id="ex-pass"
                type="number"
                min={0}
                step="0.5"
                inputMode="decimal"
                value={values.passMarks}
                onChange={(e) => set("passMarks", e.target.value)}
                invalid={Boolean(fields.passMarks)}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            <Checkbox
              label="Shuffle question order for each candidate"
              checked={values.shuffleQuestions}
              onChange={(e) => set("shuffleQuestions", e.target.checked)}
            />
            <Checkbox
              label="Shuffle answer options"
              checked={values.shuffleOptions}
              onChange={(e) => set("shuffleOptions", e.target.checked)}
            />
          </div>
        </Card>
      </fieldset>

      {!readOnly && (
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
