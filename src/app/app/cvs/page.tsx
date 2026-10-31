import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/server";
import { getApplications, getCvs } from "@/lib/data";
import { format } from "@/lib/i18n/dictionaries";
import { breakdown, pct } from "@/lib/stats";
import { formatDay, toIsoDay } from "@/lib/dates";
import { PageHeader } from "@/components/ui";
import { SpecimenPlate } from "@/components/specimen-plate";
import { CvUpload } from "./cv-upload";
import { CvActions } from "./cv-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.cvs.title };
}

export default async function CvsPage() {
  const [{ locale, t }, cvs, apps] = await Promise.all([getDictionary(), getCvs(), getApplications()]);
  const usage = new Map(apps.reduce((m, a) => (a.cv_id ? m.set(a.cv_id, (m.get(a.cv_id) ?? 0) + 1) : m), new Map<string, number>()));
  const rates = new Map(breakdown(apps, (a) => a.cv_id ?? "").map((g) => [g.key, g]));

  return (
    <>
      <PageHeader title={t.cvs.title} lede={t.cvs.lede} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="cv-list">
          <h2 id="cv-list" className="sr-only">
            {t.cvs.title}
          </h2>
          {cvs.length === 0 ? (
            <div className="grid items-center gap-6 border border-dashed border-rule-strong p-6 sm:grid-cols-[9rem_1fr]">
              <SpecimenPlate seed="empty-cvs" status="to_apply" width={180} height={220} paper="#e9ece2" label="" className="mx-auto w-36" />
              <div>
                <p className="font-serif text-xl font-semibold">{t.cvs.empty.title}</p>
                <p className="mt-2 max-w-[48ch] text-ink-2">{t.cvs.empty.body}</p>
              </div>
            </div>
          ) : (
            <ul className="border-t border-rule">
              {cvs.map((cv) => {
                const used = usage.get(cv.id) ?? 0;
                const rate = pct(rates.get(cv.id)?.rate ?? null);
                return (
                  <li key={cv.id} className="grid gap-3 border-b border-rule py-5 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <h3 className="font-serif text-lg font-semibold">{cv.label}</h3>
                        <span className="text-sm text-ink-3">
                          {t.cvs.languages[cv.language as "fr" | "en" | "other"]} ·{" "}
                          {formatDay(toIsoDay(new Date(cv.created_at)), locale, "long")}
                        </span>
                      </div>
                      {cv.notes && <p className="mt-1 max-w-[60ch] text-ink-2">{cv.notes}</p>}
                      <p className="tnum mt-2 text-sm text-ink-2">
                        {used === 0 ? t.cvs.unused : used === 1 ? t.cvs.usedOne : format(t.cvs.used, { n: used })}
                        {rate !== null && (
                          <>
                            {" · "}
                            <span className="font-semibold text-ink">{format(t.cvs.responses, { rate })}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <CvActions
                      id={cv.id}
                      filePath={cv.file_path}
                      labels={{ download: t.cvs.download, noFile: t.cvs.noFile, delete: t.cvs.delete, confirm: t.cvs.deleteConfirm }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside>
          <CvUpload t={t.cvs} />
        </aside>
      </div>
    </>
  );
}
