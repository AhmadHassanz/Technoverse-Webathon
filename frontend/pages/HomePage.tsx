"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Crosshair,
  FileCheck2,
  Flag,
  LockKeyhole,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { roleHome, useAuth } from "@/frontend/lib/auth";

const nav = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#how" },
  { label: "Trust & verification", href: "#trust" },
];

const pillars = [
  "Prepare with purpose",
  "Take with confidence",
  "Review with context",
  "Verify with trust",
];

const roles = [
  {
    n: "01",
    title: "Examiner",
    description:
      "Question banks and balanced papers. Live monitoring, grading queues and honest analytics.",
    cta: "Enter workspace",
    href: "/login",
  },
  {
    n: "02",
    title: "Candidate",
    description:
      "A personal dashboard, clear instructions, and a workspace that keeps calm when the network does not.",
    cta: "Enter workspace",
    href: "/login",
  },
  {
    n: "03",
    title: "Administrator",
    description:
      "Create and manage user accounts. Roles, access and activation in a single register.",
    cta: "Enter workspace",
    href: "/login",
  },
];

const faqs = [
  {
    q: "Can candidates keep working offline?",
    a: "Yes. Answers save to the device immediately and sync when the connection returns. The timer keeps its own server-verified clock.",
  },
  {
    q: "Are indicators proof of misconduct?",
    a: "No. Indicators are context, never conclusions. Reviewers see a timeline and note their decision before acting.",
  },
  {
    q: "Who can see a candidate's result?",
    a: "Candidates see only their own published result. Examiners see the exam. Public verification exposes initials and the minimum report details.",
  },
  {
    q: "How does paper verification work?",
    a: "Every issued report carries a code and QR reference. The verification page checks the code without revealing personal details.",
  },
];

function HeroArt() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1240 300"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] w-full"
      preserveAspectRatio="none"
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <ellipse
          key={i}
          cx="620"
          cy="310"
          rx={90 + i * 78}
          ry={12 + i * 18}
          fill="none"
          stroke="#F0E3C7"
          strokeOpacity={0.22}
          strokeWidth="1"
        />
      ))}
      <circle cx="620" cy="240" r="5" fill="#F0E3C7" fillOpacity="0.8" />
      <rect x="606" y="246" width="28" height="3" rx="1.5" fill="#F0E3C7" fillOpacity="0.55" />
    </svg>
  );
}

export default function HomePage() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && me) router.replace(roleHome(me.role));
  }, [loading, me, router]);

  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-line/70">
        <div className="mx-auto flex h-20 w-full max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="display text-[1.7rem] leading-none text-cobalt">
            ExamCore
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Landing">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[0.8125rem] text-mute transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden px-3 py-2 text-[0.8125rem] text-ink hover:text-cobalt sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-md border border-cobalt bg-cobalt px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-cobalt-deep"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1320px] px-4 pt-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[4px] bg-cobalt px-6 pb-28 pt-16 text-center sm:pt-20">
          <HeroArt />
          <div className="relative z-10 mx-auto max-w-3xl">
            <p className="text-[0.625rem] uppercase tracking-[0.16em] text-parchment/70">
              Focus on the work, not the noise
            </p>
            <h1 className="display display-xl mt-5 text-parchment text-balance">
              Exams that let
              <br />
              knowledge speak.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-parchment/80">
              Create, take and assess online examinations with clarity,
              integrity and control.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-parchment px-6 text-[0.875rem] font-medium text-cobalt transition-colors hover:bg-white"
              >
                Log in to ExamCore
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#platform"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-parchment/50 px-6 text-[0.875rem] text-parchment transition-colors hover:bg-white/10"
              >
                Explore the platform
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-[1320px] px-5 py-14 sm:px-8 lg:px-12">
        <p className="text-center text-[0.625rem] uppercase tracking-[0.14em] text-cobalt">
          01 — The complete examination platform
        </p>
        <div className="mt-8 grid divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {pillars.map((pillar) => (
            <div key={pillar} className="flex items-center justify-center gap-3 px-4 py-5">
              <span className="size-1.5 rounded-full bg-cobalt" />
              <p className="text-[0.8125rem] text-ink">{pillar}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="mx-auto w-full max-w-[1320px] px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display display-lg text-balance">One exam. Every part connected.</h2>
          <p className="mt-3 text-[0.9375rem] text-mute">
            From the first question to the final report, nothing works in isolation.
          </p>
        </div>

        <div className="mt-12 grid gap-10 border-y border-line py-10 md:grid-cols-3 md:gap-0">
          {[
            {
              n: "03",
              title: "Purpose-built tools",
              detail: "Authoring · Blueprint · Grading · Analytics",
            },
            {
              n: "03",
              title: "Roles in one workspace",
              detail: "Single register · Scoped access · One source of truth",
            },
            {
              n: "Offline-ready",
              title: "Confidence through disruption",
              detail: "Autosave · Local outbox · Server-verified clock",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className={
                i === 1
                  ? "md:border-x md:border-line md:px-10"
                  : i === 2
                    ? "md:pl-10"
                    : "md:pr-10"
              }
            >
              <p className="num text-[2.1rem] leading-none text-cobalt">{item.n}</p>
              <p className="display mt-4 text-[1.35rem]">{item.title}</p>
              <p className="mt-2 text-[0.75rem] uppercase tracking-[0.06em] text-mute">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="eyebrow">Make space for the exam</p>
            <h2 className="display display-lg mt-4">
              Less friction.
              <br />
              More focus.
            </h2>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-mute">
              The important work is already demanding. Your examination platform
              shouldn&apos;t be.
            </p>
            <a href="#how" className="link-underline mt-4 inline-block text-sm font-medium">
              Explore your workspace →
            </a>
          </div>

          <div className="grid gap-x-12 gap-y-9 sm:grid-cols-2">
            {[
              {
                icon: FileCheck2,
                title: "Fairer papers",
                detail: "Difficulty targets meet the blueprint, and the picker proves it before publish.",
              },
              {
                icon: ShieldCheck,
                title: "Time, held honestly",
                detail: "A server-side clock governs the timer, pauses and approved compensation.",
              },
              {
                icon: WifiOff,
                title: "Progress, protected",
                detail: "Answers save on the device first, then sync without losing a keystroke.",
              },
              {
                icon: Flag,
                title: "Indicators, not verdicts",
                detail: "Incidents arrive with context. Reviewers decide with a note, never a guess.",
              },
            ].map((feature) => (
              <div key={feature.title}>
                <feature.icon className="size-5 text-cobalt" strokeWidth={1.5} />
                <h3 className="display mt-4 text-[1.35rem]">{feature.title}</h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-mute">
                  {feature.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Inside the workflow</p>
          <h2 className="display display-lg mt-4 text-balance">A clearer view, at every step.</h2>
          <p className="mt-3 text-[0.9375rem] text-mute">
            Considered tools for the people preparing, taking and reviewing examinations.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="surface-card p-5">
            <div className="rounded-md border border-line bg-parchment/30 p-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <p className="text-[0.75rem] text-mute">Question bank</p>
                <p className="text-[0.75rem] text-mute">Selected pool</p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-2">
                  {[
                    ["01", "What is the time complexity of binary search?", "Easy · 2 marks"],
                    ["02", "Select the properties of a balanced tree.", "Medium · 3 marks"],
                    ["03", "Explain collision handling in hash tables.", "Hard · 5 marks"],
                  ].map(([n, stem, meta]) => (
                    <div
                      key={n}
                      className="flex items-start justify-between gap-3 rounded-[5px] border border-line bg-surface px-3 py-2.5"
                    >
                      <div>
                        <p className="text-[0.6875rem] text-cobalt">{n}</p>
                        <p className="mt-0.5 text-[0.6875rem] leading-snug text-ink">{stem}</p>
                        <p className="mt-1 text-[0.625rem] text-mute">{meta}</p>
                      </div>
                      <span className="rounded-[4px] border border-cobalt/30 px-2 py-1 text-[0.625rem] text-cobalt">
                        Add
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-[0.6875rem] text-ink">Data Structures · 12 questions</p>
                  {[
                    ["Binary search", "Q1", "2 marks"],
                    ["Balanced trees", "Q2", "3 marks"],
                    ["Hash collisions", "Q3", "5 marks"],
                  ].map(([name, qn, marks]) => (
                    <div key={name} className="flex items-center justify-between gap-2 text-[0.6875rem]">
                      <span className="text-cobalt">{qn}</span>
                      <span className="flex-1 truncate text-ink">{name}</span>
                      <span className="text-mute">{marks}</span>
                    </div>
                  ))}
                  <div className="mt-3 rounded-[5px] bg-tint px-3 py-2">
                    <p className="text-[0.625rem] text-cobalt">Blueprint coverage</p>
                    <div className="mt-2 flex gap-1">
                      <span className="h-1.5 flex-1 rounded-full bg-cobalt" />
                      <span className="h-1.5 flex-1 rounded-full bg-cobalt" />
                      <span className="h-1.5 flex-1 rounded-full bg-cobalt/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="display mt-5 text-[1.35rem]">Build the paper, not the busywork.</h3>
            <p className="mt-1.5 text-[0.8125rem] text-mute">
              Shape the pool with confidence and see its balance before anyone sits down.
            </p>
          </div>

          <div className="surface-card p-5">
            <div className="rounded-md border border-line bg-parchment/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                <p className="display text-[1rem]">ExamCore</p>
                <div className="flex items-center gap-2 text-[0.625rem]">
                  <span className="num rounded-[4px] bg-white px-2 py-1 text-cobalt">00 : 42 : 18</span>
                  <span className="rounded-[4px] bg-success-soft px-2 py-1 text-success">
                    ✓ All answers saved
                  </span>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-2.5">
                  <p className="text-[0.6875rem] text-mute">Your progress</p>
                  <p className="display text-[1.05rem]">20 questions. Your pace.</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <span
                        key={i}
                        className={`flex h-5 items-center justify-center rounded-[3px] text-[0.55rem] ${
                          i < 8
                            ? "bg-cobalt text-white"
                            : i === 3
                              ? "border-2 border-cobalt bg-tint text-cobalt"
                              : i === 5 || i === 10 || i === 17
                                ? "bg-warning-soft text-warning"
                                : "border border-line text-mute"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <p className="text-[0.625rem] text-mute">12 answered · 3 flagged · 5 left</p>
                </div>
                <div className="surface-card p-3">
                  <p className="text-[0.625rem] uppercase tracking-[0.08em] text-cobalt">
                    Question 4 of 20 · 2 marks
                  </p>
                  <p className="display mt-1.5 text-[1.1rem] leading-tight">
                    Choosing the right structure
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {["Queue — first in, first out", "Stack — last in, first out", "Graph — connected vertices"].map(
                      (option, i) => (
                        <div
                          key={option}
                          className={`flex items-center gap-2 rounded-[4px] border px-2 py-1.5 text-[0.625rem] ${
                            i === 1
                              ? "border-cobalt bg-tint text-cobalt"
                              : "border-line bg-surface text-ink"
                          }`}
                        >
                          <span
                            className={`size-2 rounded-full border ${
                              i === 1 ? "border-cobalt bg-cobalt" : "border-line"
                            }`}
                          />
                          {option}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
            <h3 className="display mt-5 text-[1.35rem]">A workspace that makes room to think.</h3>
            <p className="mt-1.5 text-[0.8125rem] text-mute">
              Clear progress, effortless autosave, and one honest answer to “what is saved?”
            </p>
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto w-full max-w-[1320px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Crosshair,
              title: "Clear before the clock starts",
              detail: "Instructions, duration, marks and what happens at the deadline — no surprises.",
            },
            {
              icon: LockKeyhole,
              title: "Useful context, not noise",
              detail: "Candidates see what they need. Examiners see the signals that matter.",
            },
            {
              icon: ShieldCheck,
              title: "Confidence beyond the score",
              detail: "Verified reports and stable records make results easy to trust.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="size-5 text-cobalt" strokeWidth={1.5} />
              <h3 className="mt-4 text-[0.9375rem] font-medium">{item.title}</h3>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-mute">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
            <div className="flex items-center justify-between bg-cobalt px-6 py-5 text-white">
              <div>
                <p className="text-[0.625rem] uppercase tracking-[0.1em] text-white/70">Verified result</p>
                <p className="display mt-1 text-[1.4rem]">Discrete Mathematics</p>
              </div>
              <span className="rounded-[4px] bg-white/15 px-2 py-1 text-[0.625rem]">80%</span>
            </div>
            <div className="flex items-center gap-8 px-6 py-6">
              <p className="num text-[2.4rem] leading-none text-ink">32 / 40</p>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[0.6875rem] text-mute">
                  <span>Passed</span>
                  <span>16 correct · 4 incorrect</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-tint">
                  <div className="h-full w-4/5 rounded-full bg-cobalt" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="eyebrow">Examination overview</p>
                <p className="display mt-1 text-[1.4rem]">Live control</p>
              </div>
              <span className="rounded-[4px] bg-success-soft px-2 py-1 text-[0.625rem] text-success">
                ongoing
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-line px-2 py-5 text-center">
              {[
                ["42", "active"],
                ["06", "submitted"],
                ["02", "offline"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="num text-[1.7rem] leading-none text-cobalt">{value}</p>
                  <p className="mt-1 text-[0.625rem] uppercase tracking-[0.08em] text-mute">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="eyebrow">Built around the work</p>
            <h2 className="display display-lg mt-4">
              The right tools.
              <br />
              For every role.
            </h2>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-mute">
              Separate responsibilities. A shared standard. Everyone gets the controls they
              need, and nothing they don&apos;t.
            </p>
            <p className="mt-6 text-[0.8125rem] text-mute">
              One account. Your assigned role.
            </p>
          </div>

          <div className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.title}
                className="grid gap-4 border border-line bg-surface p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                <p className="num text-[0.75rem] text-cobalt">{role.n}</p>
                <div>
                  <h3 className="display text-[1.5rem]">{role.title}</h3>
                  <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-mute">
                    {role.description}
                  </p>
                </div>
                <Link
                  href={role.href}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-cobalt/40 px-4 text-[0.75rem] font-medium text-cobalt transition-colors hover:bg-tint"
                >
                  {role.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-10 border-t border-line pt-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="eyebrow">A little more clarity</p>
            <h2 className="display display-lg mt-4">Before you begin.</h2>
            <p className="mt-4 max-w-sm text-[0.9375rem] text-mute">
              The practical details, without the small print.
            </p>
          </div>
          <div className="divide-y divide-line">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-[0.9375rem] text-ink marker:content-none">
                  {faq.q}
                  <span className="text-cobalt transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 max-w-xl text-[0.8125rem] leading-relaxed text-mute">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1320px] px-4 pb-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[4px] bg-cobalt px-6 py-16 text-center text-parchment">
          <div className="relative z-10 mx-auto max-w-2xl">
            <p className="text-[0.625rem] uppercase tracking-[0.14em] text-parchment/70">
              A better exam experience
            </p>
            <h2 className="display display-lg mt-4 text-parchment text-balance">
              Ready for a clearer
              <br />
              examination experience?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.875rem] text-parchment/80">
              Bring preparation, delivery and reflection into one connected workspace.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-parchment px-6 text-[0.875rem] font-medium text-cobalt hover:bg-white"
              >
                Log in to ExamCore
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-parchment/45 px-6 text-[0.875rem] text-parchment hover:bg-white/10"
              >
                Create an account
              </Link>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <footer className="mt-10 border-t border-line">
        <div className="mx-auto w-full max-w-[1320px] px-5 py-12 sm:px-8 lg:px-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="display text-[1.5rem] text-cobalt">ExamCore</p>
              <p className="mt-3 max-w-xs text-[0.8125rem] leading-relaxed text-mute">
                Secure examinations with clarity, integrity and control — from the first
                question to verified results.
              </p>
            </div>
            {[
              { title: "Platform", links: ["Overview", "Question bank", "Monitoring", "Analytics"] },
              { title: "For every role", links: ["Examiners", "Candidates", "Administrators"] },
              { title: "Trust", links: ["Verification", "Access control", "Reports"] },
            ].map((col) => (
              <div key={col.title}>
                <p className="meta-label">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <span className="text-[0.8125rem] text-mute">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <p className="text-[0.75rem] text-mute">© 2026 ExamCore · COMSATS University Lahore</p>
            <p className="inline-flex items-center gap-1.5 text-[0.75rem] text-mute">
              <Check className="size-3.5 text-success" /> Secure by design
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
