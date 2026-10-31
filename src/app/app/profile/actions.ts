"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok?: boolean; error?: boolean };

const schema = z.object({
  display_name: z.string().trim().max(80).transform((v) => v || null),
  programme: z.string().trim().max(120).transform((v) => v || null),
  locale: z.enum(["fr", "en"]),
});

export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const parsed = schema.safeParse({
    display_name: String(form.get("display_name") ?? ""),
    programme: String(form.get("programme") ?? ""),
    locale: String(form.get("locale") ?? "fr"),
  });
  if (!parsed.success) return { error: true };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: true };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: auth.user.id, ...parsed.data, updated_at: new Date().toISOString() });
  if (error) return { error: true };

  (await cookies()).set(LOCALE_COOKIE, parsed.data.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Records the uploaded photo's storage path (the upload itself runs in the browser). */
export async function setAvatar(path: string | null) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  if (path && !path.startsWith(`${auth.user.id}/`)) return;
  await supabase.from("profiles").upsert({ id: auth.user.id, avatar_path: path, updated_at: new Date().toISOString() });
  revalidatePath("/app", "layout");
}
