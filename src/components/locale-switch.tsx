"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n/dictionaries";

export function LocaleSwitch({
  locale,
  label,
  className = "",
}: {
  locale: Locale;
  label: string;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const next: Locale = locale === "fr" ? "en" : "fr";
  return (
    <button
      type="button"
      lang={next}
      disabled={pending}
      onClick={() => start(() => setLocale(next))}
      className={`cursor-pointer text-sm underline-offset-4 hover:underline disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}
