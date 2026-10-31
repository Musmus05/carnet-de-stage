"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { deleteApplication } from "../actions";

export function DeleteButton({ id, label, confirm }: { id: string; label: string; confirm: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirm)) start(() => deleteApplication(id));
      }}
    >
      <Trash2 className="size-4" aria-hidden /> {label}
    </Button>
  );
}
