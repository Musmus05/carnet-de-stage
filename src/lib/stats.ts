import { isAnswered, isSent, STATUSES, type Application, type Status } from "./domain";
import { daysBetween } from "./dates";

export type Breakdown = {
  key: string;
  sent: number;
  answered: number;
  interviews: number;
  rate: number | null;
};

/** Below this many sent applications, a rate is shown but never called a trend. */
export const MIN_SAMPLE = 3;

export function pipelineCounts(apps: Application[]) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const a of apps) counts[a.status] += 1;
  return counts;
}

export function responseRate(apps: Application[]) {
  const sent = apps.filter((a) => isSent(a.status));
  if (sent.length === 0) return null;
  return sent.filter((a) => isAnswered(a.status)).length / sent.length;
}

export function medianDelay(apps: Application[]) {
  const delays = apps
    .filter((a) => isAnswered(a.status) && a.applied_on && a.answered_on)
    .map((a) => daysBetween(a.applied_on!, a.answered_on!))
    .filter((d) => d >= 0)
    .sort((x, y) => x - y);
  if (delays.length === 0) return null;
  const mid = Math.floor(delays.length / 2);
  return delays.length % 2 ? delays[mid] : Math.round((delays[mid - 1] + delays[mid]) / 2);
}

export function breakdown(apps: Application[], keyOf: (a: Application) => string): Breakdown[] {
  const groups = new Map<string, Breakdown>();
  for (const a of apps) {
    if (!isSent(a.status)) continue;
    const key = keyOf(a);
    const g = groups.get(key) ?? { key, sent: 0, answered: 0, interviews: 0, rate: null };
    g.sent += 1;
    if (isAnswered(a.status)) g.answered += 1;
    if (a.status === "interview" || a.status === "offer") g.interviews += 1;
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, rate: g.sent ? g.answered / g.sent : null }))
    .sort((x, y) => y.sent - x.sent || (y.rate ?? 0) - (x.rate ?? 0));
}

/** One sentence of advice from the strongest and weakest groups with enough data. */
export function insight(groups: Breakdown[]) {
  const reliable = groups.filter((g) => g.sent >= MIN_SAMPLE);
  if (reliable.length === 0) return { kind: "need_more" as const };
  const best = [...reliable].sort((x, y) => (y.rate ?? 0) - (x.rate ?? 0))[0];
  const silent = reliable.find((g) => g.answered === 0 && g.sent >= MIN_SAMPLE + 1);
  if (silent && silent !== best) return { kind: "low" as const, group: silent };
  if ((best.rate ?? 0) > 0) return { kind: "best" as const, group: best };
  return { kind: "need_more" as const };
}

export function pct(rate: number | null) {
  return rate === null ? null : Math.round(rate * 100);
}
