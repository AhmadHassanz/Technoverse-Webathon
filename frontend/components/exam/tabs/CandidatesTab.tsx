"use client";

import { useEffect, useState } from "react";
import { FileUp, Loader2, Search, UserPlus, Users } from "lucide-react";
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
  StatusBadge,
  Table,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
} from "@/frontend/components/ui";
import { ImportModal } from "@/frontend/components/ImportModal";
import { apiDelete, apiGet, apiPost, errorMessage, toApiError } from "@/frontend/lib/api-client";
import { fmtDate } from "@/frontend/lib/format";
import { useApi } from "@/frontend/lib/useApi";
import { useToast } from "@/frontend/lib/toast";
import { enrollSchema } from "@/shared/validation";
import type { Enrollment, EnrollResult, ExamDetail, User } from "@/shared/types";

export function CandidatesTab({ exam, onCountChanged }: { exam: ExamDetail; onCountChanged: (n: number) => void }) {
  const { toast } = useToast();
  const enrollments = useApi<Enrollment[]>(`/api/exams/${exam.id}/enrollments`);
  const rows = enrollments.data ?? [];
  const closed = exam.state === "completed";

  const [emails, setEmails] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [result, setResult] = useState<EnrollResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<User[] | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [removing, setRemoving] = useState<Enrollment | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  // Live candidate search (debounced).
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    let alive = true;
    const t = window.setTimeout(() => {
      apiGet<User[]>(`/api/candidates?q=${encodeURIComponent(term)}`).then(
        (u) => alive && setMatches(u),
        () => alive && setMatches([]),
      );
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [search]);

  async function enroll(list: string[]) {
    const parsed = enrollSchema.safeParse({ emails: list });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0].message + (parsed.error.issues[0].path.length > 1 ? ` (${list[Number(parsed.error.issues[0].path[1])]})` : ""));
      return false;
    }
    setEmailError(null);
    setBusy(true);
    try {
      const r = await apiPost<EnrollResult>(`/api/exams/${exam.id}/enrollments`, parsed.data);
      setResult(r);
      enrollments.reload();
      if (r.enrolled > 0) onCountChanged(rows.length + r.enrolled);
      toast(r.enrolled ? `${r.enrolled} candidate${r.enrolled === 1 ? "" : "s"} enrolled.` : "No new candidates enrolled.", r.enrolled ? "success" : "info");
      return true;
    } catch (err) {
      const e = toApiError(err);
      setEmailError(e.fields?.emails ?? errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await apiDelete(`/api/exams/${exam.id}/enrollments/${removing.candidateId}`);
      enrollments.setData((all) => (all ?? []).filter((r) => r.candidateId !== removing.candidateId));
      onCountChanged(rows.length - 1);
      toast(`${removing.fullName} was removed.`);
    } catch (err) {
      const e = toApiError(err);
      toast(e.status === 409 ? "This candidate already has an attempt, so they can't be removed." : errorMessage(e), "danger");
    } finally {
      setRemoveBusy(false);
      setRemoving(null);
    }
  }

  const enrolledIds = new Set(rows.map((r) => r.candidateId));

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="display display-sm">Add candidates</h2>
          {closed ? (
            <p className="mt-3 text-sm text-mute">This exam has ended, so no new candidates can be enrolled.</p>
          ) : (
            <form
              className="mt-4 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const list = emails
                  .split(/[\s,;]+/)
                  .map((x) => x.trim())
                  .filter(Boolean);
                if (await enroll(list)) setEmails("");
              }}
            >
              <Field label="Emails" htmlFor="enroll-emails" hint="Separate with commas or new lines." error={emailError}>
                <Textarea
                  id="enroll-emails"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder={"ali@demo.com\nsara@demo.com"}
                  className="min-h-24"
                  invalid={Boolean(emailError)}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy || !emails.trim()}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  Enroll
                </Button>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  <FileUp className="size-4" /> Import CSV
                </Button>
              </div>
            </form>
          )}
          {result && (
            <div className="mt-5 rounded-md border border-line bg-paper px-4 py-3 text-[0.8125rem]" role="status">
              <p className="text-success">{result.enrolled} enrolled</p>
              <p className="text-mute">{result.alreadyEnrolled} were already enrolled</p>
              {result.notFound.length > 0 && (
                <p className="mt-1 text-danger">
                  Not found or not a candidate: <span className="break-all">{result.notFound.join(", ")}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        {!closed && (
          <Card className="p-5 sm:p-6">
            <h2 className="display display-sm">Find a candidate</h2>
            <Field label="Search by name or email" htmlFor="cand-search" className="mt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
                <Input id="cand-search" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type at least 2 letters" />
              </div>
            </Field>
            {search.trim().length >= 2 && matches && (
              <ul className="mt-3 max-h-64 overflow-y-auto scrollbar-thin">
                {matches.length === 0 && <li className="py-3 text-sm text-mute">No candidates found.</li>}
                {matches.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 border-b border-line-soft py-2.5 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{u.fullName}</p>
                      <p className="truncate text-xs text-mute">{u.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || enrolledIds.has(u.id)}
                      onClick={() => void enroll([u.email])}
                    >
                      {enrolledIds.has(u.id) ? "Enrolled" : "Enroll"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="display display-sm">Enrolled · {rows.length}</h2>
        </div>
        {enrollments.loading && !enrollments.data ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : enrollments.error && !enrollments.data ? (
          <ErrorState onRetry={enrollments.reload} description={errorMessage(enrollments.error)} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="size-5" strokeWidth={1.6} />}
            title="No candidates yet"
            description="Enroll candidates by email, search, or import a CSV. They see the exam once it is published."
          />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Enrolled</Th>
                <Th>Attempt</Th>
                <Th className="text-right">Score</Th>
                <Th className="text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </THead>
            <tbody>
              {rows.map((r) => (
                <Tr key={r.candidateId}>
                  <Td className="font-medium text-ink">{r.fullName}</Td>
                  <Td className="text-mute">{r.email}</Td>
                  <Td className="num text-[0.8125rem] text-mute">{fmtDate(r.enrolledAt)}</Td>
                  <Td>
                    <StatusBadge status={r.attemptStatus} />
                  </Td>
                  <Td className="num text-right">{r.score ?? "—"}</Td>
                  <Td className="text-right">
                    {r.attemptStatus === "not_started" && !closed ? (
                      <button type="button" onClick={() => setRemoving(r)} className="text-[0.8125rem] text-danger hover:underline">
                        Remove
                      </button>
                    ) : (
                      <span className="text-xs text-mute">—</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <ImportModal
        kind="candidates"
        examId={exam.id}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => enrollments.reload()}
      />
      <ConfirmModal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        eyebrow="Enrollment"
        title={`Remove ${removing?.fullName ?? "this candidate"}?`}
        description="They will no longer see this exam. Their account is not affected."
        confirmLabel="Remove candidate"
        onConfirm={() => void confirmRemove()}
        busy={removeBusy}
      />
    </div>
  );
}
