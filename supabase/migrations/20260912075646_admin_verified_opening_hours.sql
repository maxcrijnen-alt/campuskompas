alter table public.opening_hours
  drop constraint if exists opening_hours_manual_admin_not_verified;

update public.opening_hours
set verification_status = 'verified',
    verified_at = current_date,
    updated_at = now()
where source_type = 'manual_admin'
  and verification_status <> 'verified';

comment on column public.opening_hours.source_type is
  'Provenance class. A verified manual_admin record is explicitly confirmed by a provisioned CampusKompas administrator; it is not presented as an official web source.';
