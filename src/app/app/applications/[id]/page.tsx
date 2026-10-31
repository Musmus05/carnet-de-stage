import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { getApplication, getCvs } from "@/lib/data";
import { format } from "@/lib/i18n/dictionaries";
import { accession, isAnswered, WAITING } from "@/lib/domain";
import { daysBetween, daysFromToday, formatDay, toIsoDay } from "@/lib/dates";
import { ButtonLink, StatusMark, buttonClass } from "@/components/ui";
import { SpecimenPlate } from "@/components/specimen-plate";
import { SpecimenLabel } from "@/components/specimen-label";
import { StatusSelect } from "../status-select";
import { DeleteButton } from "./delete-button";

export async function generateMetadata({ params }: PageProps<"/app/applications/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { application } = await getApplication(id);
  return { title: application.company };
}

export default async function ApplicationPage({ params }: PageProps<"/app/applications/[id]">) {
  const { id } = await params;
  const [{ locale, t }, { application: a, events }, cvs] = await Promise.all([
    getDictionary(),
    getApplication(id),
    getCvs(),
  ]);
  const cv = cvs.find((c) => c.id === a.cv_id);
  const place = [a.city, a.country].filter(Boolean).join(", ");
  const waitingDays = a.applied_on && WAITING.includes(a.status) ? -daysFromToday(a.applied_on) : null;
  const answeredIn =
    isAnswered(a.status) && a.applied_on && a.answered_on ? daysBetween(a.applied_on, a.answered_on) : null;

  return (
    <article>
      <Link href="/app/applications" className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> {t.detail.back}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6 border-b border-rule pb-6">
        <div className="min-w-0">
          <p className="tnum font-serif text-ink-3">N° {accession(a.number)}</p>
          <h1 className="mt-1 font-serif text-[2.25rem] font-semibold leading-tight tracking-[-0.01em]">{a.company}</h1>
          <p className="mt-1 text-lg text-ink-2">{a.role}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
            <StatusSelect id={a.id} status={a.status} labels={t.status} label={t.applications.changeStatus} />
            {waitingDays !== null && waitingDays >= 0 && <span>{format(t.detail.waiting, { n: waitingDays })}</span>}
            {answeredIn !== null && <span>{format(t.detail.answeredIn, { n: answeredIn })}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.url && (
            <a href={a.url} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
              <ExternalLink className="size-4" aria-hidden /> {t.detail.open}
            </a>
          )}
          <ButtonLink href={`/app/applications/${a.id}/edit`}>
            <Pencil className="size-4" aria-hidden /> {t.detail.edit}
          </ButtonLink>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-8">
          <TextBlock title={t.form.feedback} body={a.feedback} empty={t.form.feedbackHint} />
          <TextBlock title={t.form.notes} body={a.notes} empty={t.form.notesHint} />

          {(a.contact_name || a.contact_email) && (
            <section>
              <h2 className="font-serif text-lg font-semibold">{t.form.contactName}</h2>
              <p className="mt-2 text-ink-2">
                {a.contact_name}
                {a.contact_email && (
                  <>
                    {a.contact_name && " · "}
                    <a href={`mailto:${a.contact_email}`} className="text-action underline">
                      {a.contact_email}
                    </a>
                  </>
                )}
              </p>
            </section>
          )}

          <section>
            <h2 className="font-serif text-lg font-semibold">{t.detail.history}</h2>
            <ol className="mt-3 border-l border-rule-strong pl-5">
              {events.map((e) => (
                <li key={e.id} className="relative pb-4 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-sheet"
                    style={{ background: `var(--st-${e.status})` }}
                  />
                  <span className="text-ink">{t.status[e.status]}</span>
                  <span className="tnum ml-3 text-sm text-ink-3">{formatDay(toIsoDay(new Date(e.at)), locale, "long")}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="border-t border-rule pt-6">
            <DeleteButton id={a.id} label={t.form.delete} confirm={t.form.deleteConfirm} />
          </div>
        </div>

        <aside className="order-first lg:order-none">
          <div className="border border-rule-strong bg-sheet-raised p-4 shadow-sheet" style={{ borderRadius: 2 }}>
            <SpecimenPlate seed={a.id} status={a.status} label={t.status[a.status]} />
            <SpecimenLabel
              className="mt-3 border-t-2 border-ink"
              heading={t.meta.title}
              number={accession(a.number)}
              title={a.company}
              subtitle={a.role}
              rows={[
                { label: t.detail.labelRows.type, value: t.type[a.type] },
                ...(place ? [{ label: t.detail.labelRows.place, value: place }] : []),
                { label: t.detail.labelRows.channel, value: t.channel[a.channel] },
                {
                  label: t.detail.labelRows.cv,
                  value: cv ? (
                    <Link href="/app/cvs" className="underline underline-offset-2">
                      {cv.label}
                    </Link>
                  ) : (
                    "–"
                  ),
                },
                { label: t.detail.labelRows.applied, value: formatDay(a.applied_on, locale, "long") ?? t.detail.noDate },
                { label: t.detail.labelRows.status, value: <StatusMark status={a.status} label={t.status[a.status]} /> },
              ]}
            />
          </div>
        </aside>
      </div>
    </article>
  );
}

function TextBlock({ title, body, empty }: { title: string; body: string | null; empty: string }) {
  return (
    <section>
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {body ? (
        <p className="mt-2 max-w-[68ch] whitespace-pre-line leading-relaxed text-ink">{body}</p>
      ) : (
        <p className="mt-2 text-ink-3">{empty}</p>
      )}
    </section>
  );
}
