import type { ReactNode } from "react";

/**
 * The herbarium label: a ruled paper slip with the accession number and
 * the facts of one application. The product's signature element.
 */
export function SpecimenLabel({
  heading,
  number,
  title,
  subtitle,
  rows,
  className = "",
}: {
  heading: string;
  number: string;
  title: string;
  subtitle?: string;
  rows: { label: string; value: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={`bg-sheet-raised pt-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-4 border-b border-ink/70 pb-2">
        <span className="font-serif text-[0.8125rem] font-semibold tracking-[0.02em] text-ink-2">{heading}</span>
        <span className="tnum font-serif text-[0.9375rem] font-semibold text-ink">N° {number}</span>
      </div>
      <p className="mt-3 font-serif text-xl font-semibold leading-snug text-ink">{title}</p>
      {subtitle && <p className="mt-0.5 font-serif italic text-ink-2">{subtitle}</p>}
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="col-span-2 grid grid-cols-subgrid border-t border-dotted border-rule-strong py-1.5">
            <dt className="text-ink-3">{row.label}</dt>
            <dd className="min-w-0 text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
