-- Hardening after the security audit of 2026-11-01.

-- 1. Account deletion must not leave files behind. The app deletes the
-- user's files first (server side); this function now refuses to delete the
-- account while any remain, so a direct RPC call can no longer orphan them.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  if exists (
    select 1 from storage.objects
    where bucket_id in ('cvs', 'avatars')
      and (storage.foldername(name))[1] = uid::text
  ) then
    raise exception 'files remain: delete them before deleting the account'
      using errcode = 'P0001';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 2. Stored file paths always point inside the owner's own folder, so the
-- database never depends on Storage policies alone to keep them apart.
alter table public.profiles
  add constraint profiles_avatar_path_own_folder
  check (avatar_path is null or avatar_path like id::text || '/%');

alter table public.cvs
  add constraint cvs_file_path_own_folder
  check (file_path is null or file_path like user_id::text || '/%');
