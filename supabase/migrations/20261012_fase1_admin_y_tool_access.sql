-- =====================================================================
-- Kompvid · Fase 1: acceso por herramienta + roles de staff + auditoria
-- =====================================================================

-- ---------- A. Plan requerido por herramienta ----------
create table if not exists public.tool_access (
  tool_id text primary key,
  required_plan text not null check (required_plan in ('free', 'pro'))
);
alter table public.tool_access enable row level security;
drop policy if exists "tool_access_read" on public.tool_access;
create policy "tool_access_read" on public.tool_access
  for select to authenticated using (true);

insert into public.tool_access (tool_id, required_plan) values
  ('video-compressor', 'free'),
  ('background-remover', 'pro')
on conflict (tool_id) do update set required_plan = excluded.required_plan;

create or replace function public.consume_usage(p_tool_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_required text;
  v_limit integer;
  v_used integer;
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;

  select required_plan into v_required from public.tool_access where tool_id = p_tool_id;
  if v_required is null then
    return jsonb_build_object('allowed', false, 'reason', 'unknown_tool');
  end if;

  v_plan := public.effective_plan(v_user);

  if v_required = 'pro' and v_plan <> 'pro' then
    return jsonb_build_object('allowed', false, 'reason', 'plan_required', 'plan', v_plan);
  end if;

  select daily_operations into v_limit from public.plan_config where plan = v_plan;

  if v_limit is not null and v_limit <= 0 then
    return jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'plan', v_plan, 'limit', v_limit);
  end if;

  insert into public.usage_daily as u (user_id, usage_date, tool_id, used)
  values (v_user, (now() at time zone 'utc')::date, p_tool_id, 1)
  on conflict (user_id, usage_date, tool_id)
  do update set used = u.used + 1
  where v_limit is null or u.used < v_limit
  returning u.used into v_used;

  if v_used is null then
    return jsonb_build_object('allowed', false, 'reason', 'limit_reached', 'plan', v_plan, 'limit', v_limit);
  end if;

  return jsonb_build_object('allowed', true, 'plan', v_plan, 'used', v_used, 'limit', v_limit);
end;
$function$;

-- ---------- B. Roles de staff ----------
create table if not exists public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'support')),
  created_at timestamptz not null default now()
);
alter table public.admin_roles enable row level security;
drop policy if exists "admin_roles_read_own" on public.admin_roles;
create policy "admin_roles_read_own" on public.admin_roles
  for select to authenticated using (user_id = auth.uid());
-- Sin politicas de insert/update/delete: los roles solo se cambian desde SQL o funciones del servidor.

create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.admin_roles where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid() and role = 'admin')
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid())
$$;

revoke all on function public.current_staff_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ---------- C. Auditoria (solo anexar, sin editar ni borrar) ----------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  resource_type text,
  resource_id text,
  result text not null default 'ok',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
alter table public.audit_logs enable row level security;
drop policy if exists "audit_logs_admin_read" on public.audit_logs;
create policy "audit_logs_admin_read" on public.audit_logs
  for select to authenticated using (public.is_admin());

create or replace function public.audit_logs_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs es de solo anexado';
end;
$$;
drop trigger if exists audit_logs_no_change on public.audit_logs;
create trigger audit_logs_no_change
  before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- Solo la usan otras funciones del servidor; ningun cliente puede escribir en la auditoria.
create or replace function public.log_admin_action(
  p_action text, p_resource_type text default null, p_resource_id text default null,
  p_details jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, resource_type, resource_id, details)
  values (auth.uid(), p_action, p_resource_type, p_resource_id, coalesce(p_details, '{}'::jsonb));
end;
$$;
revoke all on function public.log_admin_action(text, text, text, jsonb) from public, anon, authenticated;

-- ---------- D. Resumen del panel (solo datos reales, solo staff) ----------
create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'No autorizado';
  end if;
  return jsonb_build_object(
    'users_total',         (select count(*) from public.profiles),
    'users_7d',            (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'users_30d',           (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    'pro_active',          (select count(*) from public.subscriptions where plan = 'pro' and status = 'active'),
    'pending',             (select count(*) from public.subscriptions where status = 'pending'),
    'past_due',            (select count(*) from public.subscriptions where status = 'past_due'),
    'canceled_or_expired', (select count(*) from public.subscriptions where status in ('canceled', 'expired')),
    'suspended',           (select count(*) from public.subscriptions where status = 'suspended'),
    'operations_total',    (select coalesce(sum(used), 0) from public.usage_daily),
    'operations_today',    (select coalesce(sum(used), 0) from public.usage_daily where usage_date = (now() at time zone 'utc')::date),
    'compressor_total',    (select coalesce(sum(used), 0) from public.usage_daily where tool_id = 'video-compressor'),
    'generated_at',        now()
  );
end;
$$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;