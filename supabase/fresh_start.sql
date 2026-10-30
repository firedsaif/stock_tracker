-- Fresh start: empties the khata so the website begins with no items,
-- no people and no entries. Tables, functions and logins are kept.
--
-- A full copy of the data was saved on 30 Oct 2026 to
--   D:\mamu companu\stock_tracker_backup_2026-10-30\
-- This cannot be undone from inside Supabase.

begin;

truncate table
  public.transactions,
  public.people,
  public.products
restart identity cascade;

-- Old company tables the new app no longer uses.
truncate table
  public.attendance,
  public.employees,
  public.expenses
restart identity cascade;

commit;

-- Check: every count should be 0.
select
  (select count(*) from public.products)     as items,
  (select count(*) from public.people)       as people,
  (select count(*) from public.transactions) as entries;
