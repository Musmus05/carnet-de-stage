"use client";

import { useRouter } from "next/navigation";
import { useActionState, useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { Button, Field, buttonClass, fieldClass } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { saveProfile, setAvatar, type ProfileState } from "./actions";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export function IdentityForm({
  t,
  userId,
  email,
  avatarUrl,
  avatarPath,
  displayName,
  programme,
  locale,
}: {
  t: Dictionary["profile"];
  userId: string;
  email: string;
  avatarUrl: string | null;
  avatarPath: string | null;
  displayName: string;
  programme: string;
  locale: "fr" | "en";
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

  function onPhoto(file: File | undefined) {
    setPhotoError(null);
    if (!file) return;
    if (!TYPES.includes(file.type)) return setPhotoError(t.errors.photoType);
    if (file.size > MAX_BYTES) return setPhotoError(t.errors.photoSize);
    startUpload(async () => {
      const supabase = createClient();
      const ext = file.type.split("/")[1];
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
      if (error) return setPhotoError(t.errors.generic);
      if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
      await setAvatar(path);
      router.refresh();
    });
  }

  function removePhoto() {
    startUpload(async () => {
      if (avatarPath) await createClient().storage.from("avatars").remove([avatarPath]);
      await setAvatar(null);
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="identity" className="grid gap-6">
      <h2 id="identity" className="font-serif text-xl font-semibold">
        {t.identity}
      </h2>

      <div className="flex flex-wrap items-center gap-5">
        <Avatar url={avatarUrl} name={displayName || email} size={88} />
        <div className="grid gap-2">
          <span className="text-sm font-medium">{t.photo}</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={buttonClass("secondary", "h-9 px-3 text-sm")}>
              <Camera className="size-4" aria-hidden /> {t.photoChange}
            </button>
            {avatarPath && (
              <button type="button" disabled={uploading} onClick={removePhoto} className={buttonClass("ghost", "h-9 px-3 text-sm")}>
                {t.photoRemove}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept={TYPES.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => onPhoto(e.target.files?.[0])} />
          <p className={`text-sm ${photoError ? "text-danger" : "text-ink-3"}`} aria-live="polite">
            {photoError ?? t.photoHint}
          </p>
        </div>
      </div>

      <form action={action} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t.displayName} htmlFor="display_name">
            <input id="display_name" name="display_name" defaultValue={displayName} maxLength={80} autoComplete="name" className={fieldClass} />
          </Field>
          <Field label={t.programme} htmlFor="programme">
            <input id="programme" name="programme" defaultValue={programme} maxLength={120} placeholder={t.programmePlaceholder} className={fieldClass} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t.language}</legend>
          <div className="flex gap-2">
            {(["fr", "en"] as const).map((l) => (
              <label key={l} className="cursor-pointer">
                <input type="radio" name="locale" value={l} defaultChecked={locale === l} className="peer sr-only" />
                <span className="inline-flex h-9 items-center rounded-full border border-rule-strong bg-sheet-raised px-4 text-sm text-ink-2 transition-colors duration-150 hover:border-ink-3 peer-checked:border-fern peer-checked:bg-fern peer-checked:text-fern-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tape">
                  {l === "fr" ? "Français" : "English"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={pending}>
            {pending ? t.saving : t.save}
          </Button>
          <p aria-live="polite" className={`text-sm ${state.error ? "text-danger" : "text-action"}`}>
            {state.error ? t.errors.generic : state.ok ? t.saved : ""}
          </p>
        </div>
      </form>
    </section>
  );
}
