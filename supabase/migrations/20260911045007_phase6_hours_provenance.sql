alter table public.opening_hours
  drop constraint if exists opening_hours_source_url_check;

alter table public.opening_hours
  alter column source_url drop not null,
  add column source_type text not null default 'official_web',
  add column source_description text not null default '';

update public.opening_hours
set source_type = 'official_web',
    source_description = case id
      when 'R8' then 'Official NHL Stenden Leeuwarden campus page for Rengerslaan 8 building access.'
      when 'R10' then 'Official NHL Stenden Leeuwarden campus page for Rengerslaan 10 building access.'
      when 'library' then 'Official NHL Stenden library opening-hours page.'
      when 'student-info-contact' then 'Official NHL Stenden Student Info contact page.'
      when 'bruze' then 'Official NHL Stenden Leeuwarden catering page; weekdays remain unspecified.'
      else 'Official webpage recorded with this opening-hours entry.'
    end
where source_type = 'official_web'
  and trim(source_description) = '';

alter table public.opening_hours
  add constraint opening_hours_source_type_valid
    check (source_type in (
      'official_web',
      'physical_signage',
      'staff_confirmation',
      'manual_admin'
    )),
  add constraint opening_hours_source_url_valid
    check (source_url is null or source_url ~ '^https://[^[:space:]]+$'),
  add constraint opening_hours_source_provenance_present
    check (
      length(trim(source_description)) between 3 and 500
      and (source_type <> 'official_web' or source_url is not null)
    ),
  add constraint opening_hours_manual_admin_not_verified
    check (source_type <> 'manual_admin' or verification_status <> 'verified');

comment on column public.opening_hours.source_type is
  'Provenance class. manual_admin is intentionally weaker than verified official, signage, or staff sources.';
comment on column public.opening_hours.source_description is
  'Short human-readable description of where and how the schedule was checked.';
