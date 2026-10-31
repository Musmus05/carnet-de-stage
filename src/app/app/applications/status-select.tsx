"use client";

import { useOptimistic, useTransition } from "react";
import { STATUSES, type Status } from "@/lib/domain";
import { setStatus } from "./actions";

/** Inline status change: the most frequent edit, done without opening the record. */
export function StatusSelect({
  id,
  status,
  labels,
  label,
}: {
  id: string;
  status: Status;
  labels: Record<Status, string>;
  label: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, start] = useTransition();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute left-2.5 size-2.5 rounded-full"
        style={{ background: `var(--st-${optimistic})` }}
      />
      <select
        value={optimistic}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Status;
          start(async () => {
            setOptimistic(next);
            await setStatus(id, next);
          });
        }}
        className="h-8 cursor-pointer appearance-none rounded-md border border-transparent bg-transparent pl-7 pr-3 text-sm text-ink hover:border-rule-strong hover:bg-sheet-raised focus-visible:border-tape disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {labels[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
