import type { Hours, Locale } from './types';
export function openingStatus(
  hours: Hours,
  now = new Date(),
  locale: Locale = 'nl',
): string | null {
  const age =
    now.getTime() - new Date(hours.verified_at + 'T00:00:00Z').getTime();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`,
    time = `${parts.hour}:${parts.minute}`;
  if (
    hours.verification_status !== 'verified' ||
    age < 0 ||
    age > 30 * 86400000 ||
    !hours.exceptions_reviewed_through ||
    date > hours.exceptions_reviewed_through
  )
    return null;
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  const periods = Object.hasOwn(hours.exceptions, date)
    ? hours.exceptions[date]
    : hours.weekly[String(weekday)];
  if (periods == null) return null;
  const active = periods.find(([start, end]) => start <= time && time < end);
  if (active)
    return (
      (locale === 'nl' ? 'Open · sluit om ' : 'Open · closes at ') + active[1]
    );
  const next = periods.find(([start]) => start > time);
  if(!next){
    const tomorrow=new Date(date+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
    const key=tomorrow.toISOString().slice(0,10);
    if(key<=hours.exceptions_reviewed_through){
      const slots=Object.hasOwn(hours.exceptions,key)?hours.exceptions[key]:hours.weekly[String(tomorrow.getUTCDay())];
      if(slots?.length)return (locale==='nl'?'Gesloten · opent morgen om ':'Closed · opens tomorrow at ')+slots[0][0];
    }
  }
  return next
    ? (locale === 'nl' ? 'Gesloten · opent om ' : 'Closed · opens at ') +
        next[0]
    : locale === 'nl'
      ? 'Gesloten'
      : 'Closed';
}
