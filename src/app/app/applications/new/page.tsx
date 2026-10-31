import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { getCvs } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ApplicationForm } from "../application-form";
import { createApplication } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.form.newTitle };
}

export default async function NewApplicationPage() {
  const [{ t }, cvs] = await Promise.all([getDictionary(), getCvs()]);
  return (
    <>
      <PageHeader title={t.form.newTitle} />
      <ApplicationForm t={t} cvs={cvs} action={createApplication} cancelHref="/app/applications" />
    </>
  );
}
