"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, ShieldCheck, TriangleAlert } from "lucide-react";
import { Logo } from "@/frontend/components/shell/AppShell";
import { fmtDate } from "@/frontend/lib/format";
import { apiGet } from "@/frontend/lib/api-client";
import type { VerifyResult } from "@/shared/types";

function VerifyInner() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  // Accept lower case and spaces ("c97l 57ll pj" -> "C97L57LLPJ").
  const code = decodeURIComponent(params.code ?? "").replace(/\s+/g, "").toUpperCase();
  const [loaded, setLoaded] = useState<{ code: string; result: VerifyResult | null; failed: boolean } | null>(null);
  const [typed, setTyped] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;
    apiGet<VerifyResult>(`/api/verify/${encodeURIComponent(code || "-")}`).then(
      (r) => alive && setLoaded({ code, result: r, failed: false }),
      () => alive && setLoaded({ code, result: null, failed: true }),
    );
    return () => {
      alive = false;
    };
  }, [code, retry]);

  const current = loaded?.code === code ? loaded : null;
  const result = current?.result ?? null;

  return (
    <div className="min-h-screen bg-parchment">
      <section className="glow-iris relative overflow-hidden bg-night pb-28 text-white">
        <div className="bg-dots-night pointer-events-none absolute inset-0" aria-hidden />
        <header className="relative mx-auto flex w-full max-w-[1180px] items-center justify-between gap-6 px-5 py-5 sm:px-8">
          <Logo />
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[0.8125rem] font-semibold text-[#0b0f1e] transition-transform hover:-translate-y-0.5"
          >
            Log in
          </Link>
        </header>
        <div className="relative mx-auto w-full max-w-[780px] px-5 pt-10 text-center sm:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-lime">
            <ShieldCheck className="size-3.5" /> Public report verification
          </p>
          <h1 className="display mt-5 text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.02] text-white">Trust, without oversharing.</h1>
          <p className="mx-auto mt-4 max-w-[460px] text-[0.9375rem] text-night-mute">
            Verify an issued report. No account or personal information required.
          </p>
        </div>
      </section>

      <main className="relative mx-auto -mt-20 w-full max-w-[780px] px-4 pb-16 sm:px-8">
        <div className="surface-card animate-rise p-5 shadow-pop sm:p-7">
          {current?.failed ? (
            <div className="py-8 text-center">
              <TriangleAlert className="mx-auto size-6 text-danger" />
              <p className="display display-sm mt-3">We could not check this code</p>
              <p className="mt-2 text-sm text-mute">No connection to the server. Try again in a moment.</p>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-cobalt hover:underline"
                onClick={() => {
                  setLoaded(null);
                  setRetry((r) => r + 1);
                }}
              >
                Retry
              </button>
            </div>
          ) : !result ? (
            <div className="space-y-4" aria-busy="true" aria-label="Verifying report">
              <div className="h-16 animate-pulse rounded-[12px] bg-line-soft" />
              <div className="h-4 w-1/3 animate-pulse rounded-[8px] bg-line-soft" />
              <div className="h-8 animate-pulse rounded-[8px] bg-line-soft" />
              <div className="h-4 w-1/3 animate-pulse rounded-[8px] bg-line-soft" />
              <div className="h-8 animate-pulse rounded-[8px] bg-line-soft" />
            </div>
          ) : result.valid ? (
            <>
              <div className="flex items-center gap-4 rounded-[16px] bg-success-soft px-5 py-4 text-success">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success text-white shadow-[0_8px_20px_-8px_var(--success)]">
                  <Check className="size-6" strokeWidth={3} />
                </span>
                <div>
                  <p className="display text-[1.5rem] leading-none tracking-[-0.03em]">Valid report</p>
                  <p className="mt-1 text-[0.8125rem] opacity-80">Issued by ExamCore and unchanged since.</p>
                </div>
              </div>

              <dl className="mt-2 divide-y divide-line-soft">
                <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className="meta-label">Examination</dt>
                  <dd className="text-[1.0625rem] text-ink">{result.examTitle}</dd>
                </div>
                <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className="meta-label">Candidate initials</dt>
                  <dd className="text-[1.0625rem] text-ink">{result.candidateInitials}</dd>
                </div>
                <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className="meta-label">Score</dt>
                  <dd className="text-[1.0625rem] text-ink">
                    <span className="num">
                      {result.score} / {result.totalMarks}
                    </span>
                    <span className="text-mute"> · </span>
                    <span className="num">{Math.round(result.percentage)}%</span>
                  </dd>
                </div>
                <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className="meta-label">Outcome</dt>
                  <dd className={result.passed ? "text-[1.0625rem] text-success" : "text-[1.0625rem] text-danger"}>
                    {result.passed ? "Passed" : "Not passed"}
                  </dd>
                </div>
                <div className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:items-baseline">
                  <dt className="meta-label">Issued</dt>
                  <dd className="text-[1.0625rem] text-ink">{fmtDate(result.issuedAt)}</dd>
                </div>
              </dl>

              <p className="mt-2 text-[0.8125rem] text-cobalt">
                Verification code:{" "}
                <span className="num">{code.toUpperCase()}</span>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-md bg-danger-soft px-5 py-4 text-danger">
                <TriangleAlert className="size-6 shrink-0" strokeWidth={1.8} />
                <p className="display text-[1.6rem] uppercase tracking-[0.02em]">
                  Report not found
                </p>
              </div>
              <p className="mt-6 text-[0.9375rem] leading-relaxed text-mute">
                No issued report matches this code. Check the code printed on the report and
                try again. Verification only confirms reports issued by this institution.
              </p>
              <p className="mt-4 text-[0.8125rem] text-cobalt">
                Code checked: <span className="num">{code.toUpperCase() || "—"}</span>
              </p>
            </>
          )}
        </div>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const next = typed.replace(/\s+/g, "").toUpperCase();
            if (next) router.push(`/verify/${encodeURIComponent(next)}`);
          }}
        >
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="verify-code" className="text-[0.8125rem] font-medium text-ink">
              Check another code
            </label>
            <input
              id="verify-code"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="e.g. C97L57LLPJ"
              maxLength={40}
              className="num h-11 w-full rounded-md border border-line bg-surface px-3.5 uppercase text-ink focus:border-cobalt"
            />
          </div>
          <button
            type="submit"
            className="h-11 rounded-md border border-cobalt bg-cobalt px-6 text-[0.9rem] font-medium text-on-cobalt hover:bg-cobalt-deep"
          >
            Verify
          </button>
        </form>

        <p className="mt-6 text-[0.8125rem] text-mute">
          Privacy first: only initials and the minimum report details are shown.
        </p>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-parchment px-6 py-16">
          <div className="mx-auto max-w-[780px] space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded-[8px] bg-line-soft" />
            <div className="h-64 animate-pulse rounded-[10px] bg-sand" />
          </div>
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
