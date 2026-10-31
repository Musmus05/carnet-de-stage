"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: "invalid" | "generic" | "email" | "password";
  notice?: "magicSent" | "checkEmail";
  email?: string;
};

const credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/app") ? next : "/app";
}

async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function authenticate(_prev: AuthState, form: FormData): Promise<AuthState> {
  const intent = form.get("intent");
  const email = String(form.get("email") ?? "").trim();
  const supabase = await createClient();

  if (intent === "magic") {
    if (!z.string().email().safeParse(email).success) return { error: "email", email };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${await origin()}/auth/callback?next=${safeNext(form.get("next"))}` },
    });
    return error ? { error: "generic", email } : { notice: "magicSent", email };
  }

  const parsed = credentials.safeParse({ email, password: form.get("password") });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { error: field === "password" ? "password" : "email", email };
  }

  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: `${await origin()}/auth/callback?next=/app` },
    });
    if (error) return { error: "generic", email };
    if (!data.session) return { notice: "checkEmail", email };
    redirect("/app");
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.status === 400 ? "invalid" : "generic", email };
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
