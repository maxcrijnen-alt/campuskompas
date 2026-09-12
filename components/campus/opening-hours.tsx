import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Phone,
} from 'lucide-react';
import {
  addCalendarDays,
  openingState,
  type OpeningState,
} from '@/lib/campus/hours';
import type { Hours, Locale } from '@/lib/campus/types';

const days = {
  nl: [
    'Zondag',
    'Maandag',
    'Dinsdag',
    'Woensdag',
    'Donderdag',
    'Vrijdag',
    'Zaterdag',
  ],
  en: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
};

function periodsLabel(
  periods: [string, string][] | null | undefined,
  en: boolean,
) {
  if (periods === null || periods === undefined)
    return en ? 'Not confirmed' : 'Niet bevestigd';
  if (periods.length === 0) return en ? 'Closed' : 'Gesloten';
  return periods.map(([start, end]) => `${start}–${end}`).join(', ');
}

function nextLabel(
  opensDate: string | undefined,
  opensAt: string | undefined,
  date: string,
  locale: Locale,
) {
  if (!opensDate || !opensAt) return null;
  const en = locale === 'en';
  if (opensDate === date) return `${en ? 'opens at' : 'opent om'} ${opensAt}`;
  if (opensDate === addCalendarDays(date, 1))
    return `${en ? 'opens tomorrow at' : 'opent morgen om'} ${opensAt}`;
  const day = new Intl.DateTimeFormat(en ? 'en-GB' : 'nl-NL', {
    timeZone: 'Europe/Amsterdam',
    weekday: 'long',
  }).format(new Date(`${opensDate}T12:00:00Z`));
  return `${en ? 'opens' : 'opent'} ${day} ${opensAt}`;
}

function primaryStatus(hours: Hours, locale: Locale, state: OpeningState) {
  const en = locale === 'en';
  const next = nextLabel(state.opensDate, state.opensAt, state.date, locale);
  if (state.status === 'unknown') {
    return {
      tone: 'unknown',
      icon: AlertTriangle,
      label:
        hours.verification_status === 'verified'
          ? en
            ? 'Current hours not confirmed'
            : 'Actuele tijden niet bevestigd'
          : en
            ? 'Hours need verification'
            : 'Tijden moeten worden gecontroleerd',
    } as const;
  }
  if (hours.hours_kind === 'service_contact') {
    return state.status === 'open'
      ? {
          tone: 'open',
          icon: Phone,
          label: `${en ? 'Phone available · until' : 'Telefonisch bereikbaar · tot'} ${state.closesAt}`,
        }
      : {
          tone: 'closed',
          icon: Phone,
          label: [
            en ? 'Phone unavailable' : 'Telefonisch niet bereikbaar',
            next,
          ]
            .filter(Boolean)
            .join(' · '),
        };
  }
  const closedToday = state.reason === 'closed_day';
  const prefix =
    hours.hours_kind === 'building_access'
      ? state.status === 'open'
        ? en
          ? 'Building open'
          : 'Gebouw open'
        : closedToday
          ? en
            ? 'Building closed today'
            : 'Gebouw vandaag gesloten'
          : en
            ? 'Building closed'
            : 'Gebouw gesloten'
      : state.status === 'open'
        ? en
          ? 'Open'
          : 'Open'
        : closedToday
          ? en
            ? 'Closed today'
            : 'Vandaag gesloten'
          : en
            ? 'Closed'
            : 'Gesloten';
  return {
    tone: state.status,
    icon: hours.hours_kind === 'building_access' ? Building2 : Clock3,
    label:
      state.status === 'open'
        ? `${prefix} · ${en ? 'until' : 'tot'} ${state.closesAt}`
        : [prefix, next].filter(Boolean).join(' · '),
  } as const;
}

export function OpeningHours({
  hours,
  locale,
  now = new Date(),
}: {
  hours: Hours | undefined;
  locale: Locale;
  now?: Date;
}) {
  const en = locale === 'en';
  if (!hours) {
    return (
      <section
        className="hours-card hours-unknown"
        aria-label={en ? 'Opening hours' : 'Openingstijden'}
      >
        <div className="hours-status" role="status">
          <span className="hours-status-icon">
            <AlertTriangle size={17} />
          </span>
          <div>
            <small>{en ? 'Opening hours' : 'Openingstijden'}</small>
            <strong>
              {en
                ? 'Hours not confirmed yet'
                : 'Openingstijden nog niet bevestigd'}
            </strong>
          </div>
        </div>
      </section>
    );
  }

  const state = openingState(hours, now);
  const status = primaryStatus(hours, locale, state);
  const StatusIcon = status.icon;
  const scope =
    hours.hours_kind === 'building_access'
      ? en
        ? 'Building access'
        : 'Toegang gebouw'
      : hours.hours_kind === 'service_contact'
        ? en
          ? 'Contact hours'
          : 'Contacttijden'
        : en
          ? 'Opening hours'
          : 'Openingstijden';
  const note = hours.display_note[locale];
  const sourceLabel = {
    official_web: {
      nl: 'Officiële webbron',
      en: 'Official web source',
    },
    physical_signage: {
      nl: 'Bord of poster op locatie',
      en: 'On-site sign or poster',
    },
    staff_confirmation: {
      nl: 'Bevestigd door medewerker',
      en: 'Confirmed by staff',
    },
    manual_admin: {
      nl: 'Bevestigd door beheerder',
      en: 'Confirmed by administrator',
    },
  }[hours.source_type][locale];

  return (
    <section
      className={`hours-card hours-${status.tone}`}
      aria-label={en ? 'Opening hours' : 'Openingstijden'}
    >
      <div className="hours-status" role="status">
        <span className="hours-status-icon">
          <StatusIcon size={18} />
        </span>
        <div>
          <small>{scope}</small>
          <strong>{status.label}</strong>
        </div>
      </div>
      {state.isException && (
        <p className="hours-exception">
          <CalendarDays size={16} />
          <span>
            <strong>
              {en ? 'Different hours today' : 'Afwijkende openingstijd vandaag'}
            </strong>
            {' · '}
            {periodsLabel(state.periods, en)}
          </span>
        </p>
      )}
      {note && <p className="hours-note">{note}</p>}
      <details className="hours-details">
        <summary>
          {en ? 'View opening hours' : 'Openingstijden bekijken'}
        </summary>
        <dl className="opening-week">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <div className={day === state.weekday ? 'today' : ''} key={day}>
              <dt>
                {days[locale][day]}
                {day === state.weekday && (
                  <span>{en ? 'Today' : 'Vandaag'}</span>
                )}
              </dt>
              <dd>{periodsLabel(hours.weekly[String(day)], en)}</dd>
            </div>
          ))}
        </dl>
        {Object.keys(hours.exceptions).length > 0 && (
          <div className="hours-exceptions-list">
            <strong>
              {en ? 'Known exceptions' : 'Bekende uitzonderingen'}
            </strong>
            <ul>
              {Object.entries(hours.exceptions)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, periods]) => (
                  <li key={date}>
                    <time dateTime={date}>{date}</time>
                    <span>{periodsLabel(periods, en)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
        <div className="hours-provenance">
          <span>
            {hours.verification_status === 'verified' ? (
              <CheckCircle2 size={15} />
            ) : (
              <AlertTriangle size={15} />
            )}
            {hours.verification_status === 'verified'
              ? en
                ? 'Checked'
                : 'Gecontroleerd'
              : en
                ? 'Needs verification'
                : 'Moet worden gecontroleerd'}
            {' · '}
            <time dateTime={hours.verified_at}>{hours.verified_at}</time>
          </span>
          <span className="hours-provenance-source">
            <strong>{sourceLabel}</strong>
            <small>{hours.source_description}</small>
          </span>
          {hours.source_url && (
            <a href={hours.source_url} target="_blank" rel="noreferrer">
              {en ? 'View source' : 'Bron bekijken'} <ExternalLink size={14} />
            </a>
          )}
        </div>
      </details>
    </section>
  );
}
