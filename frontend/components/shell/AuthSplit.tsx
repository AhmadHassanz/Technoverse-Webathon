import type { ReactNode } from "react";
import { CloudOff, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { Logo } from "./AppShell";

const POINTS = [
  { icon: CloudOff, title: "Offline-proof", text: "Answers are kept on the device and sync when the network returns." },
  { icon: Timer, title: "Server-timed", text: "One honest clock for everyone, with fair compensation for outages." },
  { icon: ShieldCheck, title: "Verifiable", text: "Every published result ships with a QR-verified report." },
];

export function AuthSplit({ headline, children }: { headline: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="glow-iris relative hidden overflow-hidden bg-night px-12 py-10 text-white lg:flex lg:flex-col">
        <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative mt-[12vh] max-w-[520px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-lime">
            <Sparkles className="size-3.5" /> Secure examination platform
          </p>
          <h1 className="display mt-6 whitespace-pre-line text-[clamp(2.6rem,4.2vw,3.9rem)] leading-[1] text-white">
            {headline}
          </h1>
        </div>

        <div className="relative mt-auto grid gap-3 pt-12">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-[16px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-lime/15 text-lime">
                <Icon className="size-[18px]" />
              </span>
              <div>
                <p className="text-[0.875rem] font-semibold">{title}</p>
                <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-night-mute">{text}</p>
              </div>
            </div>
          ))}
          <p className="mt-4 text-[0.75rem] text-night-mute">COMSATS University Lahore · Technoverse 5.0</p>
        </div>
      </aside>

      <div className="relative flex min-h-screen flex-col">
        <div className="glow-iris relative overflow-hidden bg-night px-5 pb-16 pt-5 text-white lg:hidden">
          <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <Logo />
            <h1 className="display mt-8 whitespace-pre-line text-[2.1rem] leading-[1.02] text-white">{headline}</h1>
          </div>
        </div>
        <main className="relative -mt-10 flex flex-1 items-start justify-center px-4 pb-10 sm:px-10 lg:mt-0 lg:items-center lg:py-12">
          <div className="animate-rise w-full max-w-[440px] rounded-[22px] border border-line bg-surface p-6 shadow-pop sm:p-9 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {children}
          </div>
        </main>
        <p className="px-6 pb-8 text-center text-[0.75rem] text-mute">
          Secure access · Your role is managed by your institution.
        </p>
      </div>
    </div>
  );
}
