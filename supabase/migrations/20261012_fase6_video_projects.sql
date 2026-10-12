create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  data jsonb not null check (pg_column_size(data) < 300000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_projects_user_idx on public.video_projects (user_id, updated_at desc);

alter table public.video_projects enable row level security;

drop policy if exists video_projects_select_own on public.video_projects;
drop policy if exists video_projects_insert_own on public.video_projects;
drop policy if exists video_projects_update_own on public.video_projects;
drop policy if exists video_projects_delete_own on public.video_projects;

create policy video_projects_select_own on public.video_projects
  for select to authenticated using (user_id = (select auth.uid()));
create policy video_projects_insert_own on public.video_projects
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy video_projects_update_own on public.video_projects
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy video_projects_delete_own on public.video_projects
  for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.video_projects_touch()
returns trigger language plpgsql set search_path = public as $fn$
begin
  new.updated_at = now();
  new.user_id = old.user_id;
  return new;
end
$fn$;

drop trigger if exists video_projects_touch on public.video_projects;
create trigger video_projects_touch before update on public.video_projects
  for each row execute function public.video_projects_touch();