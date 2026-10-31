# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: Next.js (App Router, TypeScript, Tailwind CSS 4) + Supabase (auth email/magic link, Postgres with row-level security, Storage for CV files), deployable on Vercel. Chosen because the app is open to everyone and each user must find their applications and CVs on any device.

## Users

Students and young graduates looking for an internship (stage), often in parallel with classes. They send dozens of applications over weeks or months, of different kinds (abroad, research lab, startup, large company, gap year), each with a specific CV version. Primary scene: at a desk or on a laptop between classes, logging an application just after sending it, and coming back later when an answer arrives.

## Product Purpose

Track every internship application from "to apply" to "offer" or "rejected", know which CV went where, and learn from the answers: which kinds of internships, channels and CV versions actually get responses. Success: the user stops losing track, follows up on time, and adjusts their strategy from their own data.

## Positioning

Not a generic job board or kanban: the product links each application to the exact CV version and internship type used, then turns outcomes into feedback ("your research CV gets 2x more replies than the generic one").

## Operating Context

- Applications come from job boards, LinkedIn, school networks, cold emails, lab websites.
- Answers arrive by email days or weeks later, often never.
- Follow-ups (relances) are usually sent 7 to 14 days after applying.
- Users keep several CVs (French/English, research/industry).

## Capabilities and Constraints

- Accounts: email sign-in (magic link + password); each user only sees their own data (RLS).
- Applications: company, role, internship type (abroad, research, startup, large company, public sector, other), location/country, channel, link, dates (applied, follow-up, answer), status pipeline, CV used, contact, notes, feedback received.
- CVs: upload PDF versions with a label, link to applications.
- Dashboard: response rate by type, by CV, by channel; time to answer; pipeline counts; follow-ups due.
- Interface bilingual French / English.
- Undecided: email reminders, browser extension, import from LinkedIn.

## Brand Commitments

- Name: Herbarium (same in every language; Latin word understood in French, English, Spanish, Italian, German). Tagline: "Internship tracker" / "Suivi de stage". Each application is a specimen. Voice: direct, encouraging without hype, speaks to a student as a peer.
- User asked for an "editorial, warm" feeling and explicitly does not want an interface that looks vibe-coded.

## Evidence on Hand

No real users, testimonials or statistics exist. Do not invent any. Demo data must be labeled as examples.

## Product Principles

1. Logging an application takes under 30 seconds; everything else is optional.
2. Every outcome teaches something: answers, silences and feedback feed the analysis.
3. The CV is a first-class object, not an attachment.
4. Your data is yours: private by default, exportable.

## Accessibility & Inclusion

WCAG AA contrast, full keyboard use, works on phone width (logging from a phone after an interview).
