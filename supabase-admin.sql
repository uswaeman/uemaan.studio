create extension if not exists pgcrypto;

create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.products enable row level security;

drop policy if exists "anon can read orders" on public.orders;
drop policy if exists "anon can insert orders" on public.orders;
drop policy if exists "authenticated can insert orders" on public.orders;
drop policy if exists "authenticated can read orders" on public.orders;
drop policy if exists "admins can read orders" on public.orders;
drop policy if exists "admins can update orders" on public.orders;
drop policy if exists "admins can read products" on public.products;
drop policy if exists "admins can write products" on public.products;

create policy "anon can insert orders"
on public.orders
for insert
to anon
with check (true);

create policy "authenticated can insert orders"
on public.orders
for insert
to authenticated
with check (true);

create policy "anon can read orders"
on public.orders
for select
to anon
using (true);

create policy "authenticated can read orders"
on public.orders
for select
to authenticated
using (true);

create policy "admins can read orders"
on public.orders
for select
to authenticated
using (true);

create policy "admins can update orders"
on public.orders
for update
to authenticated
using (true)
with check (true);

create policy "admins can read products"
on public.products
for select
to authenticated
using (true);

create policy "admins can write products"
on public.products
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "admins can manage product images" on storage.objects;
drop policy if exists "public can view product images" on storage.objects;

create policy "admins can manage product images"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-images'
)
with check (
  bucket_id = 'product-images'
);

create policy "public can view product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');


