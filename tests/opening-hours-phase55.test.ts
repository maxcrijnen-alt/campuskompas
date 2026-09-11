import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OpeningHours } from '../components/campus/opening-hours';
import { auditOpeningHours } from '../lib/campus/hours-audit';
import {
  amsterdamClock,
  openingState,
  openingStatus,
  scheduleForDate,
} from '../lib/campus/hours';
import { seed } from '../lib/campus/seed';
import type { Hours } from '../lib/campus/types';
import { adminSchemas, hoursTargetSchema } from '../lib/campus/validation';

const base: Hours = {
  id: 'test-hours',
  weekly: {
    '0': [],
    '1': [
      ['08:30', '12:00'],
      ['13:00', '17:00'],
    ],
    '2': [['08:30', '17:00']],
    '3': [['08:30', '17:00']],
    '4': [['08:30', '17:00']],
    '5': [['08:30', '17:00']],
    '6': [],
  },
  exceptions: {},
  verified_at: '2026-09-10',
  verification_status: 'verified',
  exceptions_reviewed_through: '2026-10-31',
  source_url: 'https://www.nhlstenden.com/test',
  source_type: 'official_web',
  source_description: 'Official test page for this schedule.',
  hours_kind: 'physical_opening',
  display_note: { nl: 'Actuele bron.', en: 'Current source.' },
  timezone: 'Europe/Amsterdam',
};

describe('Phase 5.5 opening-hours engine', () => {
  it('uses a regular weekday and the exact closing boundary', () => {
    expect(openingStatus(base, new Date('2026-09-15T08:00:00Z'))).toBe(
      'Open · sluit om 17:00',
    );
    expect(openingState(base, new Date('2026-09-15T15:00:00Z'))).toMatchObject({
      status: 'closed',
      opensAt: '08:30',
      opensDate: '2026-09-16',
    });
  });

  it('treats a configured weekend as closed and calculates Monday', () => {
    expect(openingState(base, new Date('2026-09-12T10:00:00Z'))).toMatchObject({
      status: 'closed',
      reason: 'closed_day',
      opensAt: '08:30',
      opensDate: '2026-09-14',
    });
  });

  it('lets a date-specific exception override the regular week', () => {
    const hours = {
      ...base,
      exceptions: { '2026-09-15': [['10:00', '13:00']] as [string, string][] },
    };
    expect(scheduleForDate(hours, '2026-09-15')).toEqual({
      periods: [['10:00', '13:00']],
      isException: true,
    });
    expect(openingStatus(hours, new Date('2026-09-15T08:30:00Z'))).toBe(
      'Open · sluit om 13:00',
    );
  });

  it('supports a fully closed exception and a weekend exception', () => {
    const closed = { ...base, exceptions: { '2026-09-15': [] } };
    expect(
      openingState(closed, new Date('2026-09-15T09:00:00Z')),
    ).toMatchObject({
      status: 'closed',
      isException: true,
      opensDate: '2026-09-16',
    });
    const weekend = {
      ...base,
      exceptions: { '2026-09-12': [['10:00', '14:00']] as [string, string][] },
    };
    expect(openingStatus(weekend, new Date('2026-09-12T09:00:00Z'))).toBe(
      'Open · sluit om 14:00',
    );
  });

  it('supports multiple periods and the next period on the same day', () => {
    expect(openingState(base, new Date('2026-09-14T10:30:00Z'))).toMatchObject({
      status: 'closed',
      reason: 'before_period',
      opensAt: '13:00',
      opensDate: '2026-09-14',
    });
  });

  it('uses Europe/Amsterdam across date and daylight-saving boundaries', () => {
    expect(amsterdamClock(new Date('2026-03-28T23:30:00Z'))).toMatchObject({
      date: '2026-03-29',
      time: '00:30',
      weekday: 0,
    });
    expect(amsterdamClock(new Date('2026-03-29T01:30:00Z'))).toMatchObject({
      date: '2026-03-29',
      time: '03:30',
    });
    expect(amsterdamClock(new Date('2026-10-25T01:30:00Z'))).toMatchObject({
      date: '2026-10-25',
      time: '02:30',
    });
  });

  it('never makes a strong claim for needs_review or expired review data', () => {
    expect(
      openingState({ ...base, verification_status: 'needs_review' }),
    ).toMatchObject({
      status: 'unknown',
      reason: 'not_verified',
    });
    expect(
      openingState(
        { ...base, exceptions_reviewed_through: '2026-09-14' },
        new Date('2026-09-15T08:00:00Z'),
      ),
    ).toMatchObject({ status: 'unknown', reason: 'exceptions_not_reviewed' });
  });
});

describe('Phase 5.5 operational records and presentation', () => {
  it('applies the confirmed R8 and R10 building schedules', () => {
    const r8 = seed.hours.find((hours) => hours.id === 'R8')!;
    const r10 = seed.hours.find((hours) => hours.id === 'R10')!;
    expect(openingStatus(r8, new Date('2026-09-10T16:00:00Z'))).toBe(
      'Gesloten · opent morgen om 07:30',
    );
    expect(openingStatus(r10, new Date('2026-09-10T16:00:00Z'))).toBe(
      'Open · sluit om 22:00',
    );
    expect(r8.hours_kind).toBe('building_access');
    expect(r10.hours_kind).toBe('building_access');
  });

  it('applies the published Library autumn-break exception', () => {
    const library = seed.hours.find((hours) => hours.id === 'library')!;
    expect(
      openingState(library, new Date('2026-10-12T08:00:00Z')),
    ).toMatchObject({
      status: 'open',
      closesAt: '13:00',
      isException: true,
    });
  });

  it('keeps contact hours separate from physical opening', () => {
    const contact = seed.hours.find(
      (hours) => hours.id === 'student-info-contact',
    )!;
    expect(contact.hours_kind).toBe('service_contact');
    const html = renderToStaticMarkup(
      createElement(OpeningHours, {
        hours: contact,
        locale: 'nl',
        now: new Date('2026-09-10T10:00:00Z'),
      }),
    );
    expect(html).toContain('Telefonisch bereikbaar');
    expect(html).toContain('fysieke balie-uren zijn niet bevestigd');
    expect(html).not.toContain('Gebouw open');
  });

  it('renders today, provenance and a compact unknown state', () => {
    const html = renderToStaticMarkup(
      createElement(OpeningHours, {
        hours: base,
        locale: 'nl',
        now: new Date('2026-09-14T08:00:00Z'),
      }),
    );
    expect(html).toContain('class="today"');
    expect(html).toContain('Officiële webbron');
    expect(html).toContain(base.source_url);
    expect(
      renderToStaticMarkup(
        createElement(OpeningHours, { hours: undefined, locale: 'nl' }),
      ),
    ).toContain('Openingstijden nog niet bevestigd');
  });

  it('does not inherit building hours into rooms or cafés', () => {
    expect(
      seed.locations.find((location) => location.id === 'F3025')?.hours_id,
    ).toBeUndefined();
    expect(
      seed.locations.find((location) => location.id === 'central-brew')
        ?.hours_id,
    ).toBeUndefined();
    expect(
      seed.locations.find((location) => location.id === 'brandstof')?.hours_id,
    ).toBeUndefined();
    expect(
      seed.locations.find((location) => location.id === 'R8_MAIN')?.hours_id,
    ).toBe('R8');
    expect(
      seed.categories.find((category) => category.id === 'room')
        ?.hours_relevant,
    ).toBe(false);
    expect(
      seed.categories.find((category) => category.id === 'coffee')
        ?.hours_relevant,
    ).toBe(true);
  });

  it('reports relevant gaps without requiring hours for rooms, toilets or stairs', () => {
    const report = auditOpeningHours(
      {
        locations: seed.locations,
        categories: seed.categories,
        hours: seed.hours,
      },
      '2026-09-10',
    );
    expect(report.semanticallySuspiciousLinks).toEqual([]);
    expect(report.facilitiesWithoutConfirmedHours).toContain('central-brew');
    expect(report.facilitiesWithoutConfirmedHours).toContain('brandstof');
    expect(report.facilitiesWithoutConfirmedHours).not.toContain('F3025');
    expect(report.irrelevantLocationsWithoutHoursIgnored).toBeGreaterThan(0);
    expect(report.exceptionDates).toBe(5);
    expect(report.invalidProvenance).toEqual([]);
    expect(report.sourceTypeCounts.official_web).toBe(5);
  });

  it('validates ranges, overlap, day numbers and exception dates', () => {
    expect(adminSchemas.opening_hours.safeParse(base).success).toBe(true);
    expect(
      adminSchemas.opening_hours.safeParse({
        ...base,
        weekly: { '1': [['17:00', '08:30']] },
      }).success,
    ).toBe(false);
    expect(
      adminSchemas.opening_hours.safeParse({
        ...base,
        weekly: {
          '1': [
            ['08:00', '12:00'],
            ['11:00', '13:00'],
          ],
        },
      }).success,
    ).toBe(false);
    expect(
      adminSchemas.opening_hours.safeParse({ ...base, weekly: { '7': [] } })
        .success,
    ).toBe(false);
    expect(
      adminSchemas.opening_hours.safeParse({
        ...base,
        exceptions: { '2026-13-40': [] },
      }).success,
    ).toBe(false);
  });

  it('supports honest URL-less provenance without treating manual notes as verified', () => {
    const signage = {
      ...base,
      source_type: 'physical_signage' as const,
      source_url: null,
      source_description: 'Opening-hours sign beside the facility entrance.',
    };
    expect(adminSchemas.opening_hours.safeParse(signage).success).toBe(true);
    const signageHtml = renderToStaticMarkup(
      createElement(OpeningHours, { hours: signage, locale: 'nl' }),
    );
    expect(signageHtml).toContain('Bord of poster op locatie');
    expect(signageHtml).not.toContain('Bron bekijken');

    const manual = {
      ...base,
      source_type: 'manual_admin' as const,
      source_url: null,
      source_description: 'Temporary administrator note pending verification.',
      verification_status: 'unverified' as const,
    };
    expect(adminSchemas.opening_hours.safeParse(manual).success).toBe(true);
    expect(
      adminSchemas.opening_hours.safeParse({
        ...manual,
        verification_status: 'verified',
      }).success,
    ).toBe(false);
    expect(
      adminSchemas.opening_hours.safeParse({
        ...signage,
        source_description: '',
      }).success,
    ).toBe(false);
    expect(
      adminSchemas.opening_hours.safeParse({
        ...base,
        source_url: null,
      }).success,
    ).toBe(false);
  });

  it('validates narrow location and Hidden Gem hours-link requests', () => {
    expect(
      hoursTargetSchema.safeParse({
        target_type: 'location',
        target_id: 'library',
      }).success,
    ).toBe(true);
    expect(
      hoursTargetSchema.safeParse({
        target_type: 'hidden_gem',
        target_id: '3ed27dd9-0af0-48a7-aaf8-e3bdf614fa62',
      }).success,
    ).toBe(true);
    expect(
      hoursTargetSchema.safeParse({
        target_type: 'room',
        target_id: 'library',
      }).success,
    ).toBe(false);
  });
});
