import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { getApplications, getCvs } from "@/lib/data";
import { format } from "@/lib/i18n/dictionaries";
import { accession, STATUSES, TYPES, WAITING, type Status, type InternshipType } from "@/lib/domain";
import { daysFromToday, formatDay } from "@/lib/dates";
import { ButtonLink, PageHeader, fieldClass } from "@/components/ui";
import { StatusSelect } from "./status-select";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.applications.title };
}

export default async function ApplicationsPage({ searchParams }: PageProps<"/app/applications">) {
  const [{ locale, t }, apps, cvs, params] = await Promise.all([
    getDictionary(),
    getApplications(),
    getCvs(),
    searchParams,
  ]);
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const type = TYPES.includes(params.type as InternshipType) ? (params.type as InternshipType) : "";
  const status = STATUSES.includes(params.status as Status) ? (params.status as Status) : "";
  const cvLabel = new Map(cvs.map((cv) => [cv.id, cv.label]));

  const needle = q.toLocaleLowerCase();
  const rows = apps.filter(
    (a) =>
      (!type || a.type === type) &&
      (!status || a.status === status) &&
      (!needle || `${a.company} ${a.role}`.toLocaleLowerCase().includes(needle)),
  );
  const filtered = Boolean(q || type || status);
  const c = t.applications.columns;

  return (
    <>
      <PageHeader
        title={t.applications.title}
        actions={
          <ButtonLink href="/app/applications/new">
            <Plus className="size-4" aria-hidden /> {t.applications.new}
          </ButtonLink>
        }
      />

      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_12rem_12rem_auto]" role="search">
        <label className="sr-only" htmlFor="q">
          {t.applications.search}
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder={t.applications.search} className={fieldClass} />
        <label className="sr-only" htmlFor="filter-type">
          {t.form.type}
        </label>
        <select id="filter-type" name="type" defaultValue={type} className={fieldClass}>
          <option value="">{t.applications.allTypes}</option>
          {TYPES.map((v) => (
            <option key={v} value={v}>
              {t.type[v]}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-status">
          {t.form.status}
        </label>
        <select id="filter-status" name="status" defaultValue={status} className={fieldClass}>
          <option value="">{t.applications.allStatuses}</option>
          {STATUSES.map((v) => (
            <option key={v} value={v}>
              {t.status[v]}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 cursor-pointer rounded-md border border-rule-strong px-4 text-sm font-medium hover:bg-folder">
          {t.applications.filter}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm text-ink-3">
        <span className="tnum">
          {rows.length === 1 ? t.applications.countOne : format(t.applications.count, { n: rows.length })}
        </span>
        {filtered && (
          <Link href="/app/applications" className="text-ink-2 underline underline-offset-4 hover:text-ink">
            {t.applications.clearFilters}
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 border border-dashed border-rule-strong px-6 py-12 text-center">
          <p className="text-ink-2">{filtered ? t.applications.emptyFiltered : t.applications.empty}</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto border-y border-rule">
          <table className="w-full min-w-[46rem] border-collapse text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-rule-strong text-[0.8125rem] text-ink-3">
                <th scope="col" className="w-14 py-2.5 pr-3 font-medium">{c.number}</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">{c.company}</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">{c.type}</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">{c.status}</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">{c.cv}</th>
                <th scope="col" className="py-2.5 pr-4 font-medium">{c.applied}</th>
                <th scope="col" className="py-2.5 font-medium">{c.followUp}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const due = a.follow_up_on && WAITING.includes(a.status) ? daysFromToday(a.follow_up_on) : null;
                return (
                  <tr key={a.id} className="group relative border-b border-rule last:border-b-0 hover:bg-sheet-raised">
                    <td className="tnum py-3 pr-3 align-top font-serif text-ink-3">{accession(a.number)}</td>
                    <td className="py-3 pr-4 align-top">
                      <Link href={`/app/applications/${a.id}`} className="font-semibold text-ink after:absolute after:inset-0 hover:underline">
                        {a.company}
                      </Link>
                      <div className="text-sm text-ink-2">{a.role}</div>
                    </td>
                    <td className="py-3 pr-4 align-top text-ink-2">{t.type[a.type]}</td>
                    <td className="relative z-10 py-2 pr-4 align-top">
                      <StatusSelect id={a.id} status={a.status} labels={t.status} label={t.applications.changeStatus} />
                    </td>
                    <td className="max-w-40 truncate py-3 pr-4 align-top text-ink-2">{a.cv_id ? cvLabel.get(a.cv_id) : "–"}</td>
                    <td className="tnum py-3 pr-4 align-top text-ink-2">{formatDay(a.applied_on, locale) ?? "–"}</td>
                    <td className="tnum py-3 align-top">
                      {due === null ? (
                        <span className="text-ink-3">–</span>
                      ) : (
                        <span className={due < 0 ? "font-semibold text-danger" : due <= 2 ? "font-semibold text-tape" : "text-ink-2"}>
                          {formatDay(a.follow_up_on, locale)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
