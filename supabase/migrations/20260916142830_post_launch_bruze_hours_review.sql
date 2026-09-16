begin;

update public.opening_hours
set weekly = '{}'::jsonb,
    exceptions = '{}'::jsonb,
    verified_at = date '2026-09-16',
    verification_status = 'needs_review',
    exceptions_reviewed_through = null,
    source_url = 'https://www.nhlstenden.com/locaties/leeuwarden/catering',
    source_type = 'official_web',
    source_description = 'Official NHL Stenden Leeuwarden catering page; weekdays remain unspecified.',
    hours_kind = 'physical_opening',
    display_note = jsonb_build_object(
      'nl', 'De officiële cateringpagina noemt 09:00–18:00, maar vermeldt geen weekdagen. Daarom tonen we geen open/gesloten-claim.',
      'en', 'The official catering page states 09:00–18:00 but does not specify weekdays, so no open/closed claim is shown.'
    ),
    timezone = 'Europe/Amsterdam',
    updated_at = now()
where id = 'bruze';

commit;
