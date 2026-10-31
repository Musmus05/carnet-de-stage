"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, buttonClass, fieldClass } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function DataSection({ t, userId }: { t: Dictionary["profile"]; userId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  function deleteAccount() {
    setError(false);
    start(async () => {
      const supabase = createClient();
      // Files first: the database cascade cannot reach Storage objects.
      for (const bucket of ["cvs", "avatars"]) {
        const { data } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
        if (data?.length) await supabase.storage.from(bucket).remove(data.map((f) => `${userId}/${f.name}`));
      }
      const { error: rpcError } = await supabase.rpc("delete_my_account");
      if (rpcError) return setError(true);
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <section aria-labelledby="data" className="grid gap-6 border-t border-rule pt-8">
      <h2 id="data" className="font-serif text-xl font-semibold">
        {t.data}
      </h2>

      <div className="grid gap-2">
        <a href="/app/profile/export" download className={buttonClass("secondary", "justify-self-start")}>
          <Download className="size-4" aria-hidden /> {t.export}
        </a>
        <p className="text-sm text-ink-3">{t.exportHint}</p>
      </div>

      <div className="grid gap-4 rounded-md border border-danger/35 p-5">
        <div>
          <h3 className="font-semibold text-danger">{t.deleteTitle}</h3>
          <p className="mt-1 max-w-[60ch] text-sm text-ink-2">{t.deleteBody}</p>
        </div>
        <Field label={t.deleteConfirmLabel} htmlFor="delete-confirm" className="max-w-xs">
          <input id="delete-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className={fieldClass} />
        </Field>
        <div className="flex items-center gap-4">
          <Button type="button" variant="danger" disabled={confirm !== t.deleteWord || pending} onClick={deleteAccount}>
            <Trash2 className="size-4" aria-hidden /> {t.deleteButton}
          </Button>
          {error && <p className="text-sm text-danger">{t.errors.generic}</p>}
        </div>
      </div>
    </section>
  );
}
