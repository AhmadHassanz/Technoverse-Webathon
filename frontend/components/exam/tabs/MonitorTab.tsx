"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Megaphone, Radio } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageSkeleton,
  ProgressBar,
  StatTile,
  StatusBadge,
  Table,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
} from "@/frontend/components/ui";
import { apiGet, apiPatch, apiPost, errorMessage, toApiError, type ApiClientError } from "@/frontend/lib/api-client";
import { countdownLabel, fmtTime, gapLabel } from "@/frontend/lib/format";
import { useNow } from "@/frontend/lib/useNow";
import { useToast } from "@/frontend/lib/toast";
import { announcementSchema } from "@/shared/validation";
import type { Announcement, CompensationRequest, ExamDetail, Incident, IncidentType, MonitorView } from "@/shared/types";

const INCIDENT_LABEL: Record<IncidentType, string> = {
  tab_hidden: "Tab hidden",
  window_blur: "Window lost focus",
  fullscreen_exit: "Left full screen",
  copy_paste: "Copy / paste",
  offline: "Connection gap",
  resumed: "Resumed on another device",
  late_sync: "Answers synced after time",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Live monitor: polls every 5 s, pauses while this browser tab is hidden. */
export function MonitorTab({ exam }: { exam: ExamDetail }) {
  const { toast } = useToast();
  const [data, setData] = useState<MonitorView | null>(null);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [message, setMessage] = useState("");
  const [msgError, setMsgError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const now = useNow(1000);

  const load = useCallback(async () => {
    try {
      const v = await apiGet<MonitorView>(`/api/exams/${exam.id}/monitor`);
      setData(v);
      setError(null);
      setUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(toApiError(err));
    }
  }, [exam.id]);

  useEffect(() => {
    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      if (document.visibilityState === "visible") await load();
      if (!stopped) timer.current = window.setTimeout(loop, 5000);
    };
    void loop();
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stopped = true;
      if (timer.current) window.clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  useEffect(() => {
    if (exam.state === "draft") return;
    let alive = true;
    apiGet<Announcement[]>(`/api/exams/${exam.id}/announcements`).then(
      (a) => alive && setAnnouncements(a),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [exam.id, exam.state]);

  async function review(inc: Incident, reviewed: boolean) {
    setBusyId(inc.id);
    try {
      const note = notes[inc.id];
      const updated = await apiPatch<Incident>(`/api/incidents/${inc.id}`, note !== undefined ? { reviewed, reviewerNote: note } : { reviewed });
      setData((d) => (d ? { ...d, incidents: d.incidents.map((x) => (x.id === updated.id ? updated : x)) } : d));
      setNoteOpen(null);
    } catch (err) {
      const e = toApiError(err);
      toast(e.fields ? Object.values(e.fields)[0] : errorMessage(e), "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function decide(c: CompensationRequest, decision: "approved" | "rejected") {
    setBusyId(c.id);
    try {
      const updated = await apiPatch<CompensationRequest>(`/api/compensations/${c.id}`, { decision });
      setData((d) => (d ? { ...d, compensations: d.compensations.map((x) => (x.id === updated.id ? updated : x)) } : d));
      toast(decision === "approved" ? `${c.candidateName} gets ${gapLabel(c.gapSec)} extra.` : "Request rejected.");
      void load();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function announce(e: React.FormEvent) {
    e.preventDefault();
    const parsed = announcementSchema.safeParse({ message });
    if (!parsed.success) {
      setMsgError(parsed.error.issues[0].message);
      return;
    }
    setMsgError(null);
    setSending(true);
    try {
      const a = await apiPost<Announcement>(`/api/exams/${exam.id}/announcements`, parsed.data);
      setAnnouncements((all) => [...all, a]);
      setMessage("");
      toast("Announcement sent. Candidates see it within 15 seconds.");
    } catch (err) {
      const apiErr = toApiError(err);
      setMsgError(apiErr.fields?.message ?? errorMessage(apiErr));
    } finally {
      setSending(false);
    }
  }

  if (!data && error) return <ErrorState onRetry={() => void load()} description={errorMessage(error)} />;
  if (!data) return <PageSkeleton />;

  const unreviewed = data.incidents.filter((i) => !i.reviewed).length;
  const offlineCount = data.attempts.filter((a) => a.status === "in_progress" && !a.online).length;
  const pending = data.compensations.filter((c) => c.status === "pending");
  const decided = data.compensations.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 text-xs text-mute" aria-live="polite">
        <Radio className="size-3.5 text-success" aria-hidden /> Live, refreshes every 5 seconds{updatedAt ? `, updated ${fmtTime(updatedAt)}` : ""}
        {error && <span className="text-danger">, connection problem, retrying</span>}
      </p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Active attempts" value={pad2(data.summary.inProgress)} note={`of ${data.summary.enrolled} enrolled, ${data.summary.notStarted} not started`} />
        <StatTile label="Submitted" value={pad2(data.summary.submitted)} note="Finished attempts" />
        <StatTile label="Offline" value={pad2(offlineCount)} note="In progress, no heartbeat for 45 s" />
        <StatTile label="Unreviewed indicators" value={pad2(unreviewed)} note="Review context before acting" />
      </div>

      {data.attempts.length === 0 ? (
        <EmptyState title="No attempts yet" description={exam.state === "ongoing" ? "Candidates appear here as soon as they start." : "Nobody has started this exam."} />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Candidate</Th>
              <Th>Answered</Th>
              <Th>Time left</Th>
              <Th>Connection</Th>
              <Th>Indicators</Th>
              <Th>Status</Th>
            </tr>
          </THead>
          <tbody>
            {data.attempts.map((a) => {
              const live = a.status === "in_progress";
              return (
                <Tr key={a.attemptId}>
                  <Td>
                    <p className="font-medium text-ink">{a.fullName}</p>
                    <p className="text-xs text-mute">{a.email}</p>
                  </Td>
                  <Td className="w-44">
                    <p className="num text-[0.8125rem]">
                      {pad2(a.answeredCount)} / {pad2(a.questionCount)}
                    </p>
                    <ProgressBar className="mt-1.5" value={a.answeredCount} total={a.questionCount} label={`${a.fullName} progress`} />
                  </Td>
                  <Td className="num">{live ? countdownLabel(Date.parse(a.endsAt) - now) : "—"}</Td>
                  <Td>
                    {live ? (
                      <span className="inline-flex items-center gap-2 text-[0.8125rem]">
                        <span className={a.online ? "size-2 rounded-full bg-success" : "size-2 rounded-full border border-danger"} aria-hidden />
                        {a.online ? "Online" : "Offline"}
                      </span>
                    ) : (
                      <span className="text-xs text-mute">—</span>
                    )}
                  </Td>
                  <Td className="num">{a.incidentCount}</Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr_1fr]">
        <Card className="p-5">
          <h3 className="display text-[1.35rem]">Indicators — review before acting</h3>
          <p className="mt-1 text-xs text-mute">Indicators are not proof of misconduct. They never change scores.</p>
          {data.incidents.length === 0 ? (
            <p className="mt-5 text-sm text-mute">No indicators so far.</p>
          ) : (
            <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {data.incidents.map((inc) => (
                <li key={inc.id} className="rounded-md border border-line-soft px-3.5 py-3">
                  <p className="text-[0.8125rem] text-ink">
                    <span className="font-medium">{inc.candidateName}</span>, {INCIDENT_LABEL[inc.type]}, <span className="num">{fmtTime(inc.createdAt)}</span>
                  </p>
                  {inc.detail && <p className="mt-0.5 text-xs text-mute">{inc.detail}</p>}
                  {inc.reviewerNote && <p className="mt-1 text-xs text-ink">Note: {inc.reviewerNote}</p>}
                  {noteOpen === inc.id && (
                    <div className="mt-2">
                      <label htmlFor={`note-${inc.id}`} className="sr-only">
                        Note
                      </label>
                      <Textarea
                        id={`note-${inc.id}`}
                        className="min-h-16 text-sm"
                        maxLength={500}
                        value={notes[inc.id] ?? inc.reviewerNote ?? ""}
                        onChange={(e) => setNotes({ ...notes, [inc.id]: e.target.value })}
                        placeholder="e.g. Follow up after reconnection"
                      />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    {inc.reviewed ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        <Check className="size-3.5" /> Reviewed
                      </span>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyId === inc.id}
                      onClick={() => void review(inc, !inc.reviewed || noteOpen === inc.id)}
                      className="font-medium text-cobalt hover:underline disabled:opacity-50"
                    >
                      {noteOpen === inc.id ? "Save note" : inc.reviewed ? "Mark unreviewed" : "Mark reviewed"}
                    </button>
                    {noteOpen !== inc.id && (
                      <button type="button" onClick={() => setNoteOpen(inc.id)} className="font-medium text-cobalt hover:underline">
                        {inc.reviewerNote ? "Edit note" : "+ Add note"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="display text-[1.35rem]">Time compensation</h3>
          <p className="mt-1 text-xs text-mute">Measured by the server from missed heartbeats. Approving adds the gap (max 10 min in total).</p>
          {data.compensations.length === 0 ? (
            <p className="mt-5 text-sm text-mute">No requests.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pending.map((c) => (
                <li key={c.id} className="rounded-md border border-line-soft px-3.5 py-3">
                  <p className="text-[0.8125rem] text-ink">
                    {c.candidateName}, {gapLabel(c.gapSec)} gap
                  </p>
                  <p className="text-xs text-mute">Requested: +{gapLabel(c.gapSec)}, {fmtTime(c.createdAt)}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" disabled={busyId === c.id} onClick={() => void decide(c, "approved")}>
                      {busyId === c.id && <Loader2 className="size-3.5 animate-spin" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busyId === c.id} onClick={() => void decide(c, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
              {decided.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 text-[0.8125rem]">
                  <span>
                    {c.candidateName}, {gapLabel(c.gapSec)}
                  </span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="display text-[1.35rem]">Send an announcement</h3>
          {exam.state === "draft" ? (
            <p className="mt-3 text-sm text-mute">Publish the exam first.</p>
          ) : (
            <form onSubmit={announce} className="mt-3 space-y-3">
              <label htmlFor="announce" className="sr-only">
                Message to all candidates
              </label>
              <Textarea
                id="announce"
                className="min-h-20"
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a message to all candidates…"
                invalid={Boolean(msgError)}
              />
              {msgError && <p role="alert" className="text-xs text-danger">{msgError}</p>}
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                Send announcement
              </Button>
            </form>
          )}
          {announcements.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-line pt-3">
              {[...announcements].reverse().slice(0, 5).map((a) => (
                <li key={a.id} className="text-xs text-ink">
                  <span className="num text-mute">{fmtTime(a.createdAt)}</span>, {a.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
