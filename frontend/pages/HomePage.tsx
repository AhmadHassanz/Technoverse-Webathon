"use client";

// Landing page — Design System 03 "Quiet Signal".
// A charcoal stage with a light serif headline, the real exam workspace straddling the stage
// and the paper below, a facts strip, how it works, a tabbed platform tour, roles, FAQ and a
// closing stage. Every number on this page is a real product rule, not a marketing claim.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  Check,
  FileCheck2,
  Library,
  Menu,
  Plus,
  QrCode,
  ShieldUser,
  Timer,
  UserCog,
  X,
} from "lucide-react";
import { roleHome, useAuth } from "@/frontend/lib/auth";
import { Logo } from "@/frontend/components/shell/AppShell";
import { cn } from "@/frontend/lib/utils";

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Platform", href: "#platform" },
  { label: "Roles", href: "#roles" },
  { label: "FAQ", href: "#faq" },
];

const FACTS = [
  { value: "3", label: "Roles, each with its own workspace" },
  { value: "3", label: "Question types, auto and hand graded" },
  { value: "45 s", label: "Heartbeat window for the live monitor" },
  { value: "600 s", label: "Most time an outage can give back" },
];

const STEPS = [
  { icon: Library, title: "Prepare", text: "A question bank by topic and difficulty, and a blueprint that makes every random paper equally hard." },
  { icon: Timer, title: "Take", text: "One server clock, autosave on every change and an offline outbox when the Wi-Fi drops." },
  { icon: Activity, title: "Review", text: "A live monitor, integrity indicators with context, fair time compensation and grading." },
  { icon: FileCheck2, title: "Verify", text: "Results with feedback, and a report with a QR code anyone can check." },
];

const TOUR = [
  {
    key: "resilience",
    label: "Resilience",
    title: "Bad Wi-Fi does not end an exam",
    text: "Answers wait in an outbox on the device and sync the moment the network returns. The timer is the server's, so a refresh changes nothing.",
  },
  {
    key: "fairness",
    label: "Fairness",
    title: "Every random paper, equally hard",
    text: "Examiners set a difficulty blueprint. Each candidate gets different questions drawn to the same mix, and analytics show the spread after publishing.",
  },
  {
    key: "integrity",
    label: "Integrity",
    title: "Signals for review, never verdicts",
    text: "A hidden tab or a connection gap is logged with its context for the examiner. Indicators never change a score on their own.",
  },
  {
    key: "verification",
    label: "Verification",
    title: "Proof without oversharing",
    text: "Every published report carries a code and a QR. The verify page shows the exam, initials, score and date, and nothing more.",
  },
] as const;

type TourKey = (typeof TOUR)[number]["key"];

const ROLES = [
  { icon: UserCog, role: "Examiner", points: ["Question bank with CSV import", "Difficulty blueprints", "Live monitor, grading and analytics"] },
  { icon: BookOpenCheck, role: "Candidate", points: ["One calm dashboard", "A focused, offline-aware workspace", "Feedback and verified reports"] },
  { icon: ShieldUser, role: "Administrator", points: ["Create and import accounts", "Assign institutional roles", "Turn access on or off"] },
];

const FAQS = [
  { q: "Can candidates keep working offline?", a: "Yes. Answers are stored on the device during a connection gap and synced on reconnection. The server timer keeps running, and examiners can approve fair compensation for the outage." },
  { q: "How are randomised papers kept fair?", a: "Examiners set a difficulty blueprint, for example 4 easy, 3 medium and 2 hard. Every paper is drawn to the same blueprint, and analytics show the difficulty spread after publishing." },
  { q: "Are integrity indicators proof of misconduct?", a: "No. Indicators such as a hidden tab or a connection gap are a starting point for review, not a verdict. They never change a score on their own." },
  { q: "How does report verification work?", a: "Each published report has a unique code and QR. Anyone can open the verify page to confirm the exam, initials, score and date, without seeing personal details." },
];

const WRAP = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

const MOTION_CSS = `
@keyframes drift { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
.drift-a { animation: drift 7s ease-in-out infinite; }
.drift-b { animation: drift 8s ease-in-out -3s infinite; }
@media (prefers-reduced-motion: reduce) { .drift-a, .drift-b { animation: none; } }
`;

/* ------------------------------------------------------------------ */

function Pill({ href, children, tone = "light", className }: { href: string; children: React.ReactNode; tone?: "light" | "ghost"; className?: string }) {
  const styles = {
    light: "bg-lime text-on-lime hover:bg-lime/85",
    ghost: "border border-night-line text-lime hover:border-night-mute hover:bg-lime/[0.06]",
  };
  const cls = cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-base font-medium transition-[background-color,border-color,transform] duration-200 ease-out active:scale-[0.98]",
    styles[tone],
    className,
  );
  return href.startsWith("#") ? (
    <a href={href} className={cls}>{children}</a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  );
}

function PixelChip({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute hidden items-center gap-3 lg:flex", className)} aria-hidden>
      <span className="grid size-16 place-items-center rounded-full border border-dashed border-night-mute/60">
        <span className="grid grid-cols-3 gap-[3px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className={cn("size-[7px] rounded-[1px] bg-lime", i % 4 === 0 ? "opacity-30" : "opacity-80")} />
          ))}
        </span>
      </span>
      <span className="num rounded-[6px] bg-night-2 px-2 py-1 text-[0.8125rem] text-night-mute">{label}</span>
    </div>
  );
}

/* ---------- the tour's visuals: product pieces built in markup ---------- */

function ResilienceVisual() {
  const rows = [
    { t: "10:02", text: "Answer to question 4 saved", tone: "text-lime" },
    { t: "10:03", text: "Connection lost, answers kept on this device", tone: "text-warning-soft" },
    { t: "10:05", text: "Question 5 answered offline", tone: "text-night-mute" },
    { t: "10:06", text: "Back online, outbox synced", tone: "text-lime" },
  ];
  return (
    <ol className="divide-y divide-night-line">
      {rows.map((r) => (
        <li key={r.t} className="flex items-baseline gap-4 py-3.5">
          <span className="num w-12 shrink-0 text-[0.8125rem] text-night-mute">{r.t}</span>
          <span className={cn("text-[0.9375rem]", r.tone)}>{r.text}</span>
        </li>
      ))}
    </ol>
  );
}

function FairnessVisual() {
  const papers = ["Paper A", "Paper B", "Paper C"];
  const mix = [
    { label: "Easy", n: 4, cls: "bg-sky" },
    { label: "Medium", n: 3, cls: "bg-warning-soft" },
    { label: "Hard", n: 2, cls: "bg-lavender" },
  ];
  return (
    <div>
      <div className="space-y-3">
        {papers.map((p) => (
          <div key={p} className="flex items-center gap-4">
            <span className="w-16 shrink-0 text-[0.875rem] text-night-mute">{p}</span>
            <div className="flex flex-1 gap-1">
              {mix.flatMap((m) =>
                Array.from({ length: m.n }).map((_, i) => <span key={`${m.label}${i}`} className={cn("h-9 flex-1 rounded-[6px]", m.cls)} />),
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-4 text-[0.8125rem] text-night-mute">
        {mix.map((m) => (
          <span key={m.label} className="inline-flex items-center gap-2">
            <span className={cn("size-3 rounded-[3px]", m.cls)} /> {m.label}, {m.n} on every paper
          </span>
        ))}
      </div>
    </div>
  );
}

function IntegrityVisual() {
  const rows = [
    { name: "Ali Raza", state: "Online", note: "Question 7 of 9", tone: "bg-success-soft text-success" },
    { name: "Sara Khan", state: "Tab hidden", note: "Away for 12 s, logged for review", tone: "bg-warning-soft text-warning" },
    { name: "Hamza Ali", state: "Offline", note: "Answers held on the device", tone: "bg-lavender text-lavender-ink" },
  ];
  return (
    <ul className="divide-y divide-night-line">
      {rows.map((r) => (
        <li key={r.name} className="flex items-center justify-between gap-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[0.9375rem] text-lime">{r.name}</p>
            <p className="truncate text-[0.8125rem] text-night-mute">{r.note}</p>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[0.75rem] font-medium", r.tone)}>{r.state}</span>
        </li>
      ))}
    </ul>
  );
}

function VerificationVisual() {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <span className="grid size-28 shrink-0 place-items-center rounded-[14px] bg-lime text-on-lime">
        <QrCode className="size-16" strokeWidth={1.3} />
      </span>
      <dl className="grid flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-[0.9375rem]">
        <dt className="text-night-mute">Exam</dt>
        <dd className="text-lime">Database Systems, Midterm</dd>
        <dt className="text-night-mute">Candidate</dt>
        <dd className="text-lime">A. R.</dd>
        <dt className="text-night-mute">Outcome</dt>
        <dd className="text-lime">Passed</dd>
        <dt className="text-night-mute">Code</dt>
        <dd className="num text-lime">C97L57LLPJ</dd>
      </dl>
    </div>
  );
}

const VISUALS: Record<TourKey, () => React.ReactElement> = {
  resilience: ResilienceVisual,
  fairness: FairnessVisual,
  integrity: IntegrityVisual,
  verification: VerificationVisual,
};

/* ------------------------------------------------------------------ */

export default function HomePage() {
  const { me, loading } = useAuth();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(0);
  const [tab, setTab] = useState<TourKey>("resilience");

  useEffect(() => {
    if (!loading && me) router.replace(roleHome(me.role));
  }, [loading, me, router]);

  const active = TOUR.find((t) => t.key === tab) ?? TOUR[0];
  const Visual = VISUALS[active.key];

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <style>{MOTION_CSS}</style>

      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-50 bg-night text-lime">
        <div className={cn(WRAP, "flex h-16 items-center justify-between gap-6")}>
          <Logo />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Landing">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-[0.9375rem] text-night-mute transition-colors duration-200 hover:text-lime">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/signup" className="text-[0.9375rem] text-night-mute transition-colors duration-200 hover:text-lime">
              Create account
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center rounded-full bg-lime px-4 text-[0.9375rem] text-on-lime transition-colors duration-200 hover:bg-lime/85">
              Log in
            </Link>
          </div>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full border border-night-line text-lime md:hidden"
            onClick={() => setMenu((v) => !v)}
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
          >
            {menu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menu && (
          <div className="animate-rise border-t border-night-line md:hidden">
            <div className={cn(WRAP, "py-3")}>
              {NAV.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenu(false)} className="block py-3 text-base text-night-mute hover:text-lime">
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 pb-2">
                <Link href="/signup" className="flex h-11 items-center justify-center rounded-full border border-night-line text-[0.9375rem] text-lime">
                  Create account
                </Link>
                <Link href="/login" className="flex h-11 items-center justify-center rounded-full bg-lime text-[0.9375rem] text-on-lime">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============ HERO (charcoal stage) ============ */}
      <section className="glow-iris relative overflow-hidden pb-[24vw] text-lime sm:pb-48 lg:pb-60">
        <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
        <div className="bg-dots-night pointer-events-none absolute inset-0 -scale-x-100" aria-hidden />
        <PixelChip label="saved" className="drift-a left-[7%] top-[52%]" />
        <PixelChip label="back online" className="drift-b right-[6%] top-[22%] flex-row-reverse" />

        <div className={cn(WRAP, "relative pt-20 text-center sm:pt-24")}>
          <h1 className="display animate-rise mx-auto max-w-[900px] text-balance text-[clamp(2.7rem,6.4vw,5rem)] leading-[1.02] text-lime">
            Exams that let <span className="text-gradient">knowledge</span> speak
          </h1>
          <p className="animate-rise mx-auto mt-6 max-w-[520px] text-[1.125rem] leading-relaxed text-night-mute [animation-delay:80ms]">
            Secure online exams that survive bad Wi-Fi and grade every paper fairly.
          </p>
          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:160ms]">
            <Pill href="/login">
              Log in to ExamCore <ArrowRight className="size-4" />
            </Pill>
            <Pill href="#how" tone="ghost">
              See how it works
            </Pill>
          </div>
        </div>
      </section>

      {/* ============ SIGNATURE: the real workspace, straddling stage and paper ============ */}
      <div className={cn(WRAP, "relative z-10 -mt-[20vw] sm:-mt-36 lg:-mt-48")}>
        <figure className="animate-rise overflow-hidden rounded-[18px] border border-line bg-surface p-1.5 shadow-pop [animation-delay:240ms] sm:rounded-[22px] sm:p-2">
          <Image
            src="/landing/workspace.png"
            alt="The ExamCore exam workspace: a question with four options, the server timer, the save status and the question navigator."
            width={1440}
            height={900}
            priority
            className="h-auto w-full rounded-[13px] sm:rounded-[16px]"
          />
        </figure>
      </div>

      {/* ============ FACTS ============ */}
      <section className={cn(WRAP, "pt-24 sm:pt-32")}>
        <div className="grid gap-1.5 rounded-[20px] border border-line bg-paper p-1.5 lg:grid-cols-[minmax(0,1.15fr)_repeat(4,minmax(0,1fr))]">
          <div className="flex flex-col justify-end p-6 sm:p-7">
            <h2 className="display text-[2rem] leading-[1.08]">Built for exam day</h2>
          </div>
          <div className="grid grid-cols-2 gap-1.5 lg:contents">
            {FACTS.map((f) => (
              <div key={f.label} className="flex min-h-[170px] flex-col justify-between rounded-[14px] border border-line bg-surface p-5 sm:p-6">
                <p className="display text-[2.6rem] leading-none">{f.value}</p>
                <p className="mt-6 text-[0.875rem] leading-snug text-mute">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className={cn(WRAP, "scroll-mt-20 pt-28 sm:pt-36")}>
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <h2 className="display display-lg max-w-[520px]">From question bank to verified report</h2>
          <p className="max-w-[480px] text-[1.0625rem] leading-relaxed text-mute lg:justify-self-end">
            One flow for the whole exam, with the hard parts handled for you: the clock, the network and fairness.
          </p>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li
              key={title}
              className="rounded-[18px] border border-line bg-surface p-6 transition-[border-color,transform] duration-300 ease-out hover:-translate-y-1 hover:border-line-strong"
            >
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-mute" strokeWidth={1.6} />
                <span className="num text-[0.8125rem] text-mute">0{i + 1}</span>
              </div>
              <h3 className="display mt-10 text-[1.6rem]">{title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-mute">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ============ PLATFORM TOUR (charcoal stage, tabs) ============ */}
      <section id="platform" className="glow-iris relative mt-28 scroll-mt-16 overflow-hidden py-20 text-lime sm:mt-36 sm:py-28">
        <div className="bg-dots-night pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <div className={cn(WRAP, "relative grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16")}>
          <div>
            <h2 className="display display-lg text-lime">What makes it hold up</h2>
            <div role="tablist" aria-label="Platform tour" className="scrollbar-none mt-10 flex gap-6 overflow-x-auto border-b border-night-line">
              {TOUR.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  id={`tab-${t.key}`}
                  aria-selected={tab === t.key}
                  aria-controls="tour-panel"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "-mb-px shrink-0 border-b-2 pb-3 text-[0.9375rem] transition-colors duration-200",
                    tab === t.key ? "border-lime text-lime" : "border-transparent text-night-mute hover:text-lime",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div key={active.key} className="animate-rise">
              <h3 className="display mt-8 text-[1.75rem] text-lime">{active.title}</h3>
              <p className="mt-3 max-w-[460px] text-[1.0625rem] leading-relaxed text-night-mute">{active.text}</p>
            </div>
          </div>
          <div
            id="tour-panel"
            role="tabpanel"
            aria-labelledby={`tab-${active.key}`}
            className="self-center rounded-[20px] border border-night-line bg-night-2 p-6 sm:p-8"
          >
            <div key={active.key} className="animate-rise">
              <Visual />
            </div>
          </div>
        </div>
      </section>

      {/* ============ ROLES ============ */}
      <section id="roles" className={cn(WRAP, "scroll-mt-20 pt-28 sm:pt-36")}>
        <h2 className="display display-lg max-w-[560px]">One platform, three clear roles</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ROLES.map(({ icon: Icon, role, points }) => (
            <article key={role} className="flex flex-col rounded-[18px] border border-line bg-surface p-7">
              <Icon className="size-6 text-mute" strokeWidth={1.5} />
              <h3 className="display mt-8 text-[1.75rem]">{role}</h3>
              <ul className="mt-5 space-y-3 border-t border-line pt-5">
                {points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 text-[0.9375rem] text-mute">
                    <Check className="mt-1 size-4 shrink-0 text-success" strokeWidth={2} />
                    {pt}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className={cn(WRAP, "scroll-mt-20 pt-28 sm:pt-36")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <h2 className="display display-lg">Questions examiners ask</h2>
          <div className="border-t border-line">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-[1.0625rem] font-medium text-ink"
                  >
                    {f.q}
                    <Plus className={cn("size-5 shrink-0 text-mute transition-transform duration-300 ease-out", isOpen && "rotate-45")} />
                  </button>
                  {isOpen && <p className="animate-rise max-w-[620px] pb-6 text-base leading-relaxed text-mute">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CLOSING STAGE + FOOTER ============ */}
      <section className={cn(WRAP, "pt-28 sm:pt-36")}>
        <div className="glow-iris relative overflow-hidden rounded-[24px] px-6 py-20 text-center text-lime sm:py-28">
          <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
          <div className="bg-dots-night pointer-events-none absolute inset-0 -scale-x-100" aria-hidden />
          <h2 className="display relative mx-auto max-w-[720px] text-balance text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.05] text-lime">
            Run exams that <span className="text-gradient">hold up</span> under pressure
          </h2>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Pill href="/login">
              Log in <ArrowRight className="size-4" />
            </Pill>
            <Pill href="/verify/C97L57LLPJ" tone="ghost">
              Verify a sample report
            </Pill>
          </div>
        </div>
      </section>

      <footer className={cn(WRAP, "flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Logo tone="dark" />
          <p className="text-[0.875rem] text-mute">COMSATS University Lahore, Technoverse 5.0</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {[
            { label: "Log in", href: "/login" },
            { label: "Create account", href: "/signup" },
            { label: "Verify a report", href: "/verify/C97L57LLPJ" },
          ].map(({ label, href }) => (
            <Link key={href} href={href} className="text-[0.875rem] text-mute transition-colors duration-200 hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
