create table if not exists public.editor_limits (
  plan text primary key check (plan in ('free', 'pro')),
  max_seconds int not null check (max_seconds between 10 and 3600),
  max_short_side int not null check (max_short_side in (480, 720, 1080)),
  max_vclips int not null check (max_vclips between 1 and 200),
  max_aclips int not null check (max_aclips between 1 and 200),
  max_texts int not null check (max_texts between 1 and 200),
  max_media int not null check (max_media between 1 and 100),
  max_projects int not null check (max_projects between 1 and 500)
);

insert into public.editor_limits (plan, max_seconds, max_short_side, max_vclips, max_aclips, max_texts, max_media, max_projects) values
  ('free', 120, 720, 10, 3, 5, 10, 3),
  ('pro', 600, 1080, 50, 10, 30, 30, 50)
on conflict (plan) do nothing;

alter table public.editor_limits enable row level security;
drop policy if exists editor_limits_read on public.editor_limits;
create policy editor_limits_read on public.editor_limits for select to authenticated using (true);

create or replace function public.set_editor_limits(p_plan text, p_limits jsonb)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;
  update public.editor_limits set
    max_seconds = (p_limits->>'max_seconds')::int,
    max_short_side = (p_limits->>'max_short_side')::int,
    max_vclips = (p_limits->>'max_vclips')::int,
    max_aclips = (p_limits->>'max_aclips')::int,
    max_texts = (p_limits->>'max_texts')::int,
    max_media = (p_limits->>'max_media')::int,
    max_projects = (p_limits->>'max_projects')::int
  where plan = p_plan;
  if not found then
    raise exception 'Plan desconocido';
  end if;
  perform public.log_admin_action('set_editor_limits', 'editor_limits', p_plan, p_limits);
end
$fn$;

revoke all on function public.set_editor_limits(text, jsonb) from public, anon;
grant execute on function public.set_editor_limits(text, jsonb) to authenticated;