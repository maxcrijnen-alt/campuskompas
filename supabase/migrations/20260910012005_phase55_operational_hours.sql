alter table public.location_categories
  add column if not exists hours_relevant boolean not null default false;

alter table public.opening_hours
  add column if not exists hours_kind text not null default 'physical_opening',
  add column if not exists display_note jsonb not null default '{"nl":"","en":""}'::jsonb,
  add column if not exists timezone text not null default 'Europe/Amsterdam';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opening_hours'::regclass
      and conname = 'opening_hours_kind_valid'
  ) then
    alter table public.opening_hours
      add constraint opening_hours_kind_valid
      check (hours_kind in ('physical_opening', 'building_access', 'service_contact'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opening_hours'::regclass
      and conname = 'opening_hours_timezone_amsterdam'
  ) then
    alter table public.opening_hours
      add constraint opening_hours_timezone_amsterdam
      check (timezone = 'Europe/Amsterdam');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.opening_hours'::regclass
      and conname = 'opening_hours_display_note_bilingual'
  ) then
    alter table public.opening_hours
      add constraint opening_hours_display_note_bilingual
      check (
        jsonb_typeof(display_note) = 'object'
        and display_note ? 'nl'
        and display_note ? 'en'
        and jsonb_typeof(display_note->'nl') = 'string'
        and jsonb_typeof(display_note->'en') = 'string'
      );
  end if;
end
$$;

alter table public.hidden_gems
  add column if not exists hours_id text references public.opening_hours(id) on delete set null;

create index if not exists hidden_gems_hours_idx on public.hidden_gems(hours_id);

update public.location_categories
set hours_relevant = id in (
  'library', 'coffee', 'food', 'canteen', 'cafe', 'info',
  'reception', 'service', 'entrance', 'document'
);

update public.source_records
set verified_at = date '2026-09-10',
    verification_status = 'verified'
where id in ('campus', 'catering', 'library');

insert into public.opening_hours (
  id, weekly, exceptions, verified_at, verification_status,
  exceptions_reviewed_through, source_url, hours_kind, display_note, timezone
)
values
(
  'R8',
  '{"0":[],"1":[["07:30","18:00"]],"2":[["07:30","18:00"]],"3":[["07:30","18:00"]],"4":[["07:30","18:00"]],"5":[["07:30","18:00"]],"6":[]}'::jsonb,
  '{}'::jsonb,
  date '2026-09-10',
  'verified',
  date '2026-10-11',
  'https://www.nhlstenden.com/locaties/leeuwarden',
  'building_access',
  '{"nl":"Gebouwuren; vakanties en extreem weer kunnen afwijken.","en":"Building hours; holidays and extreme weather may differ."}'::jsonb,
  'Europe/Amsterdam'
),
(
  'R10',
  '{"0":[],"1":[["07:30","22:00"]],"2":[["07:30","22:00"]],"3":[["07:30","22:00"]],"4":[["07:30","22:00"]],"5":[["07:30","18:00"]],"6":[]}'::jsonb,
  '{}'::jsonb,
  date '2026-09-10',
  'verified',
  date '2026-10-11',
  'https://www.nhlstenden.com/locaties/leeuwarden',
  'building_access',
  '{"nl":"Gebouwuren; vakanties en extreem weer kunnen afwijken.","en":"Building hours; holidays and extreme weather may differ."}'::jsonb,
  'Europe/Amsterdam'
),
(
  'library',
  '{"0":[],"1":[["08:30","17:00"]],"2":[["08:30","17:00"]],"3":[["08:30","17:00"]],"4":[["08:30","17:00"]],"5":[["08:30","17:00"]],"6":[]}'::jsonb,
  '{"2026-10-12":[["09:00","13:00"]],"2026-10-13":[["09:00","13:00"]],"2026-10-14":[["09:00","13:00"]],"2026-10-15":[["09:00","13:00"]],"2026-10-16":[["09:00","13:00"]]}'::jsonb,
  date '2026-09-10',
  'verified',
  date '2026-10-16',
  'https://www.nhlstenden.com/bibliotheek/over-de-bibliotheek/openingstijden',
  'physical_opening',
  '{"nl":"Tijdens de herfstvakantie, 12 t/m 16 oktober 2026, is de bibliotheek geopend van 09:00 tot 13:00.","en":"During the autumn break, 12–16 October 2026, the library is open from 09:00 to 13:00."}'::jsonb,
  'Europe/Amsterdam'
),
(
  'student-info-contact',
  '{"0":[],"1":[["08:30","16:30"]],"2":[["08:30","16:30"]],"3":[["08:30","16:30"]],"4":[["08:30","16:30"]],"5":[["08:30","16:30"]],"6":[]}'::jsonb,
  '{}'::jsonb,
  date '2026-09-10',
  'verified',
  date '2026-10-11',
  'https://www.nhlstenden.com/werken-en-studeren/kom-in-contact',
  'service_contact',
  '{"nl":"Dit zijn telefoontijden. WhatsApp is op werkdagen bereikbaar van 09:30 tot 16:30; fysieke balie-uren zijn niet bevestigd.","en":"These are phone hours. WhatsApp is available on weekdays from 09:30 to 16:30; physical desk hours are not confirmed."}'::jsonb,
  'Europe/Amsterdam'
),
(
  'bruze',
  '{}'::jsonb,
  '{}'::jsonb,
  date '2026-09-10',
  'needs_review',
  null,
  'https://www.nhlstenden.com/locaties/leeuwarden/catering',
  'physical_opening',
  '{"nl":"De officiële cateringpagina noemt 09:00–18:00, maar vermeldt geen weekdagen. Daarom tonen we geen open/gesloten-claim.","en":"The official catering page states 09:00–18:00 but does not specify weekdays, so no open/closed claim is shown."}'::jsonb,
  'Europe/Amsterdam'
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
  updated_at = now();

update public.locations
set hours_id = 'student-info-contact',
    description = jsonb_build_object(
      'nl', 'Hulp bij praktische vragen. De getoonde tijden zijn telefoon- en contacttijden; fysieke balie-uren zijn niet bevestigd.',
      'en', 'Help with practical questions. The displayed hours are phone and contact hours; physical desk hours are not confirmed.'
    )
where id = 'student-info';

update public.locations
set name = '{"nl":"iShop (voormalig)","en":"iShop (former)"}'::jsonb,
    description = jsonb_build_object(
      'nl', 'Historisch routepunt op R8. De actuele Campus Store is samengevoegd met het Document Center op R10; de exacte actuele kaartpositie moet nog worden bevestigd.',
      'en', 'Historic R8 route point. The current Campus Store was merged with the Document Center at R10; its exact current map position still needs confirmation.'
    ),
    verification_status = 'needs_review',
    verification_notes = 'Legacy routing fixture; not the current Campus Store. Keep loc-ishop for backward-compatible routes until the current R10 position is physically verified.'
where id = 'ishop';

update public.locations
set name = '{"nl":"Documentcentrum (voormalig)","en":"Document Centre (former)"}'::jsonb,
    description = jsonb_build_object(
      'nl', 'Historisch routepunt. Het Document Center is samengevoegd in de Campus Store op R10; de actuele baliepositie moet nog worden bevestigd.',
      'en', 'Historic route point. The Document Center was merged into the Campus Store at R10; the current desk position still needs confirmation.'
    ),
    verification_status = 'needs_review',
    verification_notes = 'The 2025 annual report confirms the merger into Campus Store; current exact R10 map position remains unverified.'
where id = 'document-centre';

update public.hidden_gems
set hours_id = 'bruze'
where lower(title) = 'bruze'
  and status = 'approved';
