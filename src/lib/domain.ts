import type { Database } from "./supabase/types";

export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];
export type Cv = Database["public"]["Tables"]["cvs"]["Row"];
export type StatusEvent = Database["public"]["Tables"]["status_events"]["Row"];
export type InternshipType = Database["public"]["Enums"]["internship_type"];
export type Status = Database["public"]["Enums"]["application_status"];
export type Channel = Database["public"]["Enums"]["application_channel"];

export const TYPES: InternshipType[] = [
  "abroad",
  "research",
  "startup",
  "large_company",
  "public_sector",
  "nonprofit",
  "other",
];

/** Pipeline order, as read left to right. */
export const STATUSES: Status[] = [
  "to_apply",
  "applied",
  "followed_up",
  "interview",
  "offer",
  "rejected",
  "no_answer",
  "withdrawn",
];

export const CHANNELS: Channel[] = [
  "job_board",
  "linkedin",
  "company_site",
  "school",
  "referral",
  "cold_email",
  "lab_site",
  "other",
];

/** The company replied (positively or not). */
export const ANSWERED: Status[] = ["interview", "offer", "rejected"];
/** Out the door: everything except drafts and withdrawn ones. */
export const SENT: Status[] = ["applied", "followed_up", "interview", "offer", "rejected", "no_answer"];
/** Still waiting on the company. */
export const WAITING: Status[] = ["applied", "followed_up"];

export const FOLLOW_UP_DAYS = 10;

export function isAnswered(s: Status) {
  return ANSWERED.includes(s);
}

export function isSent(s: Status) {
  return SENT.includes(s);
}

export function accession(n: number) {
  return n.toString().padStart(3, "0");
}
