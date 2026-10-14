insert into public.tool_access (tool_id, required_plan, status)
values ('video-gif', 'free', 'active')
on conflict (tool_id) do nothing;