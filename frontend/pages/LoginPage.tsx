"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, Eye, EyeOff, Loader2, ShieldUser, UserCog } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Field, Input } from "@/frontend/components/ui";
import { AuthSplit } from "@/frontend/components/shell/AuthSplit";
import { roleHome, useAuth } from "@/frontend/lib/auth";
import { errorMessage, toApiError } from "@/frontend/lib/api-client";
import { zodFields } from "@/frontend/lib/forms";
import { loginSchema } from "@/shared/validation";

// Real seeded demo accounts (password Demo@1234), so judges can try each role.
const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", email: "admin@demo.com", icon: ShieldUser },
  { role: "examiner", label: "Examiner", email: "examiner@demo.com", icon: UserCog },
  { role: "candidate", label: "Candidate", email: "ali@demo.com", icon: BookOpenCheck },
];

export default function LoginPage() {
  const { me, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

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
      headline={"A clear mind.\nA fair exam."}
    >
      <h1 className="display text-[2.5rem] leading-[1.05] text-balance">Log in to ExamCore</h1>
      <p className="mt-2.5 text-[0.9375rem] text-mute">
        Pick up right where you left off.
      </p>

      <form
        className="mt-8 space-y-5"
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
          <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            className="pr-11"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(error || fields.password)}
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-mute hover:bg-sand hover:text-ink"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
          </div>
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Signing in…" : "Log in"}
          {!busy && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="mt-7 text-[0.875rem] text-mute">
        New to ExamCore?{" "}
        <Link href="/signup" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current">
          Create an account
        </Link>
      </p>

      <div className="mt-8">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <p className="meta-label">One-tap demo access</p>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {DEMO_ACCOUNTS.map(({ role, label, email, icon: Icon }) => (
            <button
              key={role}
              type="button"
              disabled={busy}
              onClick={() => void submit(email, "Demo@1234")}
              className="group flex flex-col items-center gap-2 rounded-[16px] border border-line bg-surface px-2 py-4 text-[0.875rem] font-medium text-ink transition-[color,background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card disabled:opacity-50"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-paper text-ink transition-colors duration-200 group-hover:bg-cobalt group-hover:text-on-cobalt">
                <Icon className="size-[18px]" />
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </AuthSplit>
  );
}
