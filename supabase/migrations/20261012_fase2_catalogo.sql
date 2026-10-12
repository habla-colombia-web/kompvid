-- Kompvid - Fase 2: estado de herramientas y resumen de cuenta

alter table public.tool_access
  add column if not exists status text not null default 'active'
  check (status in ('development', 'active', 'disabled'));

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
  v_status text;
  v_limit integer;
  v_used integer;
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;

  select required_plan, status into v_required, v_status
  from public.tool_access where tool_id = p_tool_id;
  if v_required is null then
    return jsonb_build_object('allowed', false, 'reason', 'unknown_tool');
  end if;

  if v_status <> 'active' then
    return jsonb_build_object('allowed', false, 'reason', 'tool_unavailable');
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

create or replace function public.my_account_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_status text;
  v_end timestamptz;
  v_limit integer;
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;

  v_plan := public.effective_plan(v_user);
  select status, current_period_end into v_status, v_end
  from public.subscriptions where user_id = v_user;
  select daily_operations into v_limit from public.plan_config where plan = v_plan;

  return jsonb_build_object(
    'plan', v_plan,
    'status', coalesce(v_status, 'free'),
    'current_period_end', v_end,
    'daily_limit', v_limit,
    'usage_today', coalesce((
      select jsonb_agg(jsonb_build_object('tool_id', u.tool_id, 'used', u.used))
      from public.usage_daily u
      where u.user_id = v_user and u.usage_date = (now() at time zone 'utc')::date
    ), '[]'::jsonb),
    'tools', coalesce((
      select jsonb_agg(jsonb_build_object('tool_id', t.tool_id, 'required_plan', t.required_plan, 'status', t.status))
      from public.tool_access t
    ), '[]'::jsonb)
  );
end;
$function$;

revoke all on function public.my_account_overview() from public, anon;
grant execute on function public.my_account_overview() to authenticated;