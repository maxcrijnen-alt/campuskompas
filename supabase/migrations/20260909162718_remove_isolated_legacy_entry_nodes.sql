begin;

do $$
declare
  reference_count bigint;
  deleted_count integer;
begin
  select
    (select count(*) from public.locations where node_id = any(array[
      'R8-1-entry', 'R8-2-entry', 'R8-3-entry',
      'R10-1-entry', 'R10-2-entry', 'R10-3-entry'
    ])) +
    (select count(*) from public.qr_locations where route_node_id = any(array[
      'R8-1-entry', 'R8-2-entry', 'R8-3-entry',
      'R10-1-entry', 'R10-2-entry', 'R10-3-entry'
    ])) +
    (select count(*) from public.route_edges where
      from_node_id = any(array[
        'R8-1-entry', 'R8-2-entry', 'R8-3-entry',
        'R10-1-entry', 'R10-2-entry', 'R10-3-entry'
      ]) or
      to_node_id = any(array[
        'R8-1-entry', 'R8-2-entry', 'R8-3-entry',
        'R10-1-entry', 'R10-2-entry', 'R10-3-entry'
      ]))
  into reference_count;

  if reference_count <> 0 then
    raise exception
      'Legacy entry nodes are still referenced (% references); refusing deletion',
      reference_count;
  end if;

  delete from public.route_nodes
  where id = any(array[
    'R8-1-entry', 'R8-2-entry', 'R8-3-entry',
    'R10-1-entry', 'R10-2-entry', 'R10-3-entry'
  ]);
  get diagnostics deleted_count = row_count;

  if deleted_count not in (0, 6) then
    raise exception
      'Expected zero or six legacy entry nodes, deleted %',
      deleted_count;
  end if;
end
$$;

commit;
