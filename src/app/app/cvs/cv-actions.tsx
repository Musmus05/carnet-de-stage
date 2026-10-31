"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FileDown, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonClass } from "@/components/ui";

export function CvActions({
  id,
  filePath,
  labels,
}: {
  id: string;
  filePath: string | null;
  labels: { download: string; noFile: string; delete: string; confirm: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function open() {
    if (!filePath) return;
    const { data } = await createClient().storage.from("cvs").createSignedUrl(filePath, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  function remove() {
    if (!window.confirm(labels.confirm)) return;
    start(async () => {
      const supabase = createClient();
      if (filePath) await supabase.storage.from("cvs").remove([filePath]);
      await supabase.from("cvs").delete().eq("id", id);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {filePath ? (
        <button type="button" onClick={open} className={buttonClass("secondary", "h-9 px-3 text-sm")}>
          <FileDown className="size-4" aria-hidden /> {labels.download}
        </button>
      ) : (
        <span className="self-center text-sm text-ink-3">{labels.noFile}</span>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={labels.delete}
        title={labels.delete}
        className={buttonClass("ghost", "h-9 px-2.5 text-sm hover:text-danger")}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}
