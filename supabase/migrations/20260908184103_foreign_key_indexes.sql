create index if not exists locations_building_idx on public.locations(building_id);
create index if not exists locations_floor_building_idx on public.locations(floor_id, building_id);
create index if not exists route_nodes_building_idx on public.route_nodes(building_id);
create index if not exists route_nodes_floor_building_idx on public.route_nodes(floor_id, building_id);
