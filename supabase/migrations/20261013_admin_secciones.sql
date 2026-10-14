create or replace function public.admin_users() returns jsonb
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.is_staff() then raise exception 'No autorizado'; end if;
  return coalesce((select jsonb_agg(r) from (
    select p.email, p.created_at, public.effective_plan(p.id) as plan, coalesce(s.status, 'free') as status
    from public.profiles p left join public.subscriptions s on s.user_id = p.id
    order by p.created_at desc limit 200) r), '[]'::jsonb);
end $fn$;

create or replace function public.admin_plans() returns jsonb
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.is_staff() then raise exception 'No autorizado'; end if;
  return coalesce((select jsonb_agg(r) from (
    select p.email, s.plan, s.billing_period, s.status, s.provider, s.current_period_end
    from public.subscriptions s left join public.profiles p on p.id = s.user_id
    order by s.updated_at desc limit 200) r), '[]'::jsonb);
end $fn$;

create or replace function public.admin_usage() returns jsonb
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.is_staff() then raise exception 'No autorizado'; end if;
  return coalesce((select jsonb_agg(r) from (
    select tool_id, sum(used) as total,
      coalesce(sum(used) filter (where usage_date = (now() at time zone 'utc')::date), 0) as today,
      count(distinct user_id) as users
    from public.usage_daily group by tool_id order by total desc) r), '[]'::jsonb);
end $fn$;

create or replace function public.admin_audit() returns jsonb
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.is_admin() then raise exception 'No autorizado'; end if;
  return coalesce((select jsonb_agg(r) from (
    select created_at, action, resource_type, resource_id, result, actor_id
    from public.audit_logs order by created_at desc limit 100) r), '[]'::jsonb);
end $fn$;

revoke all on function public.admin_users(), public.admin_plans(), public.admin_usage(), public.admin_audit() from public, anon;
grant execute on function public.admin_users(), public.admin_plans(), public.admin_usage(), public.admin_audit() to authenticated;