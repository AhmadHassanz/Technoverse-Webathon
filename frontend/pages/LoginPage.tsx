"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Field, Input } from "@/frontend/components/ui";
import { AuthSplit } from "@/frontend/components/shell/AuthSplit";
import { roleHome, useAuth } from "@/frontend/lib/auth";
import { errorMessage, toApiError } from "@/frontend/lib/api-client";
import { zodFields } from "@/frontend/lib/forms";
import { loginSchema } from "@/shared/validation";

// Real seeded demo accounts (password Demo@1234), so judges can try each role.
const DEMO_ACCOUNTS = [
  { role: "admin", label: "Administrator", email: "admin@demo.com" },
  { role: "examiner", label: "Examiner", email: "examiner@demo.com" },
  { role: "candidate", label: "Candidate", email: "ali@demo.com" },
];

export default function LoginPage() {
  const { me, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && me) router.replace(roleHome(me.role));
  }, [loading, me, router]);

  async function submit(nextEmail = email, nextPassword = password) {
    setError(null);
    const parsed = loginSchema.safeParse({ email: nextEmail, password: nextPassword });
    if (!parsed.success) {
      setFields(zodFields(parsed.error));
      return;
    }
    setFields({});
    setBusy(true);
    try {
      const account = await login(parsed.data);
      router.replace(roleHome(account.role));
    } catch (err) {
      const e = toApiError(err);
      if (e.fields) setFields(e.fields);
      setError(e.status === 401 ? "Email or password is incorrect." : errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <AuthSplit
      headline={"A clear mind.\n\nA fair exam."}
    >
      <p className="eyebrow">Welcome back</p>
      <h1 className="display display-lg mt-4 text-balance">
        Your next chapter
        <br />
        starts here.
      </h1>
      <p className="mt-4 text-[0.9375rem] text-mute">
        Log in to your secure examination workspace.
      </p>

      <form
        className="mt-9 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        noValidate
      >
        <Field label="Institutional email" htmlFor="email" error={fields.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@institution.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={Boolean(fields.email)}
            required
          />
        </Field>

        <Field label="Password" htmlFor="password" error={fields.password ?? error}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(error || fields.password)}
            required
          />
        </Field>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-7 text-[0.875rem] text-mute">
        New to ExamCore?{" "}
        <Link href="/signup" className="font-medium text-cobalt hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-10 rounded-md border border-line bg-surface/70 px-4 py-3.5">
        <p className="text-[0.625rem] uppercase tracking-[0.1em] text-mute">
          Demo access · choose a role
        </p>
        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              disabled={busy}
              onClick={() => void submit(account.email, "Demo@1234")}
              className="inline-flex items-center gap-1 text-[0.8125rem] font-medium text-cobalt hover:underline disabled:opacity-50"
            >
              {account.label}
              <ArrowRight className="size-3" />
            </button>
          ))}
        </div>
      </div>
    </AuthSplit>
  );
}
