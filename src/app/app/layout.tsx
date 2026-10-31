import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { getProfile } from "@/lib/data";
import { Avatar } from "@/components/avatar";
import { BrandMark } from "@/components/brand";
import { LocaleSwitch } from "@/components/locale-switch";
import { signOut } from "@/app/auth/actions";
import { AppNav } from "./app-nav";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const [{ locale, t }, account] = await Promise.all([getDictionary(), getProfile()]);
  if (!account) redirect("/login");
  const { user, profile, avatarUrl } = account;
  const name = profile?.display_name || user.email || "";

  const links = [
    { href: "/app", label: t.nav.overview, icon: "overview" as const },
    { href: "/app/applications", label: t.nav.applications, icon: "applications" as const },
    { href: "/app/cvs", label: t.nav.cvs, icon: "cvs" as const },
  ];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 z-20 bg-fern text-fern-ink lg:h-dvh">
        <div className="flex h-full items-center justify-between gap-3 px-4 py-3 lg:flex-col lg:items-stretch lg:justify-start lg:px-4 lg:py-6">
          <div className="lg:px-2">
            <BrandMark name={t.meta.title} href="/app" tone="fern" />
          </div>
          <AppNav links={links} newLabel={t.applications.new} />
          <div className="hidden border-t border-white/10 pt-4 text-sm lg:mt-auto lg:grid lg:gap-2 lg:px-2">
            <Link href="/app/profile" className="-mx-2 mb-1 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/6" title={t.nav.profile}>
              <Avatar url={avatarUrl} name={name} size={34} />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-fern-ink">{name}</span>
                <span className="block truncate text-xs text-fern-muted">{t.nav.profile}</span>
              </span>
            </Link>
            <LocaleSwitch locale={locale} label={t.nav.language} className="justify-self-start text-fern-ink" />
            <form action={signOut}>
              <button type="submit" className="cursor-pointer text-fern-ink underline-offset-4 hover:underline">
                {t.nav.signOut}
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 pb-24 pt-6 sm:px-8 lg:px-12 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
        <div className="mx-auto mt-16 flex max-w-6xl items-center gap-5 border-t border-rule pt-5 text-sm text-ink-2 lg:hidden">
          <Link href="/app/profile" className="flex items-center gap-2 hover:text-ink">
            <Avatar url={avatarUrl} name={name} size={26} /> {t.nav.profile}
          </Link>
          <LocaleSwitch locale={locale} label={t.nav.language} />
          <form action={signOut}>
            <button type="submit" className="cursor-pointer underline-offset-4 hover:underline">
              {t.nav.signOut}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
