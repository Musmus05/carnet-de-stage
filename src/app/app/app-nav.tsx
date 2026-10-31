"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutList, Plus, Sprout } from "lucide-react";

const ICONS = { overview: Sprout, applications: LayoutList, cvs: FileText };

export function AppNav({
  links,
  newLabel,
}: {
  links: { href: string; label: string; icon: keyof typeof ICONS }[];
  newLabel: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <nav aria-label="Navigation" className="flex items-center gap-1 lg:mt-8 lg:grid lg:gap-1">
      <Link
        href="/app/applications/new"
        className="mb-0 inline-flex h-9 items-center gap-2 rounded-md bg-fern-ink px-3 text-sm font-semibold text-fern transition-colors duration-150 hover:bg-white lg:mb-5 lg:h-10"
      >
        <Plus className="size-4" strokeWidth={2.25} aria-hidden />
        <span className="hidden sm:inline">{newLabel}</span>
      </Link>
      {links.map(({ href, label, icon }) => {
        const Icon = ICONS[icon];
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150 lg:h-10 lg:text-[0.9375rem] ${
              active ? "bg-white/12 font-semibold text-white" : "text-fern-muted hover:bg-white/6 hover:text-fern-ink"
            }`}
          >
            <Icon className="size-[1.1rem] shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="sr-only sm:not-sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
