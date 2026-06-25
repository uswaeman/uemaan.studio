create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- For simple storefront use: allow anonymous insert/select.
-- Tighten these policies later with auth if needed.
create policy if not exists "anon can insert orders"
on public.orders
for insert
to anon
with check (true);

create policy if not exists "anon can read orders"
on public.orders
for select
to anon
using (true);
