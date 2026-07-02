create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "anon can insert orders" on public.orders;
drop policy if exists "anon can read orders" on public.orders;
drop policy if exists "authenticated can insert orders" on public.orders;
drop policy if exists "authenticated can read orders" on public.orders;

create policy if not exists "anon can insert orders"
on public.orders
for insert
to anon
with check (true);

create policy if not exists "authenticated can insert orders"
on public.orders
for insert
to authenticated
with check (true);

create policy if not exists "anon can read orders"
on public.orders
for select
to anon
using (true);

create policy if not exists "authenticated can read orders"
on public.orders
for select
to authenticated
using (true);
