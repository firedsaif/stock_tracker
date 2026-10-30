-- Khata: single-owner stock ledger.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Keeps every existing product and entry. Old company tables
-- (employees, attendance, expenses, company_balance) are left untouched;
-- the app no longer uses them, so you can drop them later if you want.

-- 1. People who take stock -------------------------------------------------

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text,
  notes text
);

alter table public.people enable row level security;

drop policy if exists "people: signed-in owner" on public.people;
create policy "people: signed-in owner" on public.people
  for all to authenticated using (true) with check (true);

-- 2. Link entries to a person ---------------------------------------------

alter table public.transactions
  add column if not exists person_id uuid references public.people(id) on delete set null;

create index if not exists transactions_person_id_idx on public.transactions (person_id);
create index if not exists transactions_created_at_idx on public.transactions (created_at desc);

-- Deleting an item must not wipe the history of who took it.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'transactions_product_id_fkey'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions drop constraint transactions_product_id_fkey;
  end if;
  alter table public.transactions
    add constraint transactions_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null;
end $$;

-- 3. Turn the old free-text "sold to" names into people --------------------

insert into public.people (name, phone, created_at)
select distinct on (lower(trim(t.sold_to)))
  trim(t.sold_to), nullif(trim(t.contact), ''), t.created_at
from public.transactions t
where t.sold_to is not null
  and trim(t.sold_to) <> ''
  and not exists (
    select 1 from public.people p where lower(p.name) = lower(trim(t.sold_to))
  )
order by lower(trim(t.sold_to)), t.created_at;

update public.transactions t
set person_id = p.id
from public.people p
where t.person_id is null
  and t.sold_to is not null
  and lower(trim(t.sold_to)) = lower(p.name);

-- 4. Atomic stock movements -------------------------------------------------
-- Stock and the entry are written in one transaction, with the item row
-- locked, so two entries at once can never leave the count wrong.

create or replace function public.record_movement(
  p_product_id uuid,
  p_type text,
  p_quantity integer,
  p_unit_price numeric default null,
  p_person_id uuid default null,
  p_notes text default null,
  p_created_at timestamptz default null
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_person_name text;
  v_id uuid;
begin
  if p_type not in ('ADD', 'SELL') then
    raise exception 'Entry type must be ADD or SELL';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be more than 0';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Item not found';
  end if;

  if p_type = 'SELL' and v_product.stock < p_quantity then
    raise exception 'Only % % of % left in stock', v_product.stock, v_product.unit, v_product.name;
  end if;

  if p_person_id is not null then
    select name into v_person_name from public.people where id = p_person_id;
  end if;

  update public.products
  set stock = stock + case when p_type = 'ADD' then p_quantity else -p_quantity end
  where id = p_product_id;

  insert into public.transactions (
    product_id, product_name, product_unit, type, quantity,
    unit_price, total_price, unit_cost,
    person_id, sold_to, notes, user_id, created_at
  ) values (
    p_product_id, v_product.name, v_product.unit, p_type, p_quantity,
    case when p_type = 'SELL' then p_unit_price end,
    case when p_type = 'SELL' and p_unit_price is not null then p_unit_price * p_quantity end,
    case when p_type = 'ADD' then p_unit_price end,
    p_person_id, v_person_name, nullif(trim(p_notes), ''), auth.uid(),
    coalesce(p_created_at, now())
  ) returning id into v_id;

  return v_id;
end $$;

-- Removing an entry puts its stock back the way it was.
create or replace function public.delete_movement(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tx public.transactions%rowtype;
  v_stock integer;
begin
  select * into v_tx from public.transactions where id = p_id for update;
  if not found then
    raise exception 'Entry not found';
  end if;

  if v_tx.product_id is not null and v_tx.deleted_at is null then
    select stock into v_stock from public.products where id = v_tx.product_id for update;
    if found then
      if v_tx.type = 'ADD' and v_stock < v_tx.quantity then
        raise exception 'Cannot remove: % of this stock has already been given out', v_tx.quantity - v_stock;
      end if;
      update public.products
      set stock = stock + case when v_tx.type = 'ADD' then -v_tx.quantity else v_tx.quantity end
      where id = v_tx.product_id;
    end if;
  end if;

  delete from public.transactions where id = p_id;
end $$;

-- Fold a duplicate person (e.g. "Nouman" into "Noman").
create or replace function public.merge_people(p_from uuid, p_into uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_name text;
begin
  if p_from = p_into then
    raise exception 'Pick two different people';
  end if;
  select name into v_name from public.people where id = p_into;
  if v_name is null then
    raise exception 'Person not found';
  end if;

  update public.transactions set person_id = p_into, sold_to = v_name where person_id = p_from;
  update public.people t
  set phone = coalesce(t.phone, f.phone)
  from public.people f
  where t.id = p_into and f.id = p_from;
  delete from public.people where id = p_from;
end $$;

grant execute on function public.record_movement(uuid, text, integer, numeric, uuid, text, timestamptz) to authenticated;
grant execute on function public.delete_movement(uuid) to authenticated;
grant execute on function public.merge_people(uuid, uuid) to authenticated;
