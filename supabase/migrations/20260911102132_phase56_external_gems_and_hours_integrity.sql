alter table public.hidden_gems
  add column proposed_location_context text;

update public.hidden_gems
set proposed_location_context = case proposed_building_id
  when 'R8' then 'r8'
  when 'R10' then 'r10'
  else 'other'
end
where location_id is null;

alter table public.hidden_gems
  add constraint hidden_gems_proposed_location_context_check
    check (
      (location_id is not null and proposed_location_context is null)
      or (
        location_id is null
        and proposed_location_context in ('r8', 'r10', 'campus_outdoor', 'other')
      )
    ),
  add constraint hidden_gems_proposed_context_building_check
    check (
      (
        proposed_location_context = 'r8'
        and proposed_building_id is not distinct from 'R8'
      )
      or (
        proposed_location_context = 'r10'
        and proposed_building_id is not distinct from 'R10'
      )
      or (
        proposed_location_context in ('campus_outdoor', 'other')
        and proposed_building_id is null
        and proposed_floor_id is null
      )
      or proposed_location_context is null
    );

comment on column public.hidden_gems.proposed_location_context is
  'Classifies an unlinked proposal as R8, R10, campus outdoor, or another external place. It never creates routing data.';

create or replace function public.admin_save_opening_hours_link(
  p_hours jsonb,
  p_target_type text,
  p_target_id text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_hours_id text := p_hours->>'id';
  v_hours_kind text := p_hours->>'hours_kind';
  v_previous_hours_id text;
  v_category_id text;
  v_hours_relevant boolean;
  v_target_status text;
  v_existing boolean;
  v_link_count integer;
begin
  if not (select private.is_admin()) then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  if (p_target_type is null) <> (p_target_id is null) then
    raise exception 'hours target must be complete' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.opening_hours where id = v_hours_id
  ) into v_existing;

  perform 1 from public.locations where hours_id = v_hours_id for update;
  perform 1 from public.hidden_gems where hours_id = v_hours_id for update;

  if exists (
    select 1
    from public.locations as location
    join public.location_categories as category
      on category.id = location.category_id
    where location.hours_id = v_hours_id
      and (
        location.status <> 'approved'
        or not category.hours_relevant
        or (v_hours_kind = 'building_access' and location.category_id <> 'entrance')
        or (
          v_hours_kind = 'service_contact'
          and location.category_id not in ('info', 'service', 'reception')
        )
      )
  ) then
    raise exception 'existing hours link is incompatible with this schedule type'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.hidden_gems
    where hours_id = v_hours_id and status <> 'approved'
  ) then
    raise exception 'existing Hidden Gem hours link is not approved'
      using errcode = '22023';
  end if;

  select count(*) into v_link_count
  from (
    select id::text from public.locations where hours_id = v_hours_id
    union all
    select id::text from public.hidden_gems where hours_id = v_hours_id
  ) as links;

  if p_target_type is null and (not v_existing or v_link_count = 0) then
    raise exception 'new or unlinked hours require a selected target'
      using errcode = '22023';
  end if;

  if p_target_type = 'location' then
    select
      location.hours_id,
      location.category_id,
      category.hours_relevant,
      location.status
    into
      v_previous_hours_id,
      v_category_id,
      v_hours_relevant,
      v_target_status
    from public.locations as location
    join public.location_categories as category
      on category.id = location.category_id
    where location.id = p_target_id
    for update of location;

    if not found or not v_hours_relevant or v_target_status <> 'approved' then
      raise exception 'hours target is not a supported facility'
        using errcode = '22023';
    end if;
    if v_hours_kind = 'building_access' and v_category_id <> 'entrance' then
      raise exception 'building access hours require an entrance'
        using errcode = '22023';
    end if;
    if v_hours_kind = 'service_contact'
      and v_category_id not in ('info', 'service', 'reception') then
      raise exception 'contact hours require a service facility'
        using errcode = '22023';
    end if;
  elsif p_target_type = 'hidden_gem' then
    select hours_id, status
    into v_previous_hours_id, v_target_status
    from public.hidden_gems
    where id::text = p_target_id
    for update;

    if not found or v_target_status <> 'approved' then
      raise exception 'Hidden Gem target not found' using errcode = '22023';
    end if;
  elsif p_target_type is not null then
    raise exception 'unsupported hours target type' using errcode = '22023';
  end if;

  insert into public.opening_hours (
    id,
    weekly,
    exceptions,
    verified_at,
    verification_status,
    exceptions_reviewed_through,
    source_url,
    hours_kind,
    display_note,
    timezone,
    source_type,
    source_description
  )
  values (
    v_hours_id,
    coalesce(p_hours->'weekly', '{}'::jsonb),
    coalesce(p_hours->'exceptions', '{}'::jsonb),
    (p_hours->>'verified_at')::date,
    (p_hours->>'verification_status')::public.verification,
    nullif(p_hours->>'exceptions_reviewed_through', '')::date,
    nullif(p_hours->>'source_url', ''),
    v_hours_kind,
    coalesce(p_hours->'display_note', '{"nl":"","en":""}'::jsonb),
    p_hours->>'timezone',
    p_hours->>'source_type',
    p_hours->>'source_description'
  )
  on conflict (id) do update set
    weekly = excluded.weekly,
    exceptions = excluded.exceptions,
    verified_at = excluded.verified_at,
    verification_status = excluded.verification_status,
    exceptions_reviewed_through = excluded.exceptions_reviewed_through,
    source_url = excluded.source_url,
    hours_kind = excluded.hours_kind,
    display_note = excluded.display_note,
    timezone = excluded.timezone,
    source_type = excluded.source_type,
    source_description = excluded.source_description,
    updated_at = now();

  if p_target_type = 'location' then
    update public.locations
    set hours_id = v_hours_id,
        updated_at = now()
    where id = p_target_id;
  elsif p_target_type = 'hidden_gem' then
    update public.hidden_gems
    set hours_id = v_hours_id,
        updated_at = now()
    where id::text = p_target_id;
  end if;

  if v_previous_hours_id is not null
    and v_previous_hours_id <> v_hours_id
    and not exists (
      select 1 from public.locations where hours_id = v_previous_hours_id
      union all
      select 1 from public.hidden_gems where hours_id = v_previous_hours_id
    ) then
    delete from public.opening_hours where id = v_previous_hours_id;
  end if;

  return jsonb_build_object(
    'hours_id', v_hours_id,
    'target_type', p_target_type,
    'target_id', p_target_id
  );
end
$$;

revoke all on function public.admin_save_opening_hours_link(jsonb, text, text)
  from public, anon;
grant execute on function public.admin_save_opening_hours_link(jsonb, text, text)
  to authenticated;

comment on function public.admin_save_opening_hours_link(jsonb, text, text) is
  'Atomically saves structured hours, validates every existing link, and optionally links one admin-selected facility or Hidden Gem.';
