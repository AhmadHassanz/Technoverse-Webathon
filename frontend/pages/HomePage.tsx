"use client";

// Landing page, built from Pngs/Public/Landing.png (1440 px design).
// Hero art and footer art are crops of that design (public/landing-*.jpg); everything else is live markup.

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUpRight, Flag, ShieldCheck, SlidersHorizontal, WifiOff } from "lucide-react";
import { roleHome, useAuth } from "@/frontend/lib/auth";

const NAV = [
  { label: "Platform", href: "#platform", x: 0 },
  { label: "How it works", href: "#how", x: 0 },
  { label: "For your institution", href: "#roles", x: 9 },
];

const PILLARS = ["Prepare with purpose", "Take with confidence", "Review with context", "Verify with trust"];

const STEPS = [
  { n: "01", title: "Reuse your best questions", note: "From a reusable question bank" },
  { n: "02", title: "Balance every paper", note: "With difficulty-aware blueprints" },
  { n: "03", title: "Keep every answer moving", note: "Even when the network drops" },
  { n: "04", title: "Publish a clearer result", note: "With feedback and a verified report" },
];

const FEATURES = [
  { icon: SlidersHorizontal, title: "Fairer papers", text: "Difficulty blueprints help keep randomised papers balanced." },
  { icon: ShieldCheck, title: "Time, held steady", text: "Visible timers and consistent deadlines keep every attempt on track." },
  { icon: WifiOff, title: "Progress, protected", text: "Autosave and local answer storage support connection interruptions." },
  { icon: Flag, title: "Indicators, not verdicts", text: "Review relevant events with context before taking action." },
];

const PROMISES = [
  { icon: ShieldCheck, title: "Clear before the clock starts", text: "Instructions, eligibility and schedules are visible before an attempt begins." },
  { icon: Flag, title: "Useful context, not noise", text: "Progress, connectivity and indicators help examiners review the full picture." },
  { icon: SlidersHorizontal, title: "Confidence beyond the score", text: "Feedback and verified reports make results easier to understand and trust." },
];

const ROLES = [
  { n: "01", title: "Examiner", sub: "Prepare & conduct", points: ["Question bank and balanced blueprints", "Live monitoring and announcements", "Grading, results and analytics"] },
  { n: "02", title: "Candidate", sub: "Take & reflect", points: ["Personal examination dashboard", "Focused, offline-aware workspace", "Feedback and verified reports"] },
  { n: "03", title: "Administrator", sub: "Manage & govern", points: ["Create and manage user accounts", "Assign institutional roles", "Activate or deactivate access"] },
];

const FAQS = [
  { q: "Can candidates keep working offline?", a: "Answers are stored on the device during a connection gap, then synced on reconnection. The examination timer continues." },
  { q: "Are indicators proof of misconduct?", a: "No. Indicators are a starting point for review, not a verdict. Examiners should consider context before taking action." },
  { q: "Who can see a candidate’s result?", a: "Candidates see their own results after publication. Examiners access only the examinations they are authorised to review." },
  { q: "How does report verification work?", a: "A unique report code confirms the exam, initials, score and date, without exposing the candidate’s full personal details." },
];

const WRAP = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 xl:px-16";

function LightButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-12 w-full max-w-[230px] items-center justify-center gap-2 rounded-[4px] bg-surface text-[0.875rem] text-cobalt transition-colors hover:bg-white sm:w-[230px] ${className}`}
    >
      {children}
    </Link>
  );
}

function GhostLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex h-12 items-center gap-2 px-2 text-[0.875rem] text-parchment transition-opacity hover:opacity-80">
      {children}
    </a>
  );
}

/** The blue "live workspace" card in the middle of the connected-experience diagram (420 x 444). */
function WorkspaceCard() {
  return (
    <div className="relative h-[444px] w-[420px] shrink-0 rounded-[6px] bg-cobalt text-on-cobalt max-sm:[zoom:0.8]">
      <div className="absolute left-2 right-2 top-2 flex h-12 items-center rounded-[3px] bg-surface px-3.5">
        <span className="display text-[1.4rem] leading-none text-cobalt">ExamCore</span>
        <span className="absolute left-[255px] text-[0.625rem] uppercase tracking-[0.04em] text-cobalt">Live workspace</span>
      </div>
      <p className="absolute left-6 top-[78px] text-[1.125rem] leading-6">Data Structures &amp; Algorithms</p>
      <p className="num absolute left-6 top-[112px] text-[1.875rem] leading-[40px]">00:42:18</p>
      <p className="absolute left-[236px] top-[122px] text-[0.75rem] leading-4">✓ All answers saved</p>
      <div className="absolute left-5 top-[173px] h-[208px] w-[380px] rounded-[4px] bg-surface">
        <p className="absolute left-4 top-[11px] text-[0.625rem] uppercase leading-4 tracking-[0.04em] text-cobalt">Question 4 of 20 · 2 marks</p>
        <p className="absolute left-4 top-[40px] text-[1rem] leading-6 text-ink">Which structure supports undo?</p>
        <div className="absolute left-4 top-[88px] flex h-[38px] w-[348px] items-center gap-2.5 rounded-[3px] border border-cobalt/40 bg-tint px-3.5 text-[0.8125rem] text-cobalt">
          <span className="size-2.5 rounded-full bg-cobalt" />
          Stack — last in, first out
        </div>
        <div className="absolute left-4 top-[136px] flex h-[38px] w-[348px] items-center gap-2.5 px-3.5 text-[0.8125rem] text-mute">
          <span className="size-2.5 rounded-full border border-mute/60" />
          Queue — first in, first out
        </div>
      </div>
      <div className="absolute left-5 top-[394px] flex gap-2.5">
        {["01", "02", "03", "04", "05"].map((n) => (
          <span key={n} className="num flex h-8 w-[43px] items-center justify-center rounded-[4px] border border-white/70 text-[0.75rem]">
            {n}
          </span>
        ))}
      </div>
      <p className="absolute left-[328px] top-[403px] text-[0.75rem] leading-5">Next →</p>
    </div>
  );
}

function StepPill({ n, title, className = "" }: { n: string; title: string; className?: string }) {
  return (
    <span className={`flex h-12 w-[302px] items-center gap-3 rounded-full bg-cobalt px-[18px] text-[0.875rem] text-on-cobalt ${className}`}>
      <span className="opacity-90">{n}</span>
      {title}
    </span>
  );
}

function Connected() {
  return (
    <>
      {/* ≥1280 px: the exact floating diagram */}
      <div className="relative hidden h-[444px] xl:-mx-16 xl:block xl:w-[calc(100%+8rem)]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 444" preserveAspectRatio="none" fill="none" aria-hidden>
          {[
            "M366 74 C 440 74, 440 129, 510 129",
            "M412 318 C 470 312, 450 293, 510 293",
            "M1054 74 C 990 74, 990 129, 930 129",
            "M930 293 C 990 293, 1000 368, 1054 368",
          ].map((d) => (
            <path key={d} d={d} stroke="#0046cf" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <WorkspaceCard />
        </div>
        <StepPill {...STEPS[0]} className="absolute left-[4.44%] top-[50px]" />
        <p className="absolute left-[4.72%] top-[113px] text-[0.8125rem] leading-5 text-mute">{STEPS[0].note}</p>
        <StepPill {...STEPS[1]} className="absolute left-[7.64%] top-[298px]" />
        <p className="absolute left-[7.92%] top-[362px] text-[0.8125rem] leading-5 text-mute">{STEPS[1].note}</p>
        <StepPill {...STEPS[2]} className="absolute right-[5.83%] top-[50px]" />
        <p className="absolute right-[5.83%] top-[113px] w-[302px] pl-1 text-[0.8125rem] leading-5 text-mute">{STEPS[2].note}</p>
        <StepPill {...STEPS[3]} className="absolute right-[5.83%] top-[344px]" />
        <p className="absolute right-[5.83%] top-[407px] w-[302px] pl-1 text-[0.8125rem] leading-5 text-mute">{STEPS[3].note}</p>
      </div>
      {/* smaller screens: card, then the four steps */}
      <div className="xl:hidden">
        <div className="flex justify-center">
          <WorkspaceCard />
        </div>
        <ul className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n}>
              <StepPill n={s.n} title={s.title} className="max-w-full" />
              <p className="mt-2 pl-1 text-[0.8125rem] text-mute">{s.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function FeatureCell({ icon: Icon, title, text }: (typeof FEATURES)[number]) {
  return (
    <div className="relative mx-auto h-[235px] w-[259px]">
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <span
          key={k}
          aria-hidden
          className="absolute border border-ink/[0.07]"
          style={{ left: 5 * k, top: 25 - 5 * k, width: 259 - 10 * k, height: 119 - 10 * k }}
        />
      ))}
      <Icon className="absolute left-[120px] top-[43px] size-5 text-cobalt" strokeWidth={2} aria-hidden />
      <h3 className="display absolute inset-x-0 top-[122px] text-center text-[1.5625rem] leading-7 text-cobalt">{title}</h3>
      <p className="absolute inset-x-0 top-[162px] text-center text-[0.8125rem] leading-[18px] text-mute">{text}</p>
      <span className="absolute left-[106px] top-[229px] h-0.5 w-[46px] bg-cobalt" aria-hidden />
    </div>
  );
}

function Caption({ title, children, tight }: { title: string; children: React.ReactNode; tight?: boolean }) {
  return (
    <div className={`mx-auto max-w-[460px] text-center ${tight ? "mt-[30px]" : "mt-[34px]"}`}>
      <h3 className="display text-[1.8125rem] leading-8 text-cobalt">{title}</h3>
      <p className="mt-3.5 text-[0.875rem] leading-5 text-mute">{children}</p>
    </div>
  );
}

const DOTS =
  "bg-[radial-gradient(circle,rgba(19,40,70,0.14)_1px,transparent_1.2px)] [background-size:20px_20px] [background-position:12px_14px]";

export default function HomePage() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && me) router.replace(roleHome(me.role));
  }, [loading, me, router]);

  return (
    <div className="min-h-screen overflow-x-clip bg-parchment text-ink">
      {/* ---------------- hero ---------------- */}
      <section className="bg-cobalt text-on-cobalt">
        <header className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 xl:px-[52px]">
          <div className="relative flex h-[100px] items-center justify-between border-b border-parchment/25 pt-2">
            <Link href="/" className="display relative -top-[3px] text-[2rem] leading-none text-parchment">
              <span className="text-[2.3rem] text-parchment">ExamCore</span>
            </Link>
            <nav className="absolute left-[calc(50%-135px)] top-[44px] hidden items-center gap-[65px] xl:flex" aria-label="Landing">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} style={{ marginLeft: item.x }} className="text-[0.875rem] leading-5 text-on-cobalt/90 hover:text-on-cobalt">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-[54px]">
              <Link href="/login" className="hidden text-[0.875rem] text-on-cobalt/90 hover:text-on-cobalt sm:block">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-[47px] w-[166px] items-center justify-center gap-2 rounded-[4px] bg-surface text-[0.875rem] text-cobalt transition-colors hover:bg-white"
              >
                Create account <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[900px] px-5 pb-[10px] pt-[44px] text-center">
          <p className="text-[0.75rem] uppercase leading-4 tracking-[0.15em] text-parchment/85">Focus on what you know.</p>
          <h1 className="mt-5 text-parchment">
            <span className="block text-[clamp(2.75rem,4.9vw,4.375rem)] font-light leading-[1.2] tracking-[-0.02em] sm:leading-[102px]">Exams that let</span>
            <span className="display block text-[clamp(3.25rem,7.5vw,6.75rem)] leading-[1.05] text-parchment sm:leading-[105px]">knowledge speak.</span>
          </h1>
          <p className="mx-auto mt-[23px] max-w-[520px] text-[1.1875rem] leading-[25px] text-parchment">
            Create, take and assess online examinations with clarity, fairness and resilience.
          </p>
          <div className="mt-[37px] flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-[27px]">
            <LightButton href="/login" className="w-[230px]">
              Log in to ExamCore <ArrowUpRight className="size-3.5" />
            </LightButton>
            <GhostLink href="#platform">
              Explore the platform <ArrowDown className="size-3.5" />
            </GhostLink>
          </div>
        </div>
      </section>

      <Image src="/landing-hero.jpg" alt="A candidate sitting calmly at a desk in the centre of concentric rings. A calm place to demonstrate your best." width={1440} height={575} priority className="block h-auto w-full" />

      {/* ---------------- pillars ---------------- */}
      <section className={`${WRAP} pt-[14px]`}>
        <p className="text-center text-[0.6875rem] uppercase tracking-[0.08em] text-mute">One connected examination experience</p>
        <div className="mx-auto mt-9 grid max-w-[1376px] grid-cols-2 gap-y-6 xl:grid-cols-4 min-[1440px]:ml-[-42px] min-[1440px]:w-[1376px] min-[1440px]:max-w-none">
          {PILLARS.map((p, i) => (
            <div key={p} className="relative flex h-6 items-center justify-center">
              {i > 0 && <span aria-hidden className={`absolute left-0 h-6 w-px bg-cobalt ${i % 2 === 0 ? "max-xl:hidden" : ""}`} />}
              <span className="display text-[1.3125rem] leading-6 text-cobalt xl:pl-5">{p}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- connected diagram ---------------- */}
      <section id="platform" className={`${WRAP} pt-[96px]`}>
        <Connected />
        <div className="mt-[39px] text-center">
          <h2 className="display text-[clamp(2.25rem,3.5vw,3.125rem)] leading-[52px] text-cobalt">One exam. Every part connected.</h2>
          <p className="mt-2.5 text-[1rem] leading-6 text-mute">From the first question to the final report, nothing works in isolation.</p>
        </div>

        <div className="mx-auto mt-[90px] grid max-w-[1320px] gap-10 md:grid-cols-3 md:gap-0">
          {[
            { big: "03", title: "Purpose-built roles", detail: "Administrator · Examiner · Candidate" },
            { big: "03", title: "Ways to show knowledge", detail: "Single answer · Multiple select · Written" },
            { big: "Offline-ready", title: "Confidence through disruption", detail: "Local saving · Clear status · Reconnection" },
          ].map((s, i) => (
            <div key={s.title} className="relative flex flex-col items-center gap-2 text-center md:block md:h-[112px]">
              {i > 0 && <span aria-hidden className="absolute left-0 top-0 hidden h-full w-px bg-cobalt md:block" />}
              {s.big === "03" ? (
                <p className="num text-[3.25rem] leading-[40px] text-cobalt md:absolute md:inset-x-0 md:-top-[3px]">{s.big}</p>
              ) : (
                <p className="display text-[2.7rem] leading-[34px] text-cobalt md:absolute md:inset-x-0 md:-top-[9px]">{s.big}</p>
              )}
              <p className="display text-[1.1875rem] leading-7 text-cobalt md:absolute md:inset-x-0 md:top-[58px]">{s.title}</p>
              <p className="text-[0.75rem] leading-4 text-mute md:absolute md:inset-x-0 md:top-[100px]">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- less friction ---------------- */}
      <section className={`${WRAP} pt-[149px]`}>
        <div className="grid gap-12 xl:grid-cols-[minmax(0,604px)_591px] xl:gap-x-16">
          <div className="xl:pt-[83px]">
            <p className="eyebrow !tracking-[0.02em]">Made for the exam hall</p>
            <h2 className="display mt-[30px] text-[clamp(2.75rem,4.7vw,4.25rem)] leading-[1.32] text-cobalt xl:leading-[90px]">
              Less friction.
              <br />
              More focus.
            </h2>
            <p className="mt-5 pl-1 text-[1rem] leading-6 text-mute">
              The important work is already demanding.
              <br />
              Your examination platform shouldn’t be.
            </p>
            <a href="#how" className="mt-[43px] inline-flex items-center gap-1.5 pl-1 text-[0.8125rem] leading-5 text-cobalt hover:underline">
              Explore your workspace <ArrowUpRight className="size-3" />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-y-[50px] sm:grid-cols-2 sm:gap-x-[73px]">
            {FEATURES.map((f) => (
              <FeatureCell key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- clearer view ---------------- */}
      <section id="how" className={`${WRAP} pt-[91px]`}>
        <div className="text-center">
          <p className="eyebrow !tracking-[0.02em]">Explore the platform</p>
          <h2 className="display mt-[31px] text-[clamp(2.25rem,3.8vw,3.4rem)] leading-[52px] text-cobalt">A clearer view, at every step.</h2>
          <p className="mt-3 text-[1rem] leading-6 text-mute">Considered tools for the people preparing, taking and reviewing every examination.</p>
        </div>

        <div className="mt-[54px] grid gap-12 xl:grid-cols-2 xl:gap-x-12">
          <div>
            <div className={`relative h-[280px] overflow-hidden bg-sand ${DOTS}`}>
              <div className="absolute left-7 top-[27px] h-[223px] w-[min(342px,calc(100%-272px))] rounded-[6px] border border-line bg-surface max-sm:hidden">
                <p className="display absolute left-3.5 top-[11px] text-[1.375rem] leading-7 text-cobalt">Question bank</p>
                <p className="absolute left-3.5 top-[48px] text-[0.5625rem] leading-3 text-mute">TOPIC&nbsp; All topics&nbsp;&nbsp; DIFFICULTY&nbsp; All</p>
                {[
                  ["Binary search complexity", "Easy"],
                  ["Properties of a balanced tree", "Medium"],
                  ["Resolving hash collisions", "Hard"],
                ].map(([t, d], i) => (
                  <div key={t} className="absolute left-3.5 right-3.5 flex items-center justify-between text-[0.75rem]" style={{ top: 83 + i * 47 }}>
                    <span className="text-ink">{t}</span>
                    <span className="mr-[34px] text-[0.625rem] text-cobalt">{d}</span>
                  </div>
                ))}
              </div>
              <div className="absolute right-[30px] top-[52px] h-[195px] w-[211px] rounded-[6px] border border-line bg-surface max-sm:left-4 max-sm:right-4 max-sm:top-5 max-sm:w-auto">
                <p className="display absolute left-3.5 top-3 text-[1.125rem] leading-6 text-cobalt">Balanced blueprint</p>
                {[
                  ["Easy", "4 / 6", 66],
                  ["Medium", "10 / 12", 83],
                  ["Hard", "6 / 7", 86],
                ].map(([l, v, w], i) => (
                  <div key={l as string} className="absolute left-3.5 right-3.5" style={{ top: 49 + i * 39 }}>
                    <p className="text-[0.6875rem] leading-4 text-ink">
                      {l}&nbsp;&nbsp; {v}
                    </p>
                    <div className="mt-1.5 h-1 rounded-full bg-tint">
                      <div className="h-1 rounded-full bg-cobalt" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                ))}
                <p className="absolute left-3.5 top-[170px] text-[0.6875rem] leading-4 text-cobalt">40 / 40 marks ✓</p>
              </div>
            </div>
            <Caption title="Build the paper, not the busywork.">
              Reuse well-crafted questions and set a difficulty blueprint
              <br className="max-sm:hidden" /> that makes variation more deliberate.
            </Caption>
          </div>

          <div>
            <div className={`relative h-[280px] overflow-hidden bg-sand ${DOTS}`}>
              <div className="absolute inset-x-4 top-[24px] h-[234px] overflow-hidden rounded-[3px] bg-surface xl:inset-x-[37px]">
                <div className="flex h-[42px] items-center justify-between bg-cobalt px-3.5 text-on-cobalt">
                  <span className="display text-[1.25rem] leading-none text-on-cobalt">ExamCore</span>
                  <span className="num text-[0.875rem]">00:42:18</span>
                  <span className="text-[0.6875rem]">All saved ✓</span>
                </div>
                <div className="absolute left-2.5 top-[57px] h-[165px] w-[94px] bg-sand px-2.5 pt-3 max-sm:hidden">
                  <p className="text-[0.5625rem] uppercase text-mute">Questions</p>
                  <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2.5">
                    {["01", "02", "03", "04", "05", "06"].map((n) => (
                      <span key={n} className="num flex h-7 w-[33px] items-center justify-center rounded-[4px] bg-cobalt text-[0.6875rem] text-on-cobalt">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="absolute left-[123px] right-[22px] top-[57px] max-sm:left-4">
                  <p className="text-[0.625rem] uppercase leading-4 text-cobalt">Question 4 of 20 · 2 marks</p>
                  <p className="display mt-2.5 text-[1.125rem] leading-6 text-ink">Which structure supports undo?</p>
                  <div className="mt-[16px] flex h-[38px] items-center gap-2.5 rounded-[3px] border border-cobalt/60 bg-tint px-3.5 text-[0.75rem] text-cobalt">
                    <span className="size-2 rounded-full bg-cobalt" /> Stack — last in, first out
                  </div>
                  <div className="mt-[10px] flex h-[38px] items-center gap-2.5 px-3.5 text-[0.75rem] text-mute">
                    <span className="size-2 rounded-full border border-mute/60" /> Queue — first in, first out
                  </div>
                </div>
              </div>
            </div>
            <Caption title="A workspace that makes room to think.">
              Readable timing, clear navigation and automatic saving.
              <br className="max-sm:hidden" /> The essentials stay visible; distractions stay out.
            </Caption>
          </div>
        </div>

        <div className="mt-[77px] grid gap-10 md:grid-cols-3 xl:grid-cols-[minmax(0,454px)_minmax(0,454px)_minmax(0,404px)]">
          {PROMISES.map((p) => (
            <div key={p.title}>
              <p.icon className="size-[22px] text-cobalt" strokeWidth={1.5} aria-hidden />
              <h3 className="display mt-[38px] text-[1.5rem] leading-7 text-cobalt">{p.title}</h3>
              <p className="mt-[19px] max-w-[252px] text-[0.875rem] leading-5 text-mute">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-[69px] grid gap-12 xl:grid-cols-2 xl:gap-x-12">
          <div>
            <div className="relative flex h-[250px] items-center justify-center bg-cobalt px-5">
              <div className="relative h-[196px] w-full max-w-[462px] bg-surface">
                <p className="absolute left-5 top-[19px] text-[0.5625rem] uppercase leading-3 text-mute">Your published result</p>
                <p className="num absolute left-5 top-[48px] text-[2.5rem] leading-[54px] text-cobalt">32 / 40</p>
                <p className="absolute left-5 top-[104px] text-[0.8125rem] leading-4 text-success">80%&nbsp; ·&nbsp; Passed</p>
                <p className="display absolute left-[249px] top-[54px] text-[1.25rem] leading-6 text-ink max-sm:hidden">Discrete Mathematics</p>
                <p className="absolute left-[249px] top-[96px] text-[0.75rem] leading-4 text-mute max-sm:hidden">16 correct · 4 incorrect</p>
                <p className="absolute inset-x-4 top-[145px] flex h-[33px] items-center rounded-[3px] bg-tint px-2.5 text-[0.75rem] uppercase text-cobalt">
                  ✓&nbsp; Valid report&nbsp;&nbsp;&nbsp;&nbsp; EC-26-7F3A9
                </p>
              </div>
            </div>
            <Caption tight title="A result you can understand. And verify.">
              See the marking decision, learn from feedback and download
              <br className="max-sm:hidden" /> a report with privacy-conscious public verification.
            </Caption>
          </div>
          <div>
            <div className="relative flex h-[250px] items-center justify-center bg-cobalt px-5">
              <div className="relative h-[196px] w-full max-w-[556px] bg-surface">
                <p className="display absolute left-[18px] top-[15px] text-[1.25rem] leading-6 text-cobalt">Examination overview</p>
                <p className="absolute right-[46px] top-[17px] text-[0.625rem] uppercase text-cobalt">Live</p>
                {[
                  ["42", "Active", 24],
                  ["06", "Submitted", 201],
                  ["02", "Offline", 378],
                ].map(([n, l, x]) => (
                  <div key={l as string} className="absolute top-[56px]" style={{ left: x as number }}>
                    <p className="num text-[2rem] leading-[36px] text-cobalt">{n}</p>
                    <p className="mt-[3px] text-[0.6875rem] leading-4 text-mute">{l}</p>
                  </div>
                ))}
                <p className="absolute inset-x-[17px] top-[139px] flex h-[38px] items-center rounded-[3px] bg-tint px-3 text-[0.75rem] text-cobalt">Indicators — review before acting</p>
              </div>
            </div>
            <Caption tight title="The right context, while it still matters.">
              Follow active attempts, review indicators and send
              <br className="max-sm:hidden" /> announcements without losing the wider view.
            </Caption>
          </div>
        </div>
      </section>

      {/* ---------------- roles ---------------- */}
      <section id="roles" className={`${WRAP} pt-[109px]`}>
        <div className="grid gap-10 xl:grid-cols-[minmax(0,624px)_minmax(0,688px)] xl:gap-x-0">
          <div className="xl:pt-[67px]">
            <p className="eyebrow !tracking-[0.02em]">Purpose-built, not one-size-fits-all</p>
            <h2 className="display mt-[41px] text-[clamp(2.75rem,4.4vw,3.9375rem)] leading-[1.3] text-cobalt xl:leading-[87px]">
              The right tools.
              <br />
              For every role.
            </h2>
            <p className="mt-[14px] max-w-[380px] pl-1 text-[1rem] leading-[22px] text-mute">
              Separate responsibilities. A shared standard. Everyone gets the space and access they need.
            </p>
            <p className="mt-[60px] pl-1 text-[0.75rem] text-cobalt">One account. Your assigned role.</p>
          </div>
          <div>
            {ROLES.map((r) => (
              <div key={r.n} className="relative min-h-[192px] border-t border-line py-0 max-sm:pb-8">
                <span className="num absolute left-0 top-7 text-[0.6875rem] leading-4 text-cobalt">{r.n}</span>
                <div className="absolute left-[47px] top-0 sm:static sm:grid sm:grid-cols-[47px_292px_1fr]">
                  <span className="max-sm:hidden" />
                  <div className="max-sm:relative max-sm:left-0 max-sm:pl-[47px]">
                    <h3 className="display mt-6 text-[2rem] leading-[34px] text-cobalt">{r.title}</h3>
                    <p className="mt-[11px] text-[0.8125rem] leading-4 text-mute">{r.sub}</p>
                    <Link href="/login" className="mt-[24px] inline-flex h-12 w-[145px] items-center justify-center gap-2 rounded-[4px] bg-cobalt text-[0.875rem] text-on-cobalt transition-colors hover:bg-cobalt-deep">
                      Log in <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                  <ul className="mt-[26px] space-y-0 text-[0.8125rem] leading-[18px] text-ink max-sm:pl-[47px] max-sm:pt-4">
                    {r.points.map((pt) => (
                      <li key={pt}>✓ {pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- faq ---------------- */}
      <section className={`${WRAP} pb-[36px] pt-[95px]`}>
        <div className="grid gap-10 xl:grid-cols-[minmax(0,624px)_minmax(0,688px)] xl:gap-x-0">
          <div className="xl:pt-[22px]">
            <p className="eyebrow !tracking-[0.02em]">A little more clarity</p>
            <h2 className="display mt-[31px] text-[clamp(2.5rem,3.8vw,3.4rem)] leading-[1.3] text-cobalt">Before you begin.</h2>
            <p className="mt-[19px] max-w-[380px] pl-1 text-[1rem] leading-6 text-mute">The practical details, without the small print.</p>
          </div>
          <div>
            {FAQS.map((f) => (
              <div key={f.q} className="min-h-[119px] border-t border-line pt-5">
                <h3 className="display text-[1.25rem] leading-[22px] text-cobalt">{f.q}</h3>
                <p className="mt-[13px] max-w-[365px] text-[0.875rem] leading-[18px] text-mute">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- closing + footer ---------------- */}
      <section className="bg-cobalt text-on-cobalt">
        <div className={`${WRAP} text-center`}>
          <p className="pt-[65px] text-[0.6875rem] uppercase tracking-[0.06em] text-parchment/85">A better space for what you know</p>
          <h2 className="display mt-[28px] text-[clamp(2.75rem,4.8vw,4.3125rem)] leading-[1.3] text-parchment xl:leading-[92px]">
            Ready for a clearer
            <br />
            examination experience?
          </h2>
          <p className="mt-[18px] text-[1.0625rem] leading-[26px] text-parchment">Bring preparation, delivery and reflection into one connected experience.</p>
          <div className="mt-[34px] flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-11">
            <LightButton href="/login">
              Log in to ExamCore <ArrowUpRight className="size-3.5" />
            </LightButton>
            <Link href="/signup" className="inline-flex h-12 items-center gap-2 text-[0.875rem] text-parchment hover:opacity-80 sm:pr-5">
              Create an account <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <footer className={`${WRAP} mt-[57px] border-t border-parchment/30 pb-[23px] pt-[52px] xl:[&]:max-w-[1440px]`}>
          <div className="grid gap-10 text-left sm:grid-cols-2 xl:grid-cols-[506px_280px_280px_280px] xl:gap-x-0">
            <div>
              <p className="display text-[2.4rem] leading-[34px] text-parchment">ExamCore</p>
              <p className="mt-[19px] pl-1 text-[0.875rem] leading-5 text-parchment">
                Exams that let knowledge speak.
                <br />
                A calmer, more considered way to
                <br />
                create, take and assess examinations.
              </p>
            </div>
            {[
              { h: "Platform", links: [["Question bank", "/login"], ["Exam workspace", "/login"], ["Results & analytics", "/login"]] },
              { h: "For every role", links: [["Examiners", "/login"], ["Candidates", "/login"], ["Administrators", "/login"]] },
              { h: "Your account", links: [["Log in", "/login"], ["Create account", "/signup"], ["Verify a report", "/verify/C97L57LLPJ"]] },
            ].map((col) => (
              <div key={col.h}>
                <p className="text-[0.875rem] leading-5 text-parchment">{col.h}</p>
                <ul className="mt-[25px] space-y-[17px] text-[0.8125rem] leading-5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-parchment hover:underline">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </footer>
        <Image src="/landing-footer.jpg" alt="" aria-hidden width={1440} height={390} loading="eager" className="block h-auto w-full" />
      </section>
    </div>
  );
}
