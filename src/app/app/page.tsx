import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server";
import { getApplications, getCvs } from "@/lib/data";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { accession, isAnswered, WAITING, type Application, type Status } from "@/lib/domain";
import { daysFromToday, formatDay } from "@/lib/dates";
import { breakdown, insight, medianDelay, MIN_SAMPLE, pct, responseRate, type Breakdown } from "@/lib/stats";
import { ButtonLink, PageHeader, StatusMark } from "@/components/ui";
import { SpecimenPlate } from "@/components/specimen-plate";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.overview.title };
}

/** Four stages, validated for colour-vision deficiency (see DESIGN.md). */
const STAGES = [
  { key: "preparing", color: "#a8741a", statuses: ["to_apply"] },
  { key: "waiting", color: "#2f64a8", statuses: ["applied", "followed_up"] },
  { key: "positive", color: "#2f7a46", statuses: ["interview", "offer"] },
  { key: "closed", color: "#9b4f86", statuses: ["rejected", "no_answer", "withdrawn"] },
] as const satisfies readonly { key: string; color: string; statuses: readonly Status[] }[];

export default async function OverviewPage() {
  const [{ locale, t }, apps, cvs] = await Promise.all([getDictionary(), getApplications(), getCvs()]);
  const o = t.overview;

  if (apps.length === 0) {
    return (
      <>
        <PageHeader title={o.title} />
        <section className="mt-10 grid items-center gap-8 sm:grid-cols-[14rem_1fr]">
          <SpecimenPlate seed="empty-overview" status="to_apply" paper="#e9ece2" label="" className="mx-auto w-48 sm:w-full" />
          <div>
            <h2 className="font-serif text-2xl font-semibold">{o.empty.title}</h2>
            <p className="mt-2 max-w-[48ch] text-ink-2">{o.empty.body}</p>
            <ButtonLink href="/app/applications/new" className="mt-6">
              <Plus className="size-4" aria-hidden /> {o.empty.cta}
            </ButtonLink>
          </div>
        </section>
      </>
    );
  }

  const rate = pct(responseRate(apps));
  const delay = medianDelay(apps);
  const cvLabel = new Map(cvs.map((cv) => [cv.id, cv.label]));

  const followUps = apps
    .filter((a) => a.follow_up_on && WAITING.includes(a.status))
    .map((a) => ({ a, due: daysFromToday(a.follow_up_on!) }))
    .filter(({ due }) => due <= 7)
    .sort((x, y) => x.due - y.due);

  const recent = apps
    .filter((a) => isAnswered(a.status) && a.answered_on)
    .sort((x, y) => y.answered_on!.localeCompare(x.answered_on!))
    .slice(0, 5);

  const byType = breakdown(apps, (a) => a.type);
  const byCv = breakdown(apps, (a) => a.cv_id ?? "none");
  const byChannel = breakdown(apps, (a) => a.channel);

  return (
    <>
      <PageHeader
        title={o.title}
        actions={
          <ButtonLink href="/app/applications/new">
            <Plus className="size-4" aria-hidden /> {t.applications.new}
          </ButtonLink>
        }
      />

      <Pipeline apps={apps} t={t} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="follow-ups">
          <h2 id="follow-ups" className="font-serif text-xl font-semibold">
            {o.followUps}
          </h2>
          {followUps.length === 0 ? (
            <p className="mt-3 text-ink-3">{o.followUpsEmpty}</p>
          ) : (
            <ul className="mt-3 border-t border-rule">
              {followUps.map(({ a, due }) => (
                <li key={a.id} className="relative flex items-baseline justify-between gap-4 border-b border-rule py-3 hover:bg-sheet-raised">
                  <div className="min-w-0">
                    <Link href={`/app/applications/${a.id}`} className="font-semibold after:absolute after:inset-0 hover:underline">
                      {a.company}
                    </Link>
                    <span className="block text-sm text-ink-2 sm:ml-2 sm:inline">{a.role}</span>
                  </div>
                  <span className={`tnum shrink-0 text-sm ${due < 0 ? "font-semibold text-danger" : due === 0 ? "font-semibold text-tape" : "text-ink-2"}`}>
                    {due < 0
                      ? `${format(o.agoDays, { n: -due })}, ${o.overdue}`
                      : due === 0
                        ? o.today
                        : format(o.inDays, { n: due })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="figures">
          <h2 id="figures" className="sr-only">
            {o.responseRate}
          </h2>
          <dl className="grid grid-cols-2 border-t border-rule">
            <div className="border-b border-r border-rule py-4 pr-4">
              <dt className="text-sm text-ink-2">{o.responseRate}</dt>
              <dd className="tnum mt-1 font-serif text-[2rem] font-semibold leading-none">
                {rate === null ? <span className="text-base font-normal text-ink-3">{o.noData}</span> : `${rate} %`}
              </dd>
              <dd className="mt-2 text-xs leading-snug text-ink-3">{o.responseRateHint}</dd>
            </div>
            <div className="border-b border-rule py-4 pl-5">
              <dt className="text-sm text-ink-2">{o.medianDelay}</dt>
              <dd className="tnum mt-1 font-serif text-[2rem] font-semibold leading-none">
                {delay === null ? <span className="text-base font-normal text-ink-3">{o.noData}</span> : `${delay} ${o.days}`}
              </dd>
            </div>
          </dl>

          <h3 className="mt-6 text-sm font-semibold text-ink-2">{o.recent}</h3>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-ink-3">{o.noData}</p>
          ) : (
            <ul className="mt-2">
              {recent.map((a) => (
                <li key={a.id} className="flex items-baseline justify-between gap-4 py-1.5">
                  <Link href={`/app/applications/${a.id}`} className="min-w-0 truncate hover:underline">
                    <span className="tnum mr-2 font-serif text-ink-3">{accession(a.number)}</span>
                    {a.company}
                  </Link>
                  <span className="flex shrink-0 items-baseline gap-3">
                    <StatusMark status={a.status} label={t.status[a.status]} />
                    <span className="tnum text-sm text-ink-3">{formatDay(a.answered_on, locale)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-12 grid gap-10 xl:grid-cols-3">
        <BreakdownTable title={o.byType} groups={byType} labelOf={(k) => t.type[k as keyof typeof t.type]} t={t} />
        <BreakdownTable title={o.byCv} groups={byCv} labelOf={(k) => (k === "none" ? o.noCv : (cvLabel.get(k) ?? o.noCv))} t={t} />
        <BreakdownTable title={o.byChannel} groups={byChannel} labelOf={(k) => t.channel[k as keyof typeof t.channel]} t={t} />
      </div>
    </>
  );
}

function Pipeline({ apps, t }: { apps: Application[]; t: Dictionary }) {
  const o = t.overview;
  const counts = STAGES.map((s) => ({
    ...s,
    count: apps.filter((a) => (s.statuses as readonly Status[]).includes(a.status)).length,
    detail: s.statuses
      .map((st) => ({ st, n: apps.filter((a) => a.status === st).length }))
      .filter((d) => d.n > 0),
  }));
  const stageLabel = o.stages;

  return (
    <section aria-labelledby="pipeline" className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="pipeline" className="font-serif text-xl font-semibold">
          {o.pipeline}
        </h2>
        <span className="tnum whitespace-nowrap text-sm text-ink-2">
          {apps.length} {o.total}
        </span>
      </div>
      <div className="mt-4 flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={counts.map((c) => `${stageLabel[c.key]} ${c.count}`).join(", ")}>
        {counts
          .filter((c) => c.count > 0)
          .map((c) => (
            <div key={c.key} title={`${stageLabel[c.key]} : ${c.count}`} style={{ flexGrow: c.count, background: c.color }} />
          ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {counts.map((c) => (
          <li key={c.key} className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-ink-2">
              <span aria-hidden className="size-2.5 shrink-0 rounded-[2px]" style={{ background: c.color }} />
              {stageLabel[c.key]}
            </div>
            <div className="tnum mt-1 font-serif text-2xl font-semibold leading-none">{c.count}</div>
            {c.detail.length > 1 && (
              <div className="tnum mt-1 text-xs text-ink-3">{c.detail.map((d) => `${t.status[d.st]} ${d.n}`).join(" · ")}</div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BreakdownTable({
  title,
  groups,
  labelOf,
  t,
}: {
  title: string;
  groups: Breakdown[];
  labelOf: (key: string) => string;
  t: Dictionary;
}) {
  const o = t.overview;
  const tip = insight(groups);

  return (
    <section>
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">{o.noData}</p>
      ) : (
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-rule-strong text-left text-xs text-ink-3">
              <th scope="col" className="py-2 pr-3 font-medium" />
              <th scope="col" className="w-14 py-2 pr-3 text-right font-medium">{o.sent}</th>
              <th scope="col" className="w-[42%] py-2 font-medium">{o.answered}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const p = pct(g.rate) ?? 0;
              const thin = g.sent < MIN_SAMPLE;
              return (
                <tr key={g.key} className="border-b border-rule" title={`${labelOf(g.key)} : ${g.answered}/${g.sent} (${p} %), ${g.interviews} ${o.interviews}`}>
                  <th scope="row" className="max-w-0 truncate py-2.5 pr-3 text-left font-normal text-ink">
                    {labelOf(g.key)}
                  </th>
                  <td className="tnum py-2.5 pr-3 text-right text-ink-2">{g.sent}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-[4px] bg-folder">
                        <div
                          className="h-full rounded-[4px]"
                          style={{ width: `${Math.max(p, 0)}%`, background: thin ? "var(--rule-strong)" : "#2f7a46" }}
                        />
                      </div>
                      <span className={`tnum w-10 text-right ${thin ? "text-ink-3" : "font-semibold text-ink"}`}>{p} %</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {groups.length > 0 && (
        <p className="mt-3 text-sm leading-snug text-ink-2">
          <span className="font-semibold text-ink">{o.insight} </span>
          {tip.kind === "best"
            ? format(o.insightBest, { label: labelOf(tip.group.key), rate: pct(tip.group.rate) ?? 0 })
            : tip.kind === "low"
              ? format(o.insightLow, { label: labelOf(tip.group.key), n: tip.group.sent })
              : o.insightNeedMore}
        </p>
      )}
    </section>
  );
}
