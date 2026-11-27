"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUp, Library, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/frontend/components/shell/PageHeader";
import {
  Badge,
  Button,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Select,
  Skeleton,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@/frontend/components/ui";
import { ImportModal } from "@/frontend/components/ImportModal";
import { DIFF_TONE, QuestionEditor, TYPE_LABEL } from "@/frontend/components/exam/QuestionEditor";
import { apiDelete, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { useApi } from "@/frontend/lib/useApi";
import { useToast } from "@/frontend/lib/toast";
import type { Question, QuestionType, Topic } from "@/shared/types";

export default function QuestionBankPage() {
  const { toast } = useToast();
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  // Debounce the search box so we don't call the API on every key press.
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

  const topicsApi = useApi<Topic[]>("/api/topics");
  const questionsApi = useApi<Question[]>(`/api/questions${qs ? `?${qs}` : ""}`);
  const topics = useMemo(() => topicsApi.data ?? [], [topicsApi.data]);
  const questions = questionsApi.data ?? [];

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const filtered = Boolean(qs);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiDelete(`/api/questions/${deleting.id}`);
      questionsApi.setData((all) => (all ?? []).filter((x) => x.id !== deleting.id));
      topicsApi.reload();
      toast("Question deleted.");
    } catch (err) {
      const e = toApiError(err);
      toast(e.status === 409 ? "Used in an exam — it can't be deleted. Remove it from the exam first." : errorMessage(e), "danger");
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Examiner / question bank"
        title="Every question, in its place."
        description="Build a reusable bank by topic and difficulty. Exams draw from it; changing a question never alters papers already started."
        action={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <FileUp className="size-4" /> Import CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="size-4" /> New question
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:items-end">
        <Field label="Search" htmlFor="qb-search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <Input
              id="qb-search"
              placeholder="Search question text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Field>
        <Field label="Topic" htmlFor="qb-topic">
          <Select id="qb-topic" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.questionCount})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Difficulty" htmlFor="qb-diff">
          <Select id="qb-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </Field>
        <Field label="Type" htmlFor="qb-type">
          <Select id="qb-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-6">
        {questionsApi.loading && !questionsApi.data ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading questions">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : questionsApi.error && !questionsApi.data ? (
          <ErrorState onRetry={questionsApi.reload} description={errorMessage(questionsApi.error)} />
        ) : questions.length === 0 ? (
          filtered ? (
            <EmptyState title="No matching questions" description="Try a different topic, difficulty, type or search." />
          ) : (
            <EmptyState
              icon={<Library className="size-5" strokeWidth={1.6} />}
              title="Your bank is empty"
              description="Add your first question, or import many at once from a CSV file."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setEditorOpen(true);
                  }}
                >
                  <Plus className="size-4" /> New question
                </Button>
              }
            />
          )
        ) : (
          <>
            <p className="mb-3 text-[0.8125rem] text-mute" aria-live="polite">
              {questions.length} question{questions.length === 1 ? "" : "s"}
              {questionsApi.loading ? " · updating…" : ""}
            </p>
            <Table>
              <THead>
                <tr>
                  <Th className="w-[46%]">Question</Th>
                  <Th>Topic</Th>
                  <Th>Type</Th>
                  <Th>Difficulty</Th>
                  <Th className="text-right">Marks</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <tbody>
                {questions.map((question) => (
                  <Tr key={question.id}>
                    <Td>
                      <p className="line-clamp-2 text-ink">{question.stem}</p>
                      {question.type !== "written" && (
                        <p className="mt-1 text-xs text-mute">
                          {question.options.length} options · {question.options.filter((o) => o.isCorrect).length} correct
                          {question.negativeMarks > 0 ? ` · −${question.negativeMarks} if wrong` : ""}
                        </p>
                      )}
                    </Td>
                    <Td className="text-mute">{question.topicName}</Td>
                    <Td className="whitespace-nowrap">{TYPE_LABEL[question.type]}</Td>
                    <Td>
                      <Badge tone={DIFF_TONE[question.difficulty]}>{question.difficulty}</Badge>
                    </Td>
                    <Td className="num text-right">{question.marks}</Td>
                    <Td className="whitespace-nowrap text-right">
                      <IconButton
                        label="Edit question"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(question);
                          setEditorOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label="Delete question" size="icon-sm" onClick={() => setDeleting(question)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </div>

      {editorOpen && (
        <QuestionEditor
          key={editing?.id ?? "new"}
          open
          question={editing}
          topics={topics}
          onClose={() => setEditorOpen(false)}
          onTopicCreated={(t) => topicsApi.setData((all) => [...(all ?? []), t])}
          onSaved={() => {
            setEditorOpen(false);
            questionsApi.reload();
            topicsApi.reload();
          }}
        />
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        eyebrow="Question bank"
        title="Delete this question?"
        description={deleting ? `“${deleting.stem.slice(0, 120)}${deleting.stem.length > 120 ? "…" : ""}” will be removed from your bank.` : ""}
        warning="This cannot be undone"
        warningDetail="Questions used in any exam can't be deleted."
        confirmLabel="Delete question"
        onConfirm={() => void confirmDelete()}
        busy={deleteBusy}
      />

      <ImportModal
        kind="questions"
        open={importOpen}
        onClose={() => setImportOpen(false)}
        doneLabel="View question bank"
        onImported={() => {
          questionsApi.reload();
          topicsApi.reload();
        }}
      />
    </>
  );
}
