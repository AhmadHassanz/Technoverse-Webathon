"use client";

// Landing page — Design System 02 "Midnight Iris".
// Everything is live markup (no raster art): a dark hero with a floating product mock,
// a four-step flow, a bento grid of the real features, roles, FAQ and a closing call to action.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  CloudOff,
  Contrast,
  FileCheck2,
  Flag,
  GraduationCap,
  Library,
  Menu,
  Plus,
  QrCode,
  Radio,
  Scale,
  ShieldCheck,
  ShieldUser,
  Sparkles,
  Timer,
  UserCog,
  X,
} from "lucide-react";
import { roleHome, useAuth } from "@/frontend/lib/auth";
import { cn } from "@/frontend/lib/utils";

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Platform", href: "#platform" },
  { label: "Roles", href: "#roles" },
  { label: "FAQ", href: "#faq" },
];

const STEPS = [
  { icon: Library, title: "Prepare", text: "Build a reusable question bank by topic and difficulty, then set a blueprint so every random paper is equally hard." },
  { icon: Timer, title: "Take", text: "One server clock, autosave on every change and an offline outbox that keeps answers safe when Wi-Fi drops." },
  { icon: Activity, title: "Review", text: "Live monitor, integrity indicators with context, fair time compensation and side-by-side grading." },
  { icon: FileCheck2, title: "Verify", text: "Publish results with feedback. Every report carries a QR code anyone can check in one tap." },
];

const ROLES = [
  {
    icon: UserCog,
    role: "Examiner",
    tag: "Prepare & conduct",
    points: ["Question bank with CSV import", "Difficulty blueprints for fair papers", "Live monitor, grading and analytics"],
  },
  {
    icon: BookOpenCheck,
    role: "Candidate",
    tag: "Take & reflect",
    points: ["Personal exam dashboard", "Focused, offline-aware workspace", "Feedback and verified reports"],
  },
  {
    icon: ShieldUser,
    role: "Administrator",
    tag: "Manage & govern",
    points: ["Create and manage accounts", "Assign institutional roles", "Activate or deactivate access"],
  },
];

const FAQS = [
  { q: "Can candidates keep working offline?", a: "Yes. Answers are stored on the device during a connection gap, then synced on reconnection. The server timer keeps running, and examiners can approve fair compensation for the outage." },
  { q: "How are randomised papers kept fair?", a: "Examiners set a difficulty blueprint (for example 4 easy, 3 medium, 2 hard). Every candidate's paper is drawn to the same blueprint, and analytics show the difficulty spread after publishing." },
  { q: "Are integrity indicators proof of misconduct?", a: "No. Indicators such as a hidden tab or a connection gap are a starting point for review, not a verdict. They never change a score on their own." },
  { q: "How does report verification work?", a: "Each published report has a unique code and QR. Anyone can open the verify page to confirm the exam, initials, score and date, without seeing personal details." },
];

const WRAP = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

/* ------------------------------------------------------------------ */

function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="ExamCore home">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-lime text-on-lime transition-transform group-hover:-rotate-6">
        <GraduationCap className="size-[18px]" strokeWidth={2.2} />
      </span>
      <span className="display text-[1.3rem] leading-none tracking-[-0.04em] text-white">ExamCore</span>
    </Link>
  );
}

function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em]",
        dark ? "border border-white/15 bg-white/5 text-lime" : "border border-cobalt/15 bg-tint text-cobalt",
      )}
    >
      <Sparkles className="size-3.5" />
      {children}
    </p>
  );
}

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: React.ReactNode; text?: string }) {
  return (
    <div className="mx-auto max-w-[720px] text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="display mt-5 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.02] text-balance">{title}</h2>
      {text && <p className="mx-auto mt-4 max-w-[560px] text-[1rem] leading-relaxed text-mute">{text}</p>}
    </div>
  );
}

/** The floating product mock in the hero. Pure markup, no images. */
function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="relative rounded-[22px] border border-white/10 bg-[#111627] p-2 shadow-[0_40px_120px_-30px_rgb(80_70_230/0.6)]">
        <div className="flex items-center gap-1.5 px-3 py-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate text-[0.6875rem] text-night-mute">examcore · Computer Networks — Quiz 2</span>
        </div>
        <div className="rounded-[16px] bg-white p-4 text-[#0d1324] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="num flex h-7 min-w-7 items-center justify-center rounded-[8px] bg-[#0b0f1e] px-1.5 text-[0.75rem] text-[#c6f36b]">04</span>
              <span className="text-[0.75rem] text-[#5b6479]">of 08 · 2 marks</span>
            </div>
            <span className="num rounded-[10px] bg-[#0b0f1e] px-2.5 py-1 text-[0.875rem] text-white">
              <span className="text-[#c6f36b]">●</span> 24:18
            </span>
          </div>
          <p className="mt-4 text-[1rem] font-medium leading-snug sm:text-[1.0625rem]">Which data structure is best suited for undo?</p>
          <div className="mt-4 space-y-2">
            {[
              { l: "A", t: "Queue — first in, first out", on: false },
              { l: "B", t: "Stack — last in, first out", on: true },
              { l: "C", t: "Hash table", on: false },
            ].map((o) => (
              <div
                key={o.l}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] border px-3 py-2.5 text-[0.8125rem]",
                  o.on ? "border-[#5046e6] bg-[#efeeff]" : "border-[#e1e4ec]",
                )}
              >
                <span
                  className={cn(
                    "num flex size-7 items-center justify-center rounded-full text-[0.75rem] font-semibold",
                    o.on ? "bg-[#5046e6] text-white" : "bg-[#eef0f5] text-[#5b6479]",
                  )}
                >
                  {o.on ? <Check className="size-3.5" strokeWidth={3} /> : o.l}
                </span>
                {o.t}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <span
                key={n}
                className={cn(
                  "num flex h-7 flex-1 items-center justify-center rounded-[8px] text-[0.6875rem]",
                  n < 4
                    ? "bg-[#5046e6] text-white"
                    : n === 4
                      ? "bg-[#0b0f1e] text-[#c6f36b]"
                      : n === 6
                        ? "bg-[#fff0d4] text-[#9a5700]"
                        : "border border-[#e1e4ec] text-[#5b6479]",
                )}
              >
                {n === 6 ? <Flag className="size-3" /> : n}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="float-a absolute -bottom-7 -left-4 hidden rounded-[14px] border border-white/10 bg-[#151a2e]/95 p-3 text-white shadow-pop backdrop-blur sm:block lg:-left-10">
        <p className="flex items-center gap-2 text-[0.75rem] font-semibold">
          <CloudOff className="size-4 text-[#ff8593]" /> Offline
        </p>
        <p className="mt-1 text-[0.6875rem] text-night-mute">3 answers safe on device</p>
      </div>
      <div className="float-b absolute -top-4 right-6 hidden rounded-[14px] bg-lime p-3 text-on-lime shadow-pop sm:block">
        <p className="flex items-center gap-2 text-[0.75rem] font-bold">
          <Check className="size-4" strokeWidth={3} /> All answers saved
        </p>
      </div>
      <div className="float-c absolute -bottom-7 right-4 hidden items-center gap-3 rounded-[14px] border border-white/10 bg-[#151a2e]/95 p-3 text-white shadow-pop backdrop-blur sm:flex lg:-right-8">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-white text-[#0b0f1e]">
          <QrCode className="size-5" />
        </span>
        <div>
          <p className="text-[0.75rem] font-semibold">Verified report</p>
          <p className="num text-[0.6875rem] text-night-mute">C97L57LLPJ · 25/30</p>
        </div>
      </div>
    </div>
  );
}

const FLOAT_CSS = `
@keyframes ec-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.float-a{animation:ec-float 6s ease-in-out infinite}
.float-b{animation:ec-float 7s ease-in-out 1s infinite}
.float-c{animation:ec-float 8s ease-in-out 2s infinite}
@media (prefers-reduced-motion:reduce){.float-a,.float-b,.float-c{animation:none}}
`;

/* ------------------------------------------------------------------ */

export default function HomePage() {
  const { me, loading } = useAuth();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    if (!loading && me) router.replace(roleHome(me.role));
  }, [loading, me, router]);

  return (
    <div className="min-h-screen overflow-x-clip bg-parchment text-ink">
      <style>{FLOAT_CSS}</style>

      {/* ============ HERO ============ */}
      <section className="glow-iris relative overflow-hidden bg-night text-white">
        <div className="bg-dots-night pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden />

        <header className="relative z-20">
          <div className={cn(WRAP, "flex h-[72px] items-center justify-between")}>
            <Logo />
            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur md:flex" aria-label="Landing">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className="rounded-full px-4 py-1.5 text-[0.8125rem] font-medium text-night-mute transition-colors hover:bg-white/10 hover:text-white">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="rounded-full px-4 py-2 text-[0.8125rem] font-medium text-white/85 hover:text-white">
                Log in
              </Link>
              <Link href="/signup" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[0.8125rem] font-semibold text-[#0b0f1e] transition-transform hover:-translate-y-0.5">
                Create account <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              className="flex size-10 items-center justify-center rounded-[12px] border border-white/15 bg-white/5 md:hidden"
            >
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
          {menu && (
            <div className="animate-rise mx-4 rounded-[18px] border border-white/10 bg-[#151a2e] p-2 md:hidden">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenu(false)} className="block rounded-[12px] px-4 py-3 text-[0.9375rem] font-medium text-white/90 hover:bg-white/5">
                  {item.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link href="/login" className="flex h-11 items-center justify-center rounded-[12px] border border-white/15 text-[0.875rem] font-medium">
                  Log in
                </Link>
                <Link href="/signup" className="flex h-11 items-center justify-center rounded-[12px] bg-lime text-[0.875rem] font-semibold text-on-lime">
                  Create account
                </Link>
              </div>
            </div>
          )}
        </header>

        <div className={cn(WRAP, "relative z-10 grid items-center gap-14 pb-24 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-32 lg:pt-20")}>
          <div className="animate-rise text-center lg:text-left">
            <Eyebrow dark>Secure examination platform</Eyebrow>
            <h1 className="display mt-6 text-[clamp(2.75rem,6.4vw,5rem)] leading-[0.98] tracking-[-0.045em] text-white">
              Exams that let <span className="text-gradient">knowledge</span> speak.
            </h1>
            <p className="mx-auto mt-6 max-w-[520px] text-[1.0625rem] leading-relaxed text-night-mute lg:mx-0">
              Create, take and assess online examinations with clarity, fairness and resilience — even when the Wi-Fi gives up.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-lime px-6 text-[0.9375rem] font-semibold text-on-lime shadow-[0_14px_40px_-12px_rgb(198_243_107/0.6)] transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Log in to ExamCore <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/5 px-6 text-[0.9375rem] font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                See how it works
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[0.8125rem] text-night-mute lg:justify-start">
              {[
                { icon: CloudOff, t: "Offline-proof" },
                { icon: Scale, t: "Fair random papers" },
                { icon: QrCode, t: "QR-verified results" },
              ].map(({ icon: Icon, t }) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <Icon className="size-4 text-lime" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <HeroMock />
          </div>
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section className="relative z-10 -mt-10">
        <div className={WRAP}>
          <div className="grid grid-cols-2 overflow-hidden rounded-[22px] border border-line bg-surface shadow-pop md:grid-cols-4">
            {[
              { n: "3", l: "Purpose-built roles" },
              { n: "3", l: "Question types" },
              { n: "45s", l: "Outage detection" },
              { n: "100%", l: "Answers kept offline" },
            ].map((s, i) => (
              <div
                key={s.l}
                className={cn(
                  "px-6 py-6 text-center",
                  i % 2 === 1 && "border-l border-line-soft",
                  i >= 2 && "border-t border-line-soft md:border-t-0",
                  i === 2 && "md:border-l",
                )}
              >
                <p className="display text-[2.25rem] leading-none tracking-[-0.05em]">{s.n}</p>
                <p className="mt-2 text-[0.8125rem] text-mute">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="scroll-mt-10 py-24 sm:py-28">
        <div className={WRAP}>
          <SectionHead
            eyebrow="One connected flow"
            title={
              <>
                From first question <br className="hidden sm:block" /> to verified result.
              </>
            }
            text="Four stages, one platform. Nothing works in isolation, so nothing gets lost between steps."
          />
          <div className="relative mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div aria-hidden className="absolute left-[12%] right-[12%] top-[34px] hidden h-px bg-gradient-to-r from-transparent via-cobalt/40 to-transparent lg:block" />
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="group relative rounded-[20px] border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-pop">
                <div className="flex items-center justify-between">
                  <span className="relative flex size-11 items-center justify-center rounded-[14px] bg-night text-lime transition-transform group-hover:rotate-[-6deg]">
                    <Icon className="size-5" />
                  </span>
                  <span className="num text-[0.75rem] text-mute">0{i + 1}</span>
                </div>
                <h3 className="display mt-6 text-[1.4rem] tracking-[-0.03em]">{title}</h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-mute">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENTO ============ */}
      <section id="platform" className="scroll-mt-10 pb-24 sm:pb-28">
        <div className={WRAP}>
          <SectionHead
            eyebrow="Built for the exam hall"
            title="Less friction. More focus."
            text="The important work is already demanding. Your examination platform shouldn't be."
          />

          <div className="mt-14 grid gap-4 md:grid-cols-6">
            <article className="glow-iris relative overflow-hidden rounded-[24px] bg-night p-7 text-white md:col-span-4 md:row-span-2">
              <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
              <div className="relative">
                <span className="flex size-11 items-center justify-center rounded-[14px] bg-lime text-on-lime">
                  <CloudOff className="size-5" />
                </span>
                <h3 className="display mt-6 text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.05] text-white">Failure-resilient by design.</h3>
                <p className="mt-3 max-w-[440px] text-[0.9375rem] leading-relaxed text-night-mute">
                  Network drops? Answers wait in an on-device outbox and sync the moment you are back. The server spots the gap and the examiner can give the lost minutes back.
                </p>
                <div className="mt-8 space-y-2.5">
                  {[
                    { t: "14:02:11", m: "Answer saved", c: "text-lime", i: Check },
                    { t: "14:02:40", m: "Connection lost — 3 answers kept on device", c: "text-[#ff8593]", i: CloudOff },
                    { t: "14:03:52", m: "Back online — synced 3 answers", c: "text-[#93daf0]", i: Radio },
                    { t: "14:05:00", m: "Examiner approved +72 s compensation", c: "text-lime", i: Plus },
                  ].map(({ t, m, c, i: Icon }) => (
                    <div key={t} className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[0.8125rem]">
                      <Icon className={cn("size-4 shrink-0", c)} />
                      <span className="num text-night-mute">{t}</span>
                      <span className="truncate">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-line bg-surface p-6 shadow-card md:col-span-2">
              <span className="flex size-10 items-center justify-center rounded-[12px] bg-tint text-cobalt">
                <Scale className="size-5" />
              </span>
              <h3 className="display mt-5 text-[1.3rem] tracking-[-0.03em]">Fairer random papers</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-mute">Difficulty blueprints give every candidate an equally hard paper.</p>
              <div className="mt-5 space-y-2.5">
                {[
                  { l: "Easy", v: 4, t: 6, c: "bg-success" },
                  { l: "Medium", v: 3, t: 4, c: "bg-cobalt" },
                  { l: "Hard", v: 2, t: 3, c: "bg-[#b06bff]" },
                ].map((b) => (
                  <div key={b.l}>
                    <div className="flex justify-between text-[0.75rem] text-mute">
                      <span>{b.l}</span>
                      <span className="num">
                        {b.v}/{b.t}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand">
                      <div className={cn("h-full rounded-full", b.c)} style={{ width: `${(b.v / b.t) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[24px] border border-line bg-surface p-6 shadow-card md:col-span-2">
              <span className="flex size-10 items-center justify-center rounded-[12px] bg-tint text-cobalt">
                <Activity className="size-5" />
              </span>
              <h3 className="display mt-5 text-[1.3rem] tracking-[-0.03em]">Live monitoring</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-mute">Who is online, how far along, and what needs context — every 5 seconds.</p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  { n: "42", l: "Active" },
                  { n: "06", l: "Done" },
                  { n: "02", l: "Offline" },
                ].map((s) => (
                  <div key={s.l} className="rounded-[12px] bg-paper py-2.5">
                    <p className="display text-[1.4rem] leading-none tracking-[-0.04em]">{s.n}</p>
                    <p className="mt-1 text-[0.6875rem] text-mute">{s.l}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="flex flex-col justify-between gap-6 rounded-[24px] bg-lime p-6 text-on-lime sm:flex-row sm:items-center md:col-span-3">
              <div>
                <QrCode className="size-8" />
                <h3 className="display mt-4 text-[1.5rem] tracking-[-0.03em] text-on-lime">Results anyone can verify.</h3>
                <p className="mt-2 max-w-[320px] text-[0.8125rem] leading-relaxed opacity-75">A PDF report with a QR code. Scan it to confirm score and date, privately.</p>
              </div>
              <Link
                href="/verify/C97L57LLPJ"
                className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-[12px] bg-[#0b0f1e] px-5 text-[0.875rem] font-semibold text-white transition-transform hover:-translate-y-0.5 sm:self-auto"
              >
                Try a real code <ArrowUpRight className="size-4" />
              </Link>
            </article>

            <article className="rounded-[24px] border border-line bg-surface p-6 shadow-card md:col-span-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex size-10 items-center justify-center rounded-[12px] bg-tint text-cobalt">
                    <Contrast className="size-5" />
                  </span>
                  <h3 className="display mt-5 text-[1.3rem] tracking-[-0.03em]">Comfortable for everyone</h3>
                  <p className="mt-2 max-w-[340px] text-[0.8125rem] leading-relaxed text-mute">
                    Light, dark and high-contrast themes, three text sizes, keyboard shortcuts and a built-in scratchpad.
                  </p>
                </div>
                <div className="hidden shrink-0 gap-1.5 sm:flex" aria-hidden>
                  <span className="size-9 rounded-full border border-line bg-white" />
                  <span className="size-9 rounded-full bg-[#111627]" />
                  <span className="size-9 rounded-full border-2 border-[#ffd400] bg-black" />
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============ ROLES ============ */}
      <section id="roles" className="scroll-mt-10 border-y border-line bg-surface py-24 sm:py-28">
        <div className={WRAP}>
          <SectionHead
            eyebrow="Purpose-built, not one-size-fits-all"
            title="The right tools for every role."
            text="Separate responsibilities. A shared standard. One account, your assigned role."
          />
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {ROLES.map(({ icon: Icon, role, tag, points }, i) => (
              <article
                key={role}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-[24px] border p-7 transition-all hover:-translate-y-1",
                  i === 1 ? "glow-iris border-transparent bg-night text-white shadow-pop" : "border-line bg-parchment",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("flex size-11 items-center justify-center rounded-[14px]", i === 1 ? "bg-lime text-on-lime" : "bg-night text-lime")}>
                    <Icon className="size-5" />
                  </span>
                  <span className={cn("num text-[0.75rem]", i === 1 ? "text-night-mute" : "text-mute")}>0{i + 1}</span>
                </div>
                <h3 className={cn("display mt-6 text-[1.75rem] tracking-[-0.035em]", i === 1 && "text-white")}>{role}</h3>
                <p className={cn("text-[0.875rem]", i === 1 ? "text-night-mute" : "text-mute")}>{tag}</p>
                <ul className="mt-6 space-y-3">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-[0.875rem]">
                      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", i === 1 ? "bg-lime/20 text-lime" : "bg-tint text-cobalt")}>
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={cn(
                    "mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-[12px] text-[0.875rem] font-semibold transition-transform hover:-translate-y-0.5",
                    i === 1 ? "bg-lime text-on-lime" : "bg-night text-white",
                  )}
                >
                  Log in as {role.toLowerCase()} <ArrowRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="scroll-mt-10 py-24 sm:py-28">
        <div className={cn(WRAP, "grid gap-12 lg:grid-cols-[0.9fr_1.1fr]")}>
          <div>
            <Eyebrow>A little more clarity</Eyebrow>
            <h2 className="display mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.02]">Before you begin.</h2>
            <p className="mt-4 max-w-[380px] text-[1rem] leading-relaxed text-mute">
              Short answers to the questions examiners and candidates ask most.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-card">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-success-soft text-success">
                <ShieldCheck className="size-5" />
              </span>
              <p className="text-[0.8125rem] leading-relaxed text-mute">
                Answers are private, roles are checked on every request, and indicators never change a score.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={cn("rounded-[18px] border bg-surface transition-shadow", isOpen ? "border-cobalt/30 shadow-card" : "border-line")}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[1rem] font-semibold tracking-[-0.01em]">{f.q}</span>
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full transition-all",
                        isOpen ? "rotate-45 bg-cobalt text-on-cobalt" : "bg-sand text-mute",
                      )}
                    >
                      <Plus className="size-4" />
                    </span>
                  </button>
                  {isOpen && <p className="animate-rise px-5 pb-5 text-[0.9375rem] leading-relaxed text-mute">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA + FOOTER ============ */}
      <section className="px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="glow-iris relative overflow-hidden rounded-[28px] bg-night text-white">
          <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
          <div className={cn(WRAP, "relative py-20 text-center sm:py-24")}>
            <Eyebrow dark>A better space for what you know</Eyebrow>
            <h2 className="display mx-auto mt-6 max-w-[760px] text-[clamp(2.25rem,5vw,4rem)] leading-[1] text-white">
              Ready for a clearer examination experience?
            </h2>
            <p className="mx-auto mt-5 max-w-[520px] text-[1rem] text-night-mute">
              Bring preparation, delivery and reflection into one connected experience.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-lime px-6 text-[0.9375rem] font-semibold text-on-lime transition-transform hover:-translate-y-0.5 sm:w-auto"
              >
                Log in to ExamCore <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/5 px-6 text-[0.9375rem] font-medium hover:bg-white/10 sm:w-auto"
              >
                Create an account
              </Link>
            </div>
          </div>

          <footer className={cn(WRAP, "relative border-t border-white/10 py-12")}>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div>
                <Logo />
                <p className="mt-4 max-w-[280px] text-[0.8125rem] leading-relaxed text-night-mute">
                  Exams that let knowledge speak. A calmer, more considered way to create, take and assess examinations.
                </p>
              </div>
              {[
                { h: "Platform", l: [["How it works", "#how"], ["Features", "#platform"], ["FAQ", "#faq"]] },
                { h: "For every role", l: [["Examiners", "/login"], ["Candidates", "/login"], ["Administrators", "/login"]] },
                { h: "Your account", l: [["Log in", "/login"], ["Create account", "/signup"], ["Verify a report", "/verify/C97L57LLPJ"]] },
              ].map((col) => (
                <div key={col.h}>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-white">{col.h}</p>
                  <ul className="mt-4 space-y-2.5">
                    {col.l.map(([label, href]) => (
                      <li key={label}>
                        <Link href={href} className="text-[0.875rem] text-night-mute transition-colors hover:text-white">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-[0.75rem] text-night-mute sm:flex-row sm:justify-between">
              <p>© 2026 ExamCore · Secure Examination Management</p>
              <p>COMSATS University Lahore · Technoverse 5.0</p>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
