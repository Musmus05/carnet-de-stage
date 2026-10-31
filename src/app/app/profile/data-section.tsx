"use client";

import { useState, useTransition } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button, Field, buttonClass, fieldClass } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { deleteAccount as deleteAccountOnServer } from "./actions";

export function DataSection({ t }: { t: Dictionary["profile"] }) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  function deleteAccount() {
    setError(false);
    start(async () => {
      // Files and account are deleted on the server; on success it redirects home.
      const result = await deleteAccountOnServer(confirm);
      if (result?.error) setError(true);
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
