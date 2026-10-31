"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const FILE_BUCKETS = ["cvs", "avatars"] as const;

/**
 * Deletes the signed-in account on the server: every file in the user's
 * folders first, in batches until none remain, then the account itself
 * (the database refuses while files remain), then the session cookies.
 */
export async function deleteAccount(confirmation: string): Promise<{ error: true } | undefined> {
  if (!["SUPPRIMER", "DELETE"].includes(confirmation)) return { error: true };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: true };
  const folder = auth.user.id;

  for (const bucket of FILE_BUCKETS) {
    // Listing returns at most 100 entries; remove and list again until empty.
    for (let round = 0; round < 1000; round++) {
      const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 100 });
      if (error) return { error: true };
      if (!data.length) break;
      const { error: removeError } = await supabase.storage.from(bucket).remove(data.map((f) => `${folder}/${f.name}`));
      if (removeError) return { error: true };
    }
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: true };

  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
