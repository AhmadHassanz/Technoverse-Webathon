"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Field, Input } from "@/frontend/components/ui";
import { AuthSplit } from "@/frontend/components/shell/AuthSplit";
import { roleHome, useAuth } from "@/frontend/lib/auth";
import { errorMessage, toApiError } from "@/frontend/lib/api-client";
import { zodFields } from "@/frontend/lib/forms";
import { signupSchema } from "@/shared/validation";

export default function SignupPage() {
  const { me, loading, signup } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && me) router.replace(roleHome(me.role));
  }, [loading, me, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      setErrors(zodFields(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const account = await signup(parsed.data);
      router.replace(roleHome(account.role));
    } catch (err) {
      const apiErr = toApiError(err);
      setErrors(apiErr.fields ?? { email: errorMessage(apiErr) });
      setBusy(false);
    }
  }

  return (
    <AuthSplit headline={"A better way\nto measure\nwhat matters."}>
      <p className="eyebrow">Create your account</p>
      <h1 className="display display-lg mt-4">Start with confidence.</h1>
      <p className="mt-4 text-[0.9375rem] text-mute">
        Use your institutional email to join ExamCore.
      </p>

      <form className="mt-9 space-y-5" onSubmit={submit} noValidate>
        <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="Ayesha Khan"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            invalid={Boolean(errors.fullName)}
            required
          />
        </Field>

        <Field label="Institutional email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@institution.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={Boolean(errors.email)}
            required
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.password}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(errors.password)}
            required
          />
        </Field>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-7 text-[0.875rem] text-mute">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-cobalt hover:underline">
          Log in
        </Link>
      </p>
    </AuthSplit>
  );
}
