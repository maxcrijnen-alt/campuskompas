-- Phase 4: connect critical public facilities to the nearest traced corridor
-- positions on the published floor plan. The room/facility markers remain at
-- their printed label positions; these nodes represent the corridor endpoints.
do $$
begin
  if not exists (
    select 1 from public.route_nodes
    where id = 'plan-R8-0-10-38_8' and floor_id = 'R8-0'
  ) then
    raise exception 'Missing traced iShop corridor endpoint';
  end if;

  if not exists (
    select 1 from public.route_nodes
    where id = 'plan-R8-0-14-29_2' and floor_id = 'R8-0'
  ) then
    raise exception 'Missing traced library corridor endpoint';
  end if;

  update public.locations
  set node_id = case id
    when 'ishop' then 'plan-R8-0-10-38_8'
    when 'library' then 'plan-R8-0-14-29_2'
  end,
  updated_at = now()
  where id in ('ishop', 'library');
end
$$;
