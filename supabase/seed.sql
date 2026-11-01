-- Local demo data. Runs on `npx supabase db reset`.
-- The demo account (demo@herbarium.test / demo-herbarium-2026) and its
-- fictional examples are created by the migration 20261101120000_demo_account,
-- in production too; this only restores them.
select public.reset_demo();
