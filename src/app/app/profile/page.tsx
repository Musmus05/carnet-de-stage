import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { getProfile } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { IdentityForm } from "./identity-form";
import { SecurityForms } from "./security-forms";
import { DataSection } from "./data-section";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.profile.title };
}

export default async function ProfilePage() {
  const [{ locale, t }, data] = await Promise.all([getDictionary(), getProfile()]);
  if (!data) notFound();
  const { user, profile, avatarUrl } = data;

  return (
    <>
      <PageHeader title={t.profile.title} lede={t.profile.lede} />
      <div className="mt-8 grid max-w-3xl gap-12">
        <IdentityForm
          t={t.profile}
          userId={user.id}
          email={user.email ?? ""}
          avatarUrl={avatarUrl}
          avatarPath={profile?.avatar_path ?? null}
          displayName={profile?.display_name ?? ""}
          programme={profile?.programme ?? ""}
          locale={(profile?.locale as "fr" | "en" | null) ?? locale}
        />
        <SecurityForms t={t.profile} email={user.email ?? ""} />
        <DataSection t={t.profile} />
      </div>
    </>
  );
}
