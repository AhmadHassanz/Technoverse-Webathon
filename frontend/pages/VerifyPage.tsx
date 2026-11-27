"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, TriangleAlert } from "lucide-react";
import { fmtDate } from "@/frontend/lib/format";
import { MOCK_VERIFY } from "@/frontend/lib/mock";
import type { VerifyResult } from "@/shared/types";

function VerifyInner() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!code || /invalid|unknown|missing/i.test(code)) {
        setResult({ valid: false });
      } else {
        setResult(MOCK_VERIFY);
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [code]);

  return (
    <div className="min-h-screen bg-parchment">
      <header className="mx-auto flex w-full max-w-[1180px] items-end justify-between gap-6 px-5 pb-3 pt-7 sm:px-8">
        <div>
          <Link href="/" className="display text-[1.75rem] leading-none text-cobalt">
            ExamCore
          </Link>
          <p className="mt-2 text-[0.625rem] uppercase tracking-[0.12em] text-mute">
            Public report verification
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-6 text-[0.8125rem] font-medium text-cobalt transition-colors hover:border-cobalt/50"
        >
          Log in
        </Link>
      </header>
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
        <div className="h-px w-full bg-line" />
      </div>

      <main className="mx-auto w-full max-w-[780px] px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="display display-lg text-balance">Trust, without oversharing.</h1>
        <p className="mt-4 text-[0.9375rem] text-mute">
          Verify an issued report. No account or personal information required.
        </p>

        <div className="surface-card mt-9 p-5 sm:p-7">
          {!result ? (
            <div className="space-y-4" aria-busy="true" aria-label="Verifying report">
              <div className="h-16 animate-pulse rounded-md bg-sand" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-sand" />
              <div className="h-8 animate-pulse rounded bg-sand" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-sand" />
              <div className="h-8 animate-pulse rounded bg-sand" />
            </div>
          ) : result.valid ? (
            <>
              <div className="flex items-center gap-3 rounded-md bg-success-soft px-5 py-4 text-success">
                <Check className="size-6 shrink-0" strokeWidth={2} />
                <p className="display text-[1.6rem] uppercase tracking-[0.02em]">
                  Valid report
                </p>
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
            <div className="h-10 w-2/3 animate-pulse rounded bg-sand" />
            <div className="h-64 animate-pulse rounded-[10px] bg-sand" />
          </div>
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
