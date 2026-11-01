"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutList, Plus, Sprout } from "lucide-react";

const ICONS = { overview: Sprout, applications: LayoutList, cvs: FileText };

type NavLink = { href: string; label: string; icon: keyof typeof ICONS; count?: number; alert?: { count: number; title: string } };

/**
 * The rail navigation. Desktop: the active item is a paper index tab that
 * runs into the page, like the tab of a herbarium folder. Mobile: a row of
 * icons in the top bar.
 */
export function AppNav({
  links,
  newLabel,
  nextNumber,
  nextNumberTitle,
}: {
  links: NavLink[];
  newLabel: string;
  nextNumber: string;
  nextNumberTitle: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  const creating = pathname === "/app/applications/new";

  return (
    <nav aria-label="Navigation" className="flex items-center gap-1 lg:mt-9 lg:block">
      <Link
        href="/app/applications/new"
        aria-current={creating ? "page" : undefined}
        className="rail-ticket group inline-flex h-9 items-center gap-2 whitespace-nowrap bg-sheet-raised px-3 text-sm font-semibold text-ink transition-[transform,background-color] duration-150 hover:bg-white lg:mr-5 lg:flex lg:h-12 lg:justify-between lg:px-4 lg:hover:-translate-y-px"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="size-4 text-action" strokeWidth={2.4} aria-hidden />
          <span className="hidden sm:inline">{newLabel}</span>
        </span>
        <span className="tnum hidden font-serif text-[0.8125rem] font-semibold text-ink-3 lg:inline" title={nextNumberTitle}>
          N° {nextNumber}
        </span>
      </Link>

      <ul className="flex items-center gap-1 lg:mt-7 lg:block lg:space-y-1">
        {links.map(({ href, label, icon, count, alert }) => {
          const Icon = ICONS[icon];
          const active = isActive(href) && !creating;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rail-tab relative inline-flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors duration-150 lg:flex lg:h-11 lg:rounded-l-lg lg:rounded-r-none lg:pl-3.5 lg:pr-6 lg:text-[0.9375rem] ${
                  active
                    ? "is-active bg-sheet-raised font-semibold text-ink lg:bg-sheet"
                    : "text-fern-muted hover:bg-white/6 hover:text-fern-ink lg:mr-5 lg:rounded-r-lg"
                }`}
              >
                <Icon className={`size-[1.1rem] shrink-0 ${active ? "text-action" : ""}`} strokeWidth={1.75} aria-hidden />
                <span className="sr-only sm:not-sr-only lg:flex-1">{label}</span>
                {alert && alert.count > 0 && (
                  <span
                    title={alert.title}
                    className="tnum hidden h-5 min-w-5 items-center justify-center rounded-full bg-tape px-1.5 text-xs font-semibold text-white lg:inline-flex"
                  >
                    {alert.count}
                    <span className="sr-only"> {alert.title}</span>
                  </span>
                )}
                {count !== undefined && (
                  <span className={`tnum hidden font-serif text-sm lg:inline ${active ? "text-ink-3" : "text-fern-muted/80"}`}>{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
