"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button, Field, buttonClass, fieldClass } from "@/components/ui";
import { CHANNELS, FOLLOW_UP_DAYS, STATUSES, TYPES, type Application, type Cv } from "@/lib/domain";
import { addDays, toIsoDay } from "@/lib/dates";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { FormState } from "./actions";

type Props = {
  t: Pick<Dictionary, "form" | "type" | "status" | "channel">;
  cvs: Cv[];
  application?: Application;
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  cancelHref: string;
};

export function ApplicationForm({ t, cvs, application: a, action, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const initialApplied = a ? (a.applied_on ?? "") : toIsoDay(new Date());
  const [applied, setApplied] = useState(initialApplied);
  const [followUp, setFollowUp] = useState(
    a ? (a.follow_up_on ?? "") : initialApplied ? addDays(initialApplied, FOLLOW_UP_DAYS) : "",
  );
  const [followUpTouched, setFollowUpTouched] = useState(Boolean(a?.follow_up_on));
  const f = t.form;
  const err = (name: string) => (state.fieldErrors?.[name] ? f.required : undefined);
  const invalid = (name: string) => (state.fieldErrors?.[name] ? true : undefined);
  const activeCvs = cvs.filter((cv) => !cv.archived || cv.id === a?.cv_id);

  return (
    <form action={formAction} className="mt-8 grid max-w-3xl gap-10" noValidate>
      <Section title={f.essentials}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.company} htmlFor="company" error={err("company")}>
            <input id="company" name="company" required autoFocus={!a} defaultValue={a?.company} aria-invalid={invalid("company")} className={fieldClass} autoComplete="organization" />
          </Field>
          <Field label={f.role} htmlFor="role" error={err("role")}>
            <input id="role" name="role" required defaultValue={a?.role} aria-invalid={invalid("role")} className={fieldClass} autoComplete="organization-title" />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">{f.type}</legend>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((type) => (
              <label key={type} className="cursor-pointer">
                <input type="radio" name="type" value={type} defaultChecked={(a?.type ?? "other") === type} className="peer sr-only" />
                <span className="inline-flex h-9 items-center rounded-full border border-rule-strong bg-sheet-raised px-3.5 text-sm text-ink-2 transition-colors duration-150 hover:border-ink-3 hover:text-ink peer-checked:border-fern peer-checked:bg-fern peer-checked:text-fern-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tape">
                  {t.type[type]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={f.status} htmlFor="status">
            <select id="status" name="status" defaultValue={a?.status ?? "applied"} className={fieldClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={f.appliedOn} htmlFor="applied_on" error={err("applied_on")}>
            <input
              id="applied_on"
              name="applied_on"
              type="date"
              value={applied}
              onChange={(e) => {
                setApplied(e.target.value);
                if (!followUpTouched) setFollowUp(e.target.value ? addDays(e.target.value, FOLLOW_UP_DAYS) : "");
              }}
              className={fieldClass}
            />
          </Field>
          <Field label={f.cv} htmlFor="cv_id">
            <select id="cv_id" name="cv_id" defaultValue={a?.cv_id ?? activeCvs[0]?.id ?? ""} className={fieldClass}>
              <option value="">{f.noCv}</option>
              {activeCvs.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.label}
                </option>
              ))}
            </select>
            {cvs.length === 0 && (
              <Link href="/app/cvs" className="mt-1.5 inline-block text-sm text-action underline underline-offset-4">
                {f.addCv}
              </Link>
            )}
          </Field>
        </div>
      </Section>

      <Collapsible title={f.details} defaultOpen={Boolean(a)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.channel} htmlFor="channel">
            <select id="channel" name="channel" defaultValue={a?.channel ?? "job_board"} className={fieldClass}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {t.channel[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={f.url} htmlFor="url" error={err("url")} optional={f.optional}>
            <input id="url" name="url" type="url" inputMode="url" defaultValue={a?.url ?? ""} aria-invalid={invalid("url")} className={fieldClass} placeholder="https://" />
          </Field>
          <Field label={f.city} htmlFor="city" optional={f.optional}>
            <input id="city" name="city" defaultValue={a?.city ?? ""} className={fieldClass} autoComplete="address-level2" />
          </Field>
          <Field label={f.country} htmlFor="country" optional={f.optional}>
            <input id="country" name="country" defaultValue={a?.country ?? ""} className={fieldClass} autoComplete="country-name" />
          </Field>
          <Field label={f.contactName} htmlFor="contact_name" optional={f.optional}>
            <input id="contact_name" name="contact_name" defaultValue={a?.contact_name ?? ""} className={fieldClass} />
          </Field>
          <Field label={f.contactEmail} htmlFor="contact_email" error={err("contact_email")} optional={f.optional}>
            <input id="contact_email" name="contact_email" type="email" defaultValue={a?.contact_email ?? ""} aria-invalid={invalid("contact_email")} className={fieldClass} />
          </Field>
          <Field label={f.startOn} htmlFor="start_on" optional={f.optional}>
            <input id="start_on" name="start_on" type="date" defaultValue={a?.start_on ?? ""} className={fieldClass} />
          </Field>
          <Field label={f.duration} htmlFor="duration_months" error={err("duration_months")} optional={f.optional}>
            <input id="duration_months" name="duration_months" type="number" min={1} max={24} inputMode="numeric" defaultValue={a?.duration_months ?? ""} aria-invalid={invalid("duration_months")} className={fieldClass} />
          </Field>
        </div>
      </Collapsible>

      <Collapsible title={f.tracking} defaultOpen={Boolean(a)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={f.followUpOn} htmlFor="follow_up_on" hint={f.followUpHint}>
            <input
              id="follow_up_on"
              name="follow_up_on"
              type="date"
              value={followUp}
              onChange={(e) => {
                setFollowUp(e.target.value);
                setFollowUpTouched(true);
              }}
              aria-describedby="follow_up_on-hint"
              className={fieldClass}
            />
          </Field>
          <Field label={f.answeredOn} htmlFor="answered_on" optional={f.optional}>
            <input id="answered_on" name="answered_on" type="date" defaultValue={a?.answered_on ?? ""} className={fieldClass} />
          </Field>
        </div>
        <Field label={f.notes} htmlFor="notes" hint={f.notesHint}>
          <textarea id="notes" name="notes" rows={4} defaultValue={a?.notes ?? ""} aria-describedby="notes-hint" className={`${fieldClass} h-auto py-2.5 leading-relaxed`} />
        </Field>
        <Field label={f.feedback} htmlFor="feedback" hint={f.feedbackHint}>
          <textarea id="feedback" name="feedback" rows={4} defaultValue={a?.feedback ?? ""} aria-describedby="feedback-hint" className={`${fieldClass} h-auto py-2.5 leading-relaxed`} />
        </Field>
      </Collapsible>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-rule bg-sheet/95 px-4 py-4 backdrop-blur-sm sm:mx-0 sm:px-0">
        <Button type="submit" disabled={pending} className="h-11 px-5">
          {pending ? f.saving : a ? f.save : f.create}
        </Button>
        <Link href={cancelHref} className={buttonClass("ghost", "h-11")}>
          {f.cancel}
        </Link>
        <p aria-live="polite" className="text-sm text-danger">
          {state.error || state.fieldErrors ? f.error : ""}
        </p>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Collapsible({ title, defaultOpen, children }: { title: string; defaultOpen: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group border-t border-rule pt-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-5 text-ink-3 transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-5 grid gap-5">{children}</div>
    </details>
  );
}
