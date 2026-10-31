import Link from "next/link";

/** A pressed sprig and the product name. */
export function BrandMark({ name, href = "/", tone = "ink" }: { name: string; href?: string; tone?: "ink" | "fern" }) {
  const color = tone === "fern" ? "text-fern-ink" : "text-ink";
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${color}`}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden fill="none">
        <path d="M12 21.5c.2-5.6-.4-11.2-1.2-17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M11.6 14.5c-2.6-.4-4.6-2-5.4-4.6 2.8-.2 4.8 1.4 5.4 4.6Z" fill="currentColor" opacity=".85" />
        <path d="M11.2 9.6c2.2-.6 4.4-2.4 5-5.2-2.8.4-4.6 2.4-5 5.2Z" fill="currentColor" opacity=".6" />
        <path d="M11.9 18.2c2.4-.2 4.4-1.6 5.2-3.8-2.6 0-4.4 1.4-5.2 3.8Z" fill="currentColor" opacity=".7" />
      </svg>
      <span className="font-serif text-lg font-semibold tracking-[-0.01em]">{name}</span>
    </Link>
  );
}
