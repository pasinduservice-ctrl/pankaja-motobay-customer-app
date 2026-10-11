-- Pankaja Motobay App schema for a NEW Supabase project.
-- Review before running. Do not run on the existing website project unless you have confirmed it is safe.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  language text not null default 'English',
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null,
  vehicle_type text not null,
  preferred_date date not null,
  note text,
  status text not null default 'pending' check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'customer')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tips enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "profiles select self or admin" on public.profiles;
create policy "profiles select self or admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update self basic" on public.profiles;
create policy "profiles update self basic" on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'customer');

drop policy if exists "published tips readable by everyone" on public.tips;
create policy "published tips readable by everyone" on public.tips for select to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "admin manages tips" on public.tips;
create policy "admin manages tips" on public.tips for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customers read own bookings or admin" on public.bookings;
create policy "customers read own bookings or admin" on public.bookings for select to authenticated
using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "customers create own bookings" on public.bookings;
create policy "customers create own bookings" on public.bookings for insert to authenticated
with check (customer_id = auth.uid());

drop policy if exists "admin updates bookings" on public.bookings;
create policy "admin updates bookings" on public.bookings for update to authenticated
using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.tips to anon, authenticated;
grant select, insert, update on public.bookings to authenticated;
grant select, update on public.profiles to authenticated;
grant all on public.tips to authenticated;

-- After creating the admin account using Supabase Authentication > Users,
-- copy that user's UUID and run this separately:
-- update public.profiles set role = 'admin' where id = 'PASTE-ADMIN-USER-UUID-HERE';
