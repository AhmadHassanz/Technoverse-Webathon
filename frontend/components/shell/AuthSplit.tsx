import Link from "next/link";
import type { ReactNode } from "react";

export function AuthSplit({
  headline,
  children,
}: {
  headline: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment lg:grid lg:grid-cols-[43%_57%]">
      <aside className="relative hidden overflow-hidden bg-cobalt px-12 py-11 text-parchment lg:flex lg:flex-col">
        <div>
          <Link href="/" className="display text-[1.9rem] leading-none text-parchment">
            ExamCore
          </Link>
          <p className="mt-4 text-[0.625rem] uppercase tracking-[0.12em] text-parchment/75">
            Secure examination management
          </p>
        </div>

        <div className="mt-[16vh]">
          <h1 className="display display-xl whitespace-pre-line text-parchment">{headline}</h1>
        </div>

        <div className="mt-auto">
          <div className="h-px w-full max-w-[520px] bg-parchment/45" />
          <div className="mt-6 grid grid-cols-[2.5rem_1fr] gap-4">
            <p className="num text-[0.8125rem] text-parchment/70">01</p>
            <div>
              <p className="text-[0.9375rem] text-parchment">Built for focus. Designed for trust.</p>
              <p className="mt-3 max-w-sm text-[0.8125rem] leading-relaxed text-parchment/80">
                A calm, reliable space for every stage of an examination—from the first
                question to verified results.
              </p>
            </div>
          </div>
          <p className="mt-14 text-[0.75rem] text-parchment/75">COMSATS University Lahore</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="bg-cobalt px-6 py-5 text-parchment lg:hidden">
          <Link href="/" className="display text-[1.5rem]">
            ExamCore
          </Link>
          <p className="mt-1 text-[0.5625rem] uppercase tracking-[0.12em] text-parchment/70">
            Secure examination management
          </p>
        </div>
        <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
        <p className="px-6 pb-8 text-center text-[0.75rem] text-mute">
          Secure access · Your role is managed by your institution.
        </p>
      </div>
    </div>
  );
}
