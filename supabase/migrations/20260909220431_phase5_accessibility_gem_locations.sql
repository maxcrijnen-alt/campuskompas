alter table public.locations
  add column routing_status text not null default 'needs_review',
  add column endpoint_source text;

alter table public.locations
  add constraint locations_routing_status_check
    check (routing_status in ('direct','inferred','needs_review','unavailable')),
  add constraint locations_endpoint_source_check
    check (endpoint_source is null or endpoint_source in ('existing_mapping','manual','inferred')),
  add constraint locations_routing_endpoint_check
    check (
      (routing_status in ('direct','inferred') and node_id is not null and endpoint_source is not null)
      or (routing_status in ('needs_review','unavailable'))
    );

update public.locations
set routing_status = case when node_id is null then 'unavailable' else 'direct' end,
    endpoint_source = case when node_id is null then null else 'existing_mapping' end;

create index locations_routing_status_idx
  on public.locations(routing_status, status);

alter table public.hidden_gems
  alter column location_id drop not null,
  add column location_review_status text not null default 'linked',
  add column proposed_location_name text,
  add column proposed_building_id text references public.buildings(id),
  add column proposed_floor_id text,
  add column proposed_room_zone text,
  add column proposed_location_description text,
  add column proposed_location_source_url text,
  add column proposed_location_notes text;

alter table public.hidden_gems
  add constraint hidden_gems_location_review_status_check
    check (location_review_status in ('linked','proposed','needs_review','approved','rejected')),
  add constraint hidden_gems_location_choice_check
    check (
      (location_id is not null and proposed_location_name is null)
      or (location_id is null and length(trim(proposed_location_name)) between 2 and 120)
    ),
  add constraint hidden_gems_proposed_floor_building_check
    check (proposed_floor_id is null or proposed_building_id is not null),
  add constraint hidden_gems_proposed_source_url_check
    check (proposed_location_source_url is null or proposed_location_source_url ~ '^https://'),
  add constraint hidden_gems_proposed_floor_fk
    foreign key (proposed_floor_id, proposed_building_id)
    references public.floors(id, building_id);

update public.hidden_gems
set location_review_status = 'linked'
where location_id is not null;

-- Official NHL Stenden information places BRÛZE at Rengerslaan 1. The current
-- R10_MAIN link points to another address and is therefore not precise enough.
-- Keep the approved community content, but withhold routing until its map point
-- and graph endpoint have been physically verified.
update public.hidden_gems
set location_id = null,
    location_review_status = 'needs_review',
    proposed_location_name = 'Café BRÛZE',
    proposed_location_description = 'Rengerslaan 1, op de campus nabij de bushalte. Exacte kaartpositie en route-endpoint nog te verifiëren.',
    proposed_location_source_url = 'https://www.nhlstenden.com/campus-connect/cafe-bruze-Leeuwarden',
    proposed_location_notes = 'Voeg pas een canonieke locatie toe nadat gebouw, kaartpositie, ingang en toegankelijkheid op locatie zijn gecontroleerd.'
where lower(title) in ('bruze', 'brûze')
  and location_id = 'R10_MAIN';

create index hidden_gems_location_review_idx
  on public.hidden_gems(location_review_status, status);
create index hidden_gems_proposed_building_idx
  on public.hidden_gems(proposed_building_id);
create index hidden_gems_proposed_floor_building_idx
  on public.hidden_gems(proposed_floor_id, proposed_building_id);

comment on column public.route_nodes.accessible is
  'Meaningful only when accessibility_status=verified; otherwise accessibility is unknown.';
comment on column public.route_edges.accessible is
  'Meaningful only when accessibility_status=verified; otherwise accessibility is unknown. Stairs are always excluded from wheelchair routes.';
comment on column public.hidden_gems.location_id is
  'Canonical routeable location after moderation; null while a proposed place is unverified.';
