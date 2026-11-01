"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { FileText, LayoutList, Plus, Sprout } from "lucide-react";

const ICONS = { overview: Sprout, applications: LayoutList, cvs: FileText };

type NavLink = { href: string; label: string; icon: keyof typeof ICONS; count?: number; alert?: { count: number; title: string } };

const matches = (href: string, pathname: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

/**
 * The rail navigation. Desktop: one paper index tab, like the tab of a
 * herbarium folder, slides to the chosen section as soon as it is clicked
 * and runs into the page. Mobile: a row of icons in the top bar.
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
  // The section clicked, shown as active right away while the page loads.
  const [clicked, setClicked] = useState<{ href: string; from: string } | null>(null);
  const creating = pathname === "/app/applications/new";
  const derived = creating ? null : (links.find((l) => matches(l.href, pathname))?.href ?? null);
  const activeHref = clicked && clicked.from === pathname ? clicked.href : derived;

  const listRef = useRef<HTMLUListElement>(null);
  const [tab, setTab] = useState<{ top: number; height: number; ready: boolean } | null>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const item = activeHref ? list.querySelector<HTMLElement>(`[data-href="${activeHref}"]`) : null;
      setTab((prev) => (item ? { top: item.offsetTop, height: item.offsetHeight, ready: prev !== null } : null));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeHref]);

  return (
    <nav aria-label="Navigation" className="flex items-center gap-1 lg:mt-9 lg:block">
      <Link
        href="/app/applications/new"
        aria-current={creating ? "page" : undefined}
        onClick={() => setClicked(null)}
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

      <ul ref={listRef} className="relative flex items-center gap-1 lg:mt-7 lg:block lg:space-y-1">
        {tab && (
          <li
            aria-hidden
            className={`rail-indicator pointer-events-none absolute inset-x-0 top-0 hidden rounded-l-lg bg-sheet lg:block ${tab.ready ? "is-ready" : ""}`}
            style={{ transform: `translateY(${tab.top}px)`, height: tab.height }}
          />
        )}
        {links.map(({ href, label, icon, count, alert }) => {
          const Icon = ICONS[icon];
          const active = href === activeHref;
          return (
            <li key={href} data-href={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setClicked({ href, from: pathname })}
                className={`relative z-10 inline-flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors duration-200 lg:flex lg:h-11 lg:rounded-l-lg lg:rounded-r-none lg:pl-3.5 lg:pr-6 lg:text-[0.9375rem] ${
                  active
                    ? "bg-sheet-raised font-semibold text-ink lg:bg-transparent"
                    : "text-fern-muted hover:bg-white/6 hover:text-fern-ink lg:mr-5 lg:rounded-r-lg"
                }`}
              >
                <Icon className={`size-[1.1rem] shrink-0 transition-colors duration-200 ${active ? "text-action" : ""}`} strokeWidth={1.75} aria-hidden />
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
                  <span className={`tnum hidden font-serif text-sm transition-colors duration-200 lg:inline ${active ? "text-ink-3" : "text-fern-muted/80"}`}>
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
