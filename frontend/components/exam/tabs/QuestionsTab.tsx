"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, CircleAlert, Loader2, Lock } from "lucide-react";
import { Button, Card, Field, Input, ProgressBar, Select, Skeleton } from "@/frontend/components/ui";
import { TYPE_LABEL } from "@/frontend/components/exam/QuestionEditor";
import { apiPut, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { num, zodFields } from "@/frontend/lib/forms";
import { useApi } from "@/frontend/lib/useApi";
import { useToast } from "@/frontend/lib/toast";
import { cn } from "@/frontend/lib/utils";
import { examQuestionsSchema } from "@/shared/validation";
import type { Difficulty, ExamDetail, Question, QuestionType, Topic } from "@/shared/types";

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const pad2 = (n: number) => String(n).padStart(2, "0");
const round2 = (n: number) => Math.round(n * 100) / 100;

export function QuestionsTab({ exam, onChanged }: { exam: ExamDetail; onChanged: (e: ExamDetail) => void }) {
  const { toast } = useToast();
  const editable = exam.state === "draft";

  // ---- the bank (left) ----
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setQ(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);
  const params = new URLSearchParams();
  if (topicId) params.set("topicId", topicId);
  if (difficulty) params.set("difficulty", difficulty);
  if (type) params.set("type", type);
  if (q) params.set("q", q);
  const qs = params.toString();
  const bank = useApi<Question[]>(editable ? `/api/questions${qs ? `?${qs}` : ""}` : null);
  const topics = useApi<Topic[]>(editable ? "/api/topics" : null);

  // ---- the pool + blueprint (right) ----
  const [pool, setPool] = useState<Question[]>(exam.questions);
  const [bpOn, setBpOn] = useState(exam.blueprint !== null);
  const [bp, setBp] = useState({
    easy: String(exam.blueprint?.easy ?? 0),
    medium: String(exam.blueprint?.medium ?? 0),
    hard: String(exam.blueprint?.hard ?? 0),
  });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const inPool = useMemo(() => new Set(pool.map((p) => p.id)), [pool]);

  const meters = DIFFS.map((d) => {
    const qsOfD = pool.filter((p) => p.difficulty === d);
    const needed = num(bp[d]);
    const marks = [...new Set(qsOfD.map((p) => p.marks))];
    return {
      d,
      needed: Number.isFinite(needed) ? needed : 0,
      have: qsOfD.length,
      marks,
      enough: Number.isFinite(needed) && needed >= 0 && needed <= qsOfD.length,
      sameMarks: marks.length <= 1 || needed === 0,
    };
  });

  const paperMarks = bpOn
    ? round2(meters.reduce((sum, m) => sum + m.needed * (m.marks[0] ?? 0), 0))
    : round2(pool.reduce((sum, p) => sum + p.marks, 0));
  const paperCount = bpOn ? meters.reduce((s, m) => s + m.needed, 0) : pool.length;
  const marksOk = paperMarks === exam.totalMarks && meters.every((m) => !bpOn || m.sameMarks);

  const dirty =
    pool.map((p) => p.id).join() !== exam.questions.map((p) => p.id).join() ||
    bpOn !== (exam.blueprint !== null) ||
    (bpOn && DIFFS.some((d) => num(bp[d]) !== (exam.blueprint?.[d] ?? 0)));

  function move(index: number, by: -1 | 1) {
    const next = [...pool];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    setPool(next);
  }

  async function save() {
    const parsed = examQuestionsSchema.safeParse({
      questionIds: pool.map((p) => p.id),
      blueprint: bpOn ? { easy: num(bp.easy), medium: num(bp.medium), hard: num(bp.hard) } : null,
    });
    if (!parsed.success) {
      setFields(zodFields(parsed.error));
      return;
    }
    setFields({});
    setBusy(true);
    try {
      const updated = await apiPut<ExamDetail>(`/api/exams/${exam.id}/questions`, parsed.data);
      onChanged(updated);
      setPool(updated.questions);
      toast("Question pool saved.");
    } catch (err) {
      const e = toApiError(err);
      if (e.fields) setFields(e.fields);
      toast(e.fields ? Object.values(e.fields)[0] : errorMessage(e), "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("grid gap-6", editable && "lg:grid-cols-2")}>
      {editable && (
        <Card className="p-5 sm:p-6">
          <h2 className="display display-sm">Question bank</h2>
          <div className="mt-4 space-y-4">
            <Field label="Search" htmlFor="pool-search">
              <Input id="pool-search" placeholder="Search question text…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Topic" htmlFor="pool-topic">
                <Select id="pool-topic" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  <option value="">All topics</option>
                  {(topics.data ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Difficulty" htmlFor="pool-diff">
                <Select id="pool-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="">All levels</option>
                  {DIFFS.map((d) => (
                    <option key={d} value={d}>
                      {cap(d)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Type" htmlFor="pool-type">
                <Select id="pool-type" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">All types</option>
                  {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
          <div className="mt-4 max-h-[560px] overflow-y-auto border-t border-line scrollbar-thin">
            {bank.loading && !bank.data ? (
              <div className="space-y-2 pt-4">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            ) : bank.error && !bank.data ? (
              <p className="py-6 text-sm text-danger">
                {errorMessage(bank.error)}{" "}
                <button type="button" className="underline" onClick={bank.reload}>
                  Retry
                </button>
              </p>
            ) : (bank.data ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-mute">No questions match. Add some in the Question bank page.</p>
            ) : (
              <ul>
                {(bank.data ?? []).map((item, i) => {
                  const added = inPool.has(item.id);
                  return (
                    <li key={item.id} className="flex items-start gap-3 border-b border-line-soft py-3.5 last:border-b-0">
                      <span className="num w-6 shrink-0 pt-0.5 text-[0.8125rem] text-cobalt">{pad2(i + 1)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[0.9rem] text-ink">{item.stem}</p>
                        <p className="mt-1.5 text-xs text-mute">
                          {cap(item.difficulty)} · {TYPE_LABEL[item.type]} · {item.marks} marks · {item.topicName}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={added ? "quiet" : "secondary"}
                        disabled={added}
                        onClick={() => setPool([...pool, item])}
                        aria-label={added ? "Already in pool" : `Add question ${i + 1} to the pool`}
                      >
                        {added ? (
                          <>
                            <Check className="size-3.5" /> Added
                          </>
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="display display-sm">Selected pool · {pool.length} questions</h2>
              <p className="mt-1 text-xs text-mute">
                {editable ? "Use the arrows to reorder. Remove only affects this exam." : "The pool is locked because the exam is not a draft."}
              </p>
            </div>
            {!editable && <Lock className="size-4 text-mute" aria-label="Locked" />}
          </div>
          {fields.questionIds && <p role="alert" className="mt-3 text-xs text-danger">{fields.questionIds}</p>}
          {pool.length === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-line px-4 py-8 text-center text-sm text-mute">
              No questions yet. Add them from the bank on the left.
            </p>
          ) : (
            <ol className="mt-4 max-h-[420px] overflow-y-auto scrollbar-thin">
              {pool.map((item, i) => (
                <li key={item.id} className="flex items-center gap-2 border-b border-line-soft py-2.5 last:border-b-0">
                  {editable && (
                    <span className="flex flex-col">
                      <button
                        type="button"
                        aria-label={`Move question ${i + 1} up`}
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                        className="rounded p-0.5 text-mute hover:text-cobalt disabled:opacity-25"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move question ${i + 1} down`}
                        disabled={i === pool.length - 1}
                        onClick={() => move(i, 1)}
                        className="rounded p-0.5 text-mute hover:text-cobalt disabled:opacity-25"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </span>
                  )}
                  <span className="num w-6 text-[0.8125rem] text-ink">{pad2(i + 1)}</span>
                  <span className="min-w-0 flex-1 truncate text-[0.9rem] text-ink" title={item.stem}>
                    {item.stem}
                  </span>
                  <span className="hidden text-xs text-mute sm:inline">{cap(item.difficulty)}</span>
                  <span className="num w-16 text-right text-xs text-mute">{item.marks} marks</span>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => setPool(pool.filter((p) => p.id !== item.id))}
                      className="ml-2 text-xs text-danger hover:underline"
                      aria-label={`Remove question ${i + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="display display-sm">Balanced paper blueprint</h2>
              <p className="mt-1 max-w-md text-xs text-mute">
                Each candidate gets a different random paper with the same number of easy, medium and hard questions — fair and harder to copy.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={!editable}
              aria-pressed={bpOn}
              onClick={() => setBpOn(!bpOn)}
            >
              {bpOn ? (
                <>
                  <Check className="size-3.5" /> Enabled
                </>
              ) : (
                "Disabled"
              )}
            </Button>
          </div>

          {bpOn ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {meters.map((m) => {
                const ok = m.enough && m.sameMarks;
                return (
                  <div key={m.d}>
                    <Field label={cap(m.d)} htmlFor={`bp-${m.d}`}>
                      <Input
                        id={`bp-${m.d}`}
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        disabled={!editable}
                        value={bp[m.d]}
                        onChange={(e) => setBp({ ...bp, [m.d]: e.target.value })}
                        invalid={!ok}
                      />
                    </Field>
                    <p className={cn("mt-2 flex items-start gap-1 text-xs", ok ? "text-success" : "text-danger")}>
                      {ok ? <Check className="mt-px size-3.5 shrink-0" /> : <CircleAlert className="mt-px size-3.5 shrink-0" />}
                      <span>
                        {m.needed} needed / {m.have} in pool
                        {!m.sameMarks && ` · marks differ (${m.marks.join(", ")})`}
                      </span>
                    </p>
                    <ProgressBar
                      className="mt-2"
                      value={Math.min(m.needed, m.have)}
                      total={Math.max(m.needed, 1)}
                      tone={ok ? "cobalt" : "danger"}
                      label={`${cap(m.d)} questions available`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 text-sm text-mute">Off: every candidate gets every question in the pool.</p>
          )}
          {fields.blueprint && <p role="alert" className="mt-3 text-xs text-danger">{fields.blueprint}</p>}

          <p className={cn("mt-6 flex items-center gap-2 text-[0.9375rem]", marksOk ? "text-success" : "text-danger")}>
            {marksOk ? <Check className="size-4" /> : <CircleAlert className="size-4" />}
            Paper: {paperCount} questions · <span className="num">{paperMarks} / {exam.totalMarks}</span> total marks
          </p>
          {!marksOk && (
            <p className="mt-1 text-xs text-mute">
              Paper marks must equal the exam&apos;s total marks to publish. You can still save a work-in-progress draft.
            </p>
          )}
        </Card>

        {editable && (
          <div className="flex items-center justify-end gap-3">
            {dirty && <span className="text-xs text-warning">Unsaved changes</span>}
            <Button onClick={() => void save()} disabled={busy || !dirty}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Save pool &amp; blueprint
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
