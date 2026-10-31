/** A round profile photo, or initials on fern green when there is none. */
export function Avatar({
  url,
  name,
  size = 40,
  className = "",
}: {
  url: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initials =
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL, not optimisable
    <img src={url} alt="" width={size} height={size} className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-full bg-action font-serif font-semibold text-fern-ink ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
