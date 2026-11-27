import type { ReactNode } from "react";
import { CloudOff, ShieldCheck, Timer } from "lucide-react";
import { Logo } from "./AppShell";

const POINTS = [
  { icon: CloudOff, title: "Offline-proof", text: "Answers are kept on the device and sync when the network returns." },
  { icon: Timer, title: "Server-timed", text: "One honest clock for everyone, with fair compensation for outages." },
  { icon: ShieldCheck, title: "Verifiable", text: "Every published result ships with a QR-verified report." },
];

export function AuthSplit({ headline, children }: { headline: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:p-3">
      <aside className="glow-iris relative hidden overflow-hidden rounded-[24px] px-12 py-10 text-lime lg:flex lg:flex-col">
        <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative mt-[14vh] max-w-[520px]">
          <h1 className="display whitespace-pre-line text-[clamp(2.8rem,4.4vw,4.1rem)] leading-[1.02] text-lime">
            {headline}
          </h1>
          <p className="mt-5 max-w-[380px] text-[1.0625rem] leading-relaxed text-night-mute">
            A secure examination platform for COMSATS University Lahore.
          </p>
        </div>

        <ul className="relative mt-auto divide-y divide-night-line border-t border-night-line">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-4 py-4">
              <Icon className="mt-0.5 size-[18px] shrink-0 text-night-mute" strokeWidth={1.7} />
              <div>
                <p className="text-[0.9375rem] font-medium text-lime">{title}</p>
                <p className="mt-0.5 text-[0.875rem] leading-relaxed text-night-mute">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <div className="relative flex min-h-screen flex-col lg:min-h-0">
        <div className="glow-iris relative overflow-hidden px-5 pb-16 pt-5 text-lime lg:hidden">
          <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <Logo />
            <h1 className="display mt-9 whitespace-pre-line text-[2.3rem] leading-[1.04] text-lime">{headline}</h1>
          </div>
        </div>
        <main className="relative -mt-10 flex flex-1 items-start justify-center px-4 pb-10 sm:px-10 lg:mt-0 lg:items-center lg:py-12">
          <div className="animate-rise w-full max-w-[420px] rounded-[24px] border border-line bg-surface p-6 shadow-pop sm:p-9 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {children}
          </div>
        </main>
        <p className="px-6 pb-8 text-center text-[0.8125rem] text-mute">
          Secure access. Your role is managed by your institution.
        </p>
      </div>
    </div>
  );
}
