import type { Hours, Locale } from './types';

export const CAMPUS_TIMEZONE = 'Europe/Amsterdam' as const;
export const HOURS_STALE_AFTER_DAYS = 90;

export type HoursPeriod = [string, string];
export type OpeningState = {
  status: 'open' | 'closed' | 'unknown';
  reason:
    | 'active_period'
    | 'before_period'
    | 'after_periods'
    | 'closed_day'
    | 'missing_schedule'
    | 'not_verified'
    | 'stale'
    | 'exceptions_not_reviewed';
  date: string;
  weekday: number;
  time: string;
  periods: HoursPeriod[] | null;
  isException: boolean;
  closesAt?: string;
  opensAt?: string;
  opensDate?: string;
};

export type AmsterdamClock = {
  date: string;
  time: string;
  weekday: number;
};

const DAY_MS = 86_400_000;

export function amsterdamClock(now = new Date()): AmsterdamClock {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: CAMPUS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    date,
    time: `${parts.hour}:${parts.minute}`,
    weekday: weekdayForDate(date),
  };
}

export function weekdayForDate(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function scheduleForDate(
  hours: Hours,
  date: string,
): { periods: HoursPeriod[] | null; isException: boolean } {
  if (Object.hasOwn(hours.exceptions, date)) {
    return { periods: hours.exceptions[date] ?? null, isException: true };
  }
  return {
    periods: hours.weekly[String(weekdayForDate(date))] ?? null,
    isException: false,
  };
}

function dataReason(
  hours: Hours,
  clock: AmsterdamClock,
): OpeningState['reason'] | null {
  if (hours.verification_status !== 'verified') return 'not_verified';
  const verifiedAt = Date.parse(`${hours.verified_at}T12:00:00Z`);
  const current = Date.parse(`${clock.date}T12:00:00Z`);
  if (
    !Number.isFinite(verifiedAt) ||
    verifiedAt > current ||
    current - verifiedAt > HOURS_STALE_AFTER_DAYS * DAY_MS
  ) {
    return 'stale';
  }
  if (
    !hours.exceptions_reviewed_through ||
    hours.exceptions_reviewed_through < clock.date
  ) {
    return 'exceptions_not_reviewed';
  }
  return null;
}

function findNextOpening(
  hours: Hours,
  date: string,
  time: string,
): Pick<OpeningState, 'opensAt' | 'opensDate'> {
  for (let offset = 0; offset <= 14; offset += 1) {
    const candidateDate = addCalendarDays(date, offset);
    if (
      hours.exceptions_reviewed_through &&
      candidateDate > hours.exceptions_reviewed_through
    ) {
      break;
    }
    const { periods } = scheduleForDate(hours, candidateDate);
    const next = periods?.find(([start]) => offset > 0 || start > time);
    if (next) return { opensAt: next[0], opensDate: candidateDate };
  }
  return {};
}

export function openingState(hours: Hours, now = new Date()): OpeningState {
  const clock = amsterdamClock(now);
  const invalidReason = dataReason(hours, clock);
  const { periods, isException } = scheduleForDate(hours, clock.date);

  if (invalidReason) {
    return {
      status: 'unknown',
      reason: invalidReason,
      ...clock,
      periods,
      isException,
    };
  }
  if (periods === null) {
    return {
      status: 'unknown',
      reason: 'missing_schedule',
      ...clock,
      periods,
      isException,
    };
  }

  const active = periods.find(
    ([start, end]) => start <= clock.time && clock.time < end,
  );
  if (active) {
    return {
      status: 'open',
      reason: 'active_period',
      ...clock,
      periods,
      isException,
      closesAt: active[1],
    };
  }

  const next = findNextOpening(hours, clock.date, clock.time);
  return {
    status: 'closed',
    reason:
      periods.length === 0
        ? 'closed_day'
        : periods.some(([start]) => start > clock.time)
          ? 'before_period'
          : 'after_periods',
    ...clock,
    periods,
    isException,
    ...next,
  };
}

export function formatOpeningState(
  state: OpeningState,
  locale: Locale = 'nl',
): string | null {
  if (state.status === 'unknown') return null;
  const en = locale === 'en';
  if (state.status === 'open') {
    return `${en ? 'Open · closes at' : 'Open · sluit om'} ${state.closesAt}`;
  }
  if (!state.opensAt || !state.opensDate) return en ? 'Closed' : 'Gesloten';
  if (state.opensDate === state.date) {
    return `${en ? 'Closed · opens at' : 'Gesloten · opent om'} ${state.opensAt}`;
  }
  if (state.opensDate === addCalendarDays(state.date, 1)) {
    return `${en ? 'Closed · opens tomorrow at' : 'Gesloten · opent morgen om'} ${state.opensAt}`;
  }
  const day = new Intl.DateTimeFormat(en ? 'en-GB' : 'nl-NL', {
    timeZone: CAMPUS_TIMEZONE,
    weekday: 'long',
  }).format(new Date(`${state.opensDate}T12:00:00Z`));
  return `${en ? 'Closed · opens' : 'Gesloten · opent'} ${day} ${state.opensAt}`;
}

/** Kept as the small compatibility API used by routing and earlier tests. */
export function openingStatus(
  hours: Hours,
  now = new Date(),
  locale: Locale = 'nl',
): string | null {
  return formatOpeningState(openingState(hours, now), locale);
}
