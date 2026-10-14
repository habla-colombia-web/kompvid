create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 120),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  staff_note text,
  created_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
drop policy if exists st_select on public.support_tickets;
drop policy if exists st_insert on public.support_tickets;
drop policy if exists st_update on public.support_tickets;
create policy st_select on public.support_tickets for select to authenticated using (user_id = (select auth.uid()) or public.is_staff());
create policy st_insert on public.support_tickets for insert to authenticated with check (user_id = (select auth.uid()) and status = 'open');
create policy st_update on public.support_tickets for update to authenticated using (public.is_staff()) with check (public.is_staff());

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists an_select on public.announcements;
drop policy if exists an_write on public.announcements;
create policy an_select on public.announcements for select to authenticated using (active or public.is_staff());
create policy an_write on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.app_settings (
  key text primary key,
  value text not null default ''
);
alter table public.app_settings enable row level security;
drop policy if exists as_select on public.app_settings;
drop policy if exists as_write on public.app_settings;
create policy as_select on public.app_settings for select to authenticated using (true);
create policy as_write on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.app_settings (key, value) values ('maintenance','off'), ('banner','') on conflict (key) do nothing;