-- Public demo account, the same as the local one:
--   demo@herbarium.test / demo-herbarium-2026
-- Its password is public, so it is guarded: its email, password and account
-- cannot be changed or deleted, it cannot upload files, and its data is
-- reset to the fictional examples every hour.

create or replace function public.is_demo_user(uid uuid)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select uid = '11111111-1111-4111-8111-111111111111'::uuid;
$$;

-- Creates the demo account if needed and restores its example data.
create or replace function public.reset_demo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  demo uuid := '11111111-1111-4111-8111-111111111111';
begin
  if not exists (select 1 from auth.users where id = demo) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', demo, 'authenticated', 'authenticated',
      'demo@herbarium.test', extensions.crypt('demo-herbarium-2026', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (
      gen_random_uuid(), demo, demo::text,
      jsonb_build_object('sub', demo::text, 'email', 'demo@herbarium.test'),
      'email', now(), now(), now()
    );
  end if;

  delete from public.applications where user_id = demo;
  delete from public.cvs where user_id = demo;

  insert into public.profiles (id, display_name, programme, locale, avatar_path, updated_at)
  values (demo, 'Camille Martin', 'Master bio-informatique, Lyon', 'fr', null, now())
  on conflict (id) do update
    set display_name = excluded.display_name, programme = excluded.programme,
        locale = excluded.locale, avatar_path = null, updated_at = now();

  insert into public.cvs (id, user_id, label, language, notes) values
    ('22222222-0000-4000-8000-000000000001', demo, 'CV recherche (FR)', 'fr', 'Met en avant le projet de bioinformatique et le mémoire.'),
    ('22222222-0000-4000-8000-000000000002', demo, 'Research CV (EN)', 'en', 'Version anglaise, une page, publications en premier.'),
    ('22222222-0000-4000-8000-000000000003', demo, 'CV généraliste', 'fr', 'Première version, envoyée partout au début.');

  -- Fictional examples. Dates are relative to today; the status is set after
  -- the insert so the history trigger records a realistic path.
  create temp table if not exists demo_rows (
    company text, role text, type text, channel text, city text, country text,
    cv int, applied int, status text, answered int, feedback text
  ) on commit drop;
  truncate demo_rows;
  insert into demo_rows values
    ('Laboratoire Lumière', 'Stage en traitement d''images', 'research', 'lab_site', 'Lyon', 'France', 1, -48, 'interview', -36, 'Profil intéressant, entretien technique sur Python et OpenCV.'),
    ('Nordlicht Robotics', 'Robotics software intern', 'abroad', 'linkedin', 'Munich', 'Allemagne', 2, -45, 'rejected', -30, 'Looking for someone with ROS2 experience.'),
    ('Atelier Ciel', 'Stage développeur web', 'startup', 'job_board', 'Nantes', 'France', 3, -44, 'no_answer', null, null),
    ('Groupe Hexa', 'Stage data analyst', 'large_company', 'job_board', 'Paris', 'France', 3, -42, 'rejected', -20, null),
    ('Institut des Marées', 'Stage modélisation océanique', 'research', 'school', 'Brest', 'France', 1, -40, 'offer', -21, 'Très bon entretien, proposition pour 6 mois à partir de février.'),
    ('Maple Health Lab', 'Machine learning research intern', 'abroad', 'cold_email', 'Montréal', 'Canada', 2, -38, 'interview', -25, null),
    ('Coopérative Terre Vive', 'Stage outils numériques', 'nonprofit', 'referral', 'Toulouse', 'France', 3, -35, 'rejected', -28, 'Le poste a été pourvu en interne.'),
    ('Fintech Polaris', 'Stage backend', 'startup', 'linkedin', 'Paris', 'France', 3, -33, 'no_answer', null, null),
    ('Ministère numérique', 'Stage data publique', 'public_sector', 'job_board', 'Paris', 'France', 1, -30, 'followed_up', null, null),
    ('Kyoto Vision Lab', 'Computer vision intern', 'abroad', 'lab_site', 'Kyoto', 'Japon', 2, -26, 'applied', null, null),
    ('Groupe Hexa', 'Stage ingénieur cloud', 'large_company', 'company_site', 'Lille', 'France', 3, -24, 'no_answer', null, null),
    ('CNRS LIRIS', 'Stage apprentissage par renforcement', 'research', 'lab_site', 'Lyon', 'France', 1, -20, 'interview', -11, null),
    ('Studio Rivage', 'Stage front-end', 'startup', 'school', 'Bordeaux', 'France', 3, -16, 'applied', null, null),
    ('Edinburgh Data Lab', 'Data science intern', 'abroad', 'cold_email', 'Édimbourg', 'Royaume-Uni', 2, -12, 'applied', null, null),
    ('Énergie Ouest', 'Stage data engineer', 'large_company', 'linkedin', 'Rennes', 'France', 1, -9, 'applied', null, null),
    ('Inria Saclay', 'Stage méthodes numériques', 'research', 'lab_site', 'Palaiseau', 'France', 1, -6, 'applied', null, null),
    ('Lumen Analytics', 'Analytics intern', 'abroad', 'job_board', 'Lisbonne', 'Portugal', null, null, 'to_apply', null, null);

  insert into public.applications (user_id, company, role, type, channel, city, country, cv_id, applied_on, follow_up_on, status)
  select
    demo, company, role, type::public.internship_type, channel::public.application_channel, city, country,
    case when cv is null then null else ('22222222-0000-4000-8000-00000000000' || cv)::uuid end,
    case when applied is null then null else current_date + applied end,
    case when applied is null then null else current_date + applied + 10 end,
    case when status = 'to_apply' then 'to_apply'::public.application_status else 'applied'::public.application_status end
  from demo_rows;

  update public.applications a
  set status = r.status::public.application_status,
      answered_on = case when r.answered is null then null else current_date + r.answered end,
      feedback = r.feedback
  from demo_rows r
  where a.user_id = demo and a.company = r.company and a.role = r.role
    and r.status not in ('applied', 'to_apply');
end;
$$;

revoke all on function public.reset_demo() from public, anon, authenticated;

-- The demo account's email and password cannot change, and it cannot be deleted.
create or replace function public.protect_demo_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if public.is_demo_user(old.id) then
      raise exception 'the demo account cannot be deleted';
    end if;
    return old;
  end if;
  if public.is_demo_user(old.id)
     and (new.email is distinct from old.email
          or new.encrypted_password is distinct from old.encrypted_password
          or new.email_change is distinct from old.email_change) then
    raise exception 'the demo account cannot change its email or password';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_demo_user on auth.users;
create trigger protect_demo_user
before update or delete on auth.users
for each row execute function public.protect_demo_user();

-- No file uploads from the demo account.
drop policy if exists "cv files: upload own" on storage.objects;
create policy "cv files: upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not public.is_demo_user((select auth.uid()))
  );

drop policy if exists "avatars: upload own" on storage.objects;
create policy "avatars: upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not public.is_demo_user((select auth.uid()))
  );

-- Reset every hour, and once now.
create extension if not exists pg_cron;
select cron.schedule('reset-demo', '0 * * * *', 'select public.reset_demo()');
select public.reset_demo();
