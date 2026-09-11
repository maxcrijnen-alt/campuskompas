alter table public.hidden_gems
  drop constraint hidden_gems_location_choice_check,
  drop constraint hidden_gems_proposed_location_context_check;

alter table public.hidden_gems
  add constraint hidden_gems_location_choice_check
    check (
      (location_id is not null and proposed_location_name is null)
      or (
        location_id is null
        and proposed_location_name is not null
        and length(trim(proposed_location_name)) between 2 and 120
      )
    ),
  add constraint hidden_gems_proposed_location_context_check
    check (
      (location_id is not null and proposed_location_context is null)
      or (
        location_id is null
        and proposed_location_context is not null
        and proposed_location_context in ('r8', 'r10', 'campus_outdoor', 'other')
      )
    );

comment on constraint hidden_gems_location_choice_check
  on public.hidden_gems is
  'Requires either one canonical location or a non-empty proposed location name.';

comment on constraint hidden_gems_proposed_location_context_check
  on public.hidden_gems is
  'Every unlinked location proposal has an explicit constrained indoor, outdoor, or other context.';
