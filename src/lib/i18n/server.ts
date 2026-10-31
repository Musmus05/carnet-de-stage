import "server-only";
import { cookies, headers } from "next/headers";
import { defaultLocale, dictionaries, locales, type Locale } from "./dictionaries";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (stored && (locales as readonly string[]).includes(stored)) return stored as Locale;

  const accept = (await headers()).get("accept-language") ?? "";
  const preferred = accept.split(",")[0]?.slice(0, 2).toLowerCase();
  return preferred === "en" ? "en" : defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
