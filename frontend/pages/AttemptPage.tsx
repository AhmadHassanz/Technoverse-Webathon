"use client";

// The exam workspace (FRONTEND_PLAN section 7). Rules it never breaks:
// - every answer goes to the local outbox first, so refresh / offline never loses work;
// - the countdown uses the SERVER clock (endsAt + serverNow offset), refreshed by every response;
// - the status pill always tells the truth about what is saved.

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Flag, NotebookPen, Settings2, WifiOff, RefreshCw } from "lucide-react";
import { Button, Drawer, EmptyState, ErrorState, Skeleton } from "@/frontend/components/ui";
import { buttonStyles } from "@/frontend/components/ui/button";
import { TimerPill } from "@/frontend/components/exam/TimerPill";
import { SaveStatusPill, type SaveState } from "@/frontend/components/exam/SaveStatusPill";
import { Navigator, type QState } from "@/frontend/components/exam/Navigator";
import { QuestionView, type LocalAnswer } from "@/frontend/components/exam/QuestionView";
import { SubmitDialog } from "@/frontend/components/exam/SubmitDialog";
import { SubmittedScreen } from "@/frontend/components/exam/SubmittedScreen";
import { SandboxBar } from "@/frontend/components/exam/SandboxBar";
import { AnnouncementBanner } from "@/frontend/components/exam/AnnouncementBanner";
import { Scratchpad } from "@/frontend/components/exam/Scratchpad";
import { SettingsPopover } from "@/frontend/components/exam/SettingsPopover";
import { apiDelete, apiGet, apiPost, errorMessage, toApiError, type ApiClientError } from "@/frontend/lib/api-client";
import { DEFAULT_PREFS, useAuth } from "@/frontend/lib/auth";
import { useToast } from "@/frontend/lib/toast";
import { useNow } from "@/frontend/lib/useNow";
import { clearAttemptStorage, readOutbox, useOutbox, type OutboxEntry, type ServerClock } from "@/frontend/lib/useOutbox";
import { useHeartbeat } from "@/frontend/lib/useHeartbeat";
import { useIncidents } from "@/frontend/lib/useIncidents";
import { cn } from "@/frontend/lib/utils";
import type {
  Announcement,
  AttemptQuestion,
  AttemptStatus,
  AttemptView,
  HeartbeatResult,
  Preferences,
  StartAttemptResult,
  SubmitResult,
} from "@/shared/types";

const EMPTY: LocalAnswer = { selectedOptionIds: [], textAnswer: "", flagged: false };

function isAnswered(q: AttemptQuestion, a: LocalAnswer | undefined) {
  if (!a) return false;
  return q.type === "written" ? a.textAnswer.trim().length > 0 : a.selectedOptionIds.length > 0;
}

function toLocal(merged: Record<string, OutboxEntry>): Record<string, LocalAnswer> {
  const out: Record<string, LocalAnswer> = {};
  for (const [k, v] of Object.entries(merged)) out[k] = { selectedOptionIds: v.selectedOptionIds, textAnswer: v.textAnswer, flagged: v.flagged };
  return out;
}

type Finished = { status: AttemptStatus | null; submittedAt: string | null; timeUpOffline?: boolean };

function Workspace({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { me, updatePreferences } = useAuth();

  const [view, setView] = useState<AttemptView | null>(null);
  const [loadError, setLoadError] = useState<ApiClientError | null>(null);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [clock, setClock] = useState<{ endsAt: string; offset: number } | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [current, setCurrent] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [scratchOpen, setScratchOpen] = useState(false);
  const [settingsAt, setSettingsAt] = useState<"desktop" | "mobile" | null>(null);
  const settingsOpen = settingsAt !== null;
  const [hbDown, setHbDown] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const finishing = useRef(false);

  const onClock = useCallback((c: ServerClock) => {
    setClock({ endsAt: c.endsAt, offset: Date.parse(c.serverNow) - Date.now() });
  }, []);

  /** The server says the attempt is over (410, status change, time up): fetch submittedAt and show the submitted screen. */
  const finish = useCallback(
    async (known?: AttemptStatus) => {
      if (finishing.current) return;
      finishing.current = true;
      try {
        const r = await apiPost<SubmitResult>(`/api/attempts/${attemptId}/submit`, {});
        setFinished({ status: r.status, submittedAt: r.submittedAt });
      } catch {
        setFinished({ status: known ?? null, submittedAt: null });
      }
      clearAttemptStorage(attemptId);
    },
    [attemptId],
  );

  const outbox = useOutbox(attemptId, {
    onClock,
    onEnded: (s) => void finish(s),
    onLate: () => toast("Some answers arrived after time ended and were not counted.", "danger"),
    onInvalid: () => toast("One answer could not be saved. Please choose it again.", "danger"),
  });
  const { init, flush, queue, nextSeq } = outbox;

  // ---- load the attempt once ----
  useEffect(() => {
    let alive = true;
    apiGet<AttemptView>(`/api/attempts/${attemptId}`).then(
      (v) => {
        if (!alive) return;
        setView(v);
        setAnnouncements(v.announcements);
        setClock({ endsAt: v.endsAt, offset: Date.parse(v.serverNow) - Date.now() });
        if (v.status !== "in_progress") {
          void finish(v.status);
          return;
        }
        setAnswers(toLocal(init(v.answers)));
        void flush();
      },
      (err) => alive && setLoadError(toApiError(err)),
    );
    return () => {
      alive = false;
    };
  }, [attemptId, init, flush, finish]);

  const active = Boolean(view && view.status === "in_progress" && !finished);

  // ---- heartbeat (worker timer, see useHeartbeat) ----
  const beat = useCallback(async () => {
    try {
      const r = await apiPost<HeartbeatResult>(`/api/attempts/${attemptId}/heartbeat`, {});
      setHbDown(false);
      onClock(r);
      setAnnouncements((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        const fresh = r.announcements.filter((a) => !ids.has(a.id));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
      if (r.status !== "in_progress") void finish(r.status);
      else void flush();
    } catch (err) {
      const e = toApiError(err);
      if (e.status === 0) setHbDown(true);
      else if (e.status === 410) void finish();
    }
  }, [attemptId, onClock, finish, flush]);
  useHeartbeat(active, () => void beat());
  useIncidents(attemptId, active && !view?.isSandbox);

  // ---- timer ----
  const now = useNow(500);
  const remaining = clock ? Date.parse(clock.endsAt) - (now + clock.offset) : Number.POSITIVE_INFINITY;
  const timeUp = active && remaining <= 0;

  useEffect(() => {
    if (!timeUp || finishing.current) return;
    finishing.current = true;
    (async () => {
      await flush();
      try {
        const r = await apiPost<SubmitResult>(`/api/attempts/${attemptId}/submit`, {});
        setFinished({ status: r.status, submittedAt: r.submittedAt });
      } catch (err) {
        setFinished({ status: null, submittedAt: null, timeUpOffline: toApiError(err).status === 0 });
      }
      clearAttemptStorage(attemptId);
    })();
  }, [timeUp, flush, attemptId]);

  // ---- save status ----
  const offline = outbox.offline || hbDown;
  const [wasOffline, setWasOffline] = useState(false);
  if (offline && !wasOffline) setWasOffline(true);
  if (!offline && wasOffline && outbox.count === 0 && !outbox.syncing) setWasOffline(false);
  const reconnecting = !offline && wasOffline && outbox.count > 0;
  const saveState: SaveState = offline
    ? "offline"
    : reconnecting
      ? "reconnecting"
      : outbox.saving || outbox.syncing || outbox.count > 0
        ? "saving"
        : "saved";

  // ---- preferences ----
  const prefs: Preferences = me?.preferences ?? view?.preferences ?? DEFAULT_PREFS;
  const changePrefs = (patch: Partial<Preferences>) =>
    updatePreferences(patch).catch(() => toast("Settings applied here but not saved to your account.", "info"));

  const questions = view?.questions ?? [];
  const states: Record<string, QState> = {};
  for (const q of questions) states[q.aqId] = { answered: isAnswered(q, answers[q.aqId]), flagged: Boolean(answers[q.aqId]?.flagged) };
  const answeredCount = questions.filter((q) => states[q.aqId].answered).length;

  function change(q: AttemptQuestion, patch: Partial<LocalAnswer>) {
    if (!active) return;
    const next = { ...(answers[q.aqId] ?? EMPTY), ...patch };
    setAnswers((a) => ({ ...a, [q.aqId]: next }));
    queue({ aqId: q.aqId, ...next, clientSeq: nextSeq() }, patch.textAnswer !== undefined);
  }

  function jump(i: number) {
    const target = Math.max(0, Math.min(questions.length - 1, i));
    setCurrent(target);
    setNavOpen(false);
    if (prefs.layout === "scroll") document.getElementById(`qcard-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitNow() {
    setSubmitting(true);
    await flush();
    const left = Object.keys(readOutbox(attemptId)).length;
    if (left > 0) {
      toast(`You are offline. ${left} answer${left === 1 ? " is" : "s are"} only on this device — reconnect, then submit.`, "danger");
      setSubmitting(false);
      return;
    }
    try {
      finishing.current = true;
      const r = await apiPost<SubmitResult>(`/api/attempts/${attemptId}/submit`, {});
      clearAttemptStorage(attemptId);
      setFinished({ status: r.status, submittedAt: r.submittedAt });
      setSubmitOpen(false);
      router.replace(`/attempt/${attemptId}`); // Back must not reopen the exam
    } catch (err) {
      finishing.current = false;
      toast(errorMessage(err), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPreview() {
    if (!view) return;
    setResetBusy(true);
    try {
      await apiDelete(`/api/attempts/${attemptId}`);
      clearAttemptStorage(attemptId);
      const r = await apiPost<StartAttemptResult>(`/api/exams/${view.examId}/attempts`, { sandbox: true });
      router.replace(`/attempt/${r.attemptId}`);
    } catch (err) {
      toast(errorMessage(err), "danger");
      setResetBusy(false);
    }
  }

  // ---- keyboard shortcuts: ←/→, 1-6, F, S ----
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandler.current = (e: KeyboardEvent) => {
      if (!active || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (submitOpen || scratchOpen || settingsOpen || navOpen) return;
      const q = questions[current];
      if (!q) return;
      const key = e.key.toLowerCase();
      if (e.key === "ArrowRight") jump(current + 1);
      else if (e.key === "ArrowLeft") jump(current - 1);
      else if (key === "f") change(q, { flagged: !answers[q.aqId]?.flagged });
      else if (key === "s") setScratchOpen(true);
      else if (/^[1-6]$/.test(e.key) && q.type !== "written") {
        const opt = q.options[Number(e.key) - 1];
        if (!opt) return;
        if (q.type === "mcq_single") change(q, { selectedOptionIds: [opt.id] });
        else {
          const sel = answers[q.aqId]?.selectedOptionIds ?? [];
          change(q, { selectedOptionIds: sel.includes(opt.id) ? sel.filter((x) => x !== opt.id) : [...sel, opt.id] });
        }
      } else return;
      e.preventDefault();
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------------- render ----------------
  if (loadError) {
    if (loadError.status === 404) return <Centered><EmptyState title="Attempt not found" description="This exam attempt does not exist." /></Centered>;
    if (loadError.status === 403) return <Centered><EmptyState title="You don't have access" description="This attempt belongs to another account." /></Centered>;
    return (
      <Centered>
        <ErrorState title="We could not open your exam" description={`${errorMessage(loadError)} Your saved answers are safe.`} onRetry={() => window.location.reload()} />
      </Centered>
    );
  }

  if (finished) {
    return (
      <SubmittedScreen
        title={view?.examTitle ?? "Examination"}
        status={finished.status}
        submittedAt={finished.submittedAt}
        questionCount={questions.length}
        attemptId={attemptId}
        sandboxExamId={view?.isSandbox ? view.examId : null}
        timeUpOffline={finished.timeUpOffline}
      />
    );
  }

  if (!view || !clock) {
    return (
      <div className="min-h-screen bg-parchment p-6" aria-busy="true" aria-label="Loading your exam">
        <Skeleton className="h-20" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <Skeleton className="hidden h-96 lg:block" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const q = questions[current];
  const navRight = prefs.navigatorSide === "right";
  const phase = remaining < 60000 ? "1 minute left" : remaining < 300000 ? "5 minutes left" : "";

  const toolButton = "inline-flex h-10 items-center gap-1.5 rounded-md bg-sand px-4 text-[0.875rem] font-medium text-cobalt hover:bg-tint";

  return (
    <div className="min-h-screen bg-parchment pb-44 lg:pb-10">
      <p className="sr-only" aria-live="polite">
        {phase}
      </p>
      {view.isSandbox && (
        <SandboxBar
          busy={resetBusy}
          onReset={() => void resetPreview()}
          onExit={() => router.push(`/examiner/exams/${view.examId}?tab=questions`)}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        {/* desktop */}
        <div className="mx-auto hidden max-w-[1440px] items-center gap-6 px-8 py-3.5 lg:flex">
          <div className="min-w-0 flex-1">
            <p className="display text-[1.5rem] leading-none text-cobalt">ExamCore</p>
            <p className="mt-2 truncate text-[1.125rem] text-ink" title={view.examTitle}>
              {view.examTitle}
            </p>
          </div>
          <TimerPill remainingMs={remaining} />
          <div className="flex flex-col items-start gap-2">
            <SaveStatusPill state={saveState} pending={outbox.count} />
            <div className="relative flex gap-2">
              <button type="button" className={toolButton} onClick={() => setSettingsAt((o) => (o ? null : "desktop"))} aria-expanded={settingsAt === "desktop"}>
                <Settings2 className="size-4" /> Settings
              </button>
              <button type="button" className={toolButton} onClick={() => setScratchOpen(true)}>
                <NotebookPen className="size-4" /> Scratchpad
              </button>
              <SettingsPopover open={settingsAt === "desktop"} onClose={() => setSettingsAt(null)} prefs={prefs} onChange={changePrefs} />
            </div>
          </div>
          <Button className="ml-4" onClick={() => setSubmitOpen(true)}>
            Submit exam
          </Button>
        </div>
        {/* mobile */}
        <div className="px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <TimerPill remainingMs={remaining} compact />
            <Button size="sm" onClick={() => setSubmitOpen(true)}>
              Submit
            </Button>
          </div>
          <p className="mt-2 truncate text-[1rem] text-ink">{view.examTitle}</p>
          <SaveStatusPill className="mt-2" state={saveState} pending={outbox.count} />
        </div>
      </header>

      {offline && (
        <div className="flex items-center gap-2 bg-danger px-4 py-2 text-[0.8125rem] text-on-danger sm:px-8" role="alert">
          <WifiOff className="size-4 shrink-0" aria-hidden />
          {outbox.count > 0
            ? `Offline — ${outbox.count} answer${outbox.count === 1 ? "" : "s"} saved on this device. Keep this tab open; your timer continues.`
            : "Offline — your answers so far are saved. Keep this tab open; your timer continues."}
        </div>
      )}
      {reconnecting && (
        <div className="flex items-center gap-2 bg-cobalt px-4 py-2 text-[0.8125rem] text-on-cobalt sm:px-8" role="status">
          <RefreshCw className="size-4 shrink-0 animate-spin" aria-hidden />
          Reconnected — syncing {outbox.count} answer{outbox.count === 1 ? "" : "s"}… You can continue working.
        </div>
      )}
      <AnnouncementBanner items={announcements} dismissed={dismissed} onDismiss={(id) => setDismissed((s) => new Set(s).add(id))} />

      <div className={cn("mx-auto max-w-[1440px] gap-8 px-4 py-6 sm:px-8 lg:grid", navRight ? "lg:grid-cols-[minmax(0,1fr)_300px]" : "lg:grid-cols-[300px_minmax(0,1fr)]")}>
        <aside className={cn("hidden lg:block", navRight && "lg:order-2")}>
          <div className="sticky top-36">
            <Navigator questions={questions} states={states} current={current} onJump={jump} />
          </div>
        </aside>

        <main className="min-w-0">
          {questions.length === 0 ? (
            <EmptyState title="No questions" description="This paper has no questions." />
          ) : prefs.layout === "scroll" ? (
            <div className="space-y-6">
              {questions.map((item, i) => (
                <div
                  key={item.aqId}
                  id={`qcard-${i}`}
                  className={cn("surface-card scroll-mt-40 p-5 sm:p-9", i === current && "border-cobalt")}
                  onFocusCapture={() => setCurrent(i)}
                >
                  <QuestionView question={item} index={i} total={questions.length} answer={answers[item.aqId] ?? EMPTY} onChange={(p) => change(item, p)} />
                </div>
              ))}
            </div>
          ) : (
            q && (
              <>
                <div className="surface-card p-5 sm:p-9">
                  <QuestionView
                    key={q.aqId}
                    question={q}
                    index={current}
                    total={questions.length}
                    answer={answers[q.aqId] ?? EMPTY}
                    onChange={(p) => change(q, p)}
                  />
                </div>
                <div className="mt-5 hidden items-center justify-between gap-4 lg:flex">
                  <Button variant="secondary" disabled={current === 0} onClick={() => jump(current - 1)}>
                    <ArrowLeft className="size-4" /> Previous
                  </Button>
                  <p className="text-xs text-mute">Changes save as you go</p>
                  {current < questions.length - 1 ? (
                    <Button onClick={() => jump(current + 1)}>
                      Next question <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => setSubmitOpen(true)}>Review &amp; submit</Button>
                  )}
                </div>
              </>
            )
          )}
          <p className="mt-6 hidden text-[0.6875rem] text-mute lg:block">
            Exam session {attemptId.slice(0, 8).toUpperCase()} · Answers are private and securely stored
          </p>
        </main>
      </div>

      {/* mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-parchment px-4 pb-4 pt-2 lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          {q && (
            <button
              type="button"
              aria-pressed={Boolean(answers[q.aqId]?.flagged)}
              onClick={() => change(q, { flagged: !answers[q.aqId]?.flagged })}
              className={cn("inline-flex h-10 items-center justify-center gap-1.5 rounded-md text-[0.875rem]", answers[q.aqId]?.flagged ? "bg-warning-soft text-warning" : "bg-sand text-cobalt")}
            >
              <Flag className="size-4" /> {answers[q.aqId]?.flagged ? "Flagged" : "Flag"}
            </button>
          )}
          <button type="button" className="h-10 rounded-md bg-sand text-[0.875rem] text-cobalt" onClick={() => setScratchOpen(true)}>
            Scratchpad
          </button>
          <button type="button" className="h-10 rounded-md bg-sand text-[0.875rem] text-cobalt" onClick={() => setSettingsAt("mobile")}>
            Settings
          </button>
        </div>
        {prefs.layout === "single" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={current === 0} onClick={() => jump(current - 1)}>
              <ArrowLeft className="size-4" /> Previous
            </Button>
            {current < questions.length - 1 ? (
              <Button onClick={() => jump(current + 1)}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => setSubmitOpen(true)}>Review</Button>
            )}
          </div>
        )}
        <button type="button" onClick={() => setNavOpen(true)} className={cn(buttonStyles({ variant: "secondary" }), "mt-2 w-full")}>
          Questions · {answeredCount} / {questions.length} answered
        </button>
      </div>

      <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="bottom" title="Questions">
        <Navigator questions={questions} states={states} current={current} onJump={jump} />
      </Drawer>
      <div className="lg:hidden">
        <SettingsPopover open={settingsAt === "mobile"} onClose={() => setSettingsAt(null)} prefs={prefs} onChange={changePrefs} />
      </div>
      <Scratchpad attemptId={attemptId} initial={view.scratchpad} open={scratchOpen} onClose={() => setScratchOpen(false)} />
      <SubmitDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        questions={questions}
        states={states}
        onJump={jump}
        onSubmit={() => void submitNow()}
        busy={submitting}
        pending={outbox.count}
      />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-screen max-w-xl items-center px-5">{<div className="w-full">{children}</div>}</div>;
}

function AttemptRoute() {
  const { attemptId } = useParams<{ attemptId: string }>();
  // key: a new attempt id (e.g. after "Reset preview") starts a fresh workspace.
  return <Workspace key={attemptId} attemptId={attemptId} />;
}

export default function AttemptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-parchment" aria-busy="true" />}>
      <AttemptRoute />
    </Suspense>
  );
}
