"use client";

import Link from "next/link";
import { useActionState } from "react";
import { authenticate, type AuthState } from "@/app/auth/actions";
import { Button, Field, fieldClass } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function LoginForm({
  t,
  mode,
  next,
  linkError,
}: {
  t: Dictionary["auth"];
  mode: "signin" | "signup";
  next: string;
  linkError: boolean;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    authenticate,
    linkError ? { error: "generic" } : {},
  );
  const signup = mode === "signup";
  const emailError = state.error === "email" ? t.errors.email : undefined;
  const passwordError = state.error === "password" ? t.errors.password : undefined;
  const formError = state.error === "invalid" || state.error === "generic" ? t.errors[state.error] : undefined;

  return (
    <form action={action} className="mt-8 grid gap-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <Field label={t.email} htmlFor="email" error={emailError}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          aria-invalid={Boolean(emailError) || undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className={fieldClass}
        />
      </Field>
      <Field label={t.password} htmlFor="password" hint={signup ? t.passwordHint : undefined} error={passwordError}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={8}
          aria-invalid={Boolean(passwordError) || undefined}
          aria-describedby={passwordError ? "password-error" : signup ? "password-hint" : undefined}
          className={fieldClass}
        />
      </Field>

      <div aria-live="polite" className="empty:hidden">
        {formError && <p className="text-sm text-danger">{formError}</p>}
        {state.notice && <p className="text-sm text-action">{t[state.notice]}</p>}
      </div>

      <Button type="submit" name="intent" value={signup ? "signup" : "signin"} disabled={pending} className="h-11">
        {signup ? t.signUp : t.signIn}
      </Button>

      {!signup && (
        <Button type="submit" name="intent" value="magic" variant="secondary" disabled={pending} className="h-11">
          {t.magic}
        </Button>
      )}

      <Link
        href={signup ? "/login" : "/login?mode=signup"}
        className="text-center text-sm text-ink-2 underline-offset-4 hover:text-ink hover:underline"
      >
        {signup ? t.toSignIn : t.toSignUp}
      </Link>
    </form>
  );
}
