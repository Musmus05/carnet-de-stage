"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, fieldClass } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Message = { kind: "ok" | "error"; text: string } | null;

export function SecurityForms({ t, email }: { t: Dictionary["profile"]; email: string }) {
  const [emailMsg, setEmailMsg] = useState<Message>(null);
  const [passwordMsg, setPasswordMsg] = useState<Message>(null);
  const [pendingEmail, startEmail] = useTransition();
  const [pendingPassword, startPassword] = useTransition();

  function changeEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const next = String(new FormData(form).get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) return setEmailMsg({ kind: "error", text: t.errors.email });
    startEmail(async () => {
      const { error } = await createClient().auth.updateUser(
        { email: next },
        { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/profile` },
      );
      setEmailMsg(error ? { kind: "error", text: t.errors.generic } : { kind: "ok", text: t.emailSent });
    });
  }

  function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    if (password.length < 8) return setPasswordMsg({ kind: "error", text: t.errors.password });
    if (password !== String(data.get("confirm") ?? "")) return setPasswordMsg({ kind: "error", text: t.passwordMismatch });
    startPassword(async () => {
      const { error } = await createClient().auth.updateUser({ password });
      if (!error) form.reset();
      setPasswordMsg(error ? { kind: "error", text: t.errors.generic } : { kind: "ok", text: t.passwordChanged });
    });
  }

  return (
    <section aria-labelledby="security" className="grid gap-6 border-t border-rule pt-8">
      <h2 id="security" className="font-serif text-xl font-semibold">
        {t.security}
      </h2>

      <form onSubmit={changeEmail} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" noValidate>
        <Field label={t.email} htmlFor="email">
          <input id="email" name="email" type="email" defaultValue={email} autoComplete="email" className={fieldClass} />
        </Field>
        <Button type="submit" variant="secondary" disabled={pendingEmail}>
          {t.emailChange}
        </Button>
        <Status msg={emailMsg} />
      </form>

      <form onSubmit={changePassword} className="grid gap-3" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.newPassword} htmlFor="password">
            <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" className={fieldClass} />
          </Field>
          <Field label={t.confirmPassword} htmlFor="confirm">
            <input id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" className={fieldClass} />
          </Field>
        </div>
        <div>
          <Button type="submit" variant="secondary" disabled={pendingPassword}>
            {t.passwordChange}
          </Button>
        </div>
        <Status msg={passwordMsg} />
      </form>
    </section>
  );
}

function Status({ msg }: { msg: Message }) {
  return (
    <p aria-live="polite" className={`text-sm empty:hidden sm:col-span-2 ${msg?.kind === "error" ? "text-danger" : "text-action"}`}>
      {msg?.text}
    </p>
  );
}
