import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { getApplication, getCvs } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ApplicationForm } from "../../application-form";
import { updateApplication } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.form.editTitle };
}

export default async function EditApplicationPage({ params }: PageProps<"/app/applications/[id]/edit">) {
  const { id } = await params;
  const [{ t }, { application }, cvs] = await Promise.all([getDictionary(), getApplication(id), getCvs()]);
  return (
    <>
      <PageHeader title={`${t.form.editTitle} · ${application.company}`} />
      <ApplicationForm
        t={t}
        cvs={cvs}
        application={application}
        action={updateApplication.bind(null, id)}
        cancelHref={`/app/applications/${id}`}
      />
    </>
  );
}
