-- Carnet de stage: initial schema
-- Every table is private to its owner through row-level security.

create type public.internship_type as enum (
  'abroad', 'research', 'startup', 'large_company', 'public_sector', 'nonprofit', 'other'
);

create type public.application_status as enum (
  'to_apply', 'applied', 'followed_up', 'interview', 'offer', 'rejected', 'no_answer', 'withdrawn'
);

create type public.application_channel as enum (
  'job_board', 'linkedin', 'company_site', 'school', 'referral', 'cold_email', 'lab_site', 'other'
);

-- CV versions -------------------------------------------------------------

create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  language text not null default 'fr' check (language in ('fr', 'en', 'other')),
  notes text,
  file_path text,
  file_name text,
  file_size integer,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index cvs_user_idx on public.cvs (user_id, created_at desc);

-- Applications ------------------------------------------------------------

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number integer not null default 0, -- set by trigger
  company text not null check (char_length(company) between 1 and 120),
  role text not null check (char_length(role) between 1 and 160),
  type public.internship_type not null default 'other',
  status public.application_status not null default 'applied',
  channel public.application_channel not null default 'other',
  city text,
  country text,
  url text,
  cv_id uuid references public.cvs (id) on delete set null,
  applied_on date,
  follow_up_on date,
  answered_on date,
  start_on date,
  duration_months smallint check (duration_months between 1 and 24),
  contact_name text,
  contact_email text,
  notes text,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number)
);

create index applications_user_idx on public.applications (user_id, created_at desc);
create index applications_cv_idx on public.applications (cv_id);

-- Status history, used for timelines and time-to-answer ---------------------

create table public.status_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.application_status not null,
  at timestamptz not null default now()
);

create index status_events_app_idx on public.status_events (application_id, at);

-- Triggers ----------------------------------------------------------------

-- Per-user accession number (N° 1, 2, 3...) like a herbarium register.
create or replace function public.assign_application_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  select coalesce(max(number), 0) + 1 into new.number
  from public.applications where user_id = new.user_id;
  return new;
end;
$$;

create trigger applications_number
before insert on public.applications
for each row execute function public.assign_application_number();

create or replace function public.touch_application()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  -- An answer closes the wait: stamp the date once if the user did not.
  if new.status in ('interview', 'offer', 'rejected')
     and old.status not in ('interview', 'offer', 'rejected')
     and new.answered_on is null then
    new.answered_on := current_date;
  end if;
  return new;
end;
$$;

create trigger applications_touch
before update on public.applications
for each row execute function public.touch_application();

create or replace function public.log_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.status_events (application_id, user_id, status)
    values (new.id, new.user_id, new.status);
  end if;
  return new;
end;
$$;

create trigger applications_status_log
after insert or update of status on public.applications
for each row execute function public.log_status_event();

-- Row-level security ------------------------------------------------------

alter table public.cvs enable row level security;
alter table public.applications enable row level security;
alter table public.status_events enable row level security;

create policy "own cvs" on public.cvs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own applications" on public.applications
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (cv_id is null or exists (
      select 1 from public.cvs c where c.id = cv_id and c.user_id = (select auth.uid())
    ))
  );

create policy "read own status events" on public.status_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Storage: private bucket, one folder per user -----------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy "cv files: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "cv files: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "cv files: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
