import { describe, expect, it } from 'vitest';
import {
  firstYearEvents,
  firstYearFilters,
  firstYearInfoItems,
  getAmsterdamDate,
  getFirstYearEventState,
  getVisibleFirstYearEvents,
  searchFirstYearInfo,
} from '@/lib/campus/first-year';

const implementationDate = new Date('2026-09-17T10:00:00Z');

describe('First-year information', () => {
  it('keeps all study information in eleven maintainable sectioned cards', () => {
    expect(firstYearInfoItems.map((item) => item.id)).toEqual([
      'nhl-stenden',
      'dbe',
      'oer',
      'exam-board',
      'study-facilities',
      'ppo-portfolio',
      'what-is-leisure',
      'function-of-leisure',
      'events-definition',
      'career-after-ad',
      'study-choice-123',
    ]);
    expect(
      firstYearInfoItems.filter((item) => item.section === 'start'),
    ).toHaveLength(6);
    expect(
      firstYearInfoItems.filter((item) => item.section === 'leisure'),
    ).toHaveLength(3);
    expect(
      firstYearInfoItems.filter((item) => item.section === 'future'),
    ).toHaveLength(2);
    expect(firstYearFilters.map((filter) => filter.id)).toEqual([
      'all',
      'start',
      'leisure',
      'future',
      'nearby-events',
      'tips',
    ]);
  });

  it('preserves the supplied Dutch DBE, PPO and Leisure prose', () => {
    const dbe = firstYearInfoItems.find((item) => item.id === 'dbe')!;
    const ppo = firstYearInfoItems.find((item) => item.id === 'ppo-portfolio')!;
    const leisure = firstYearInfoItems.find(
      (item) => item.id === 'what-is-leisure',
    )!;

    expect(dbe.content.nl[1]).toEqual({
      type: 'paragraph',
      text: 'DBE is een vorm van onderwijs waarin studenten leren door te doen. Studenten werken aan praktijkgerichte projecten waardoor ze vaardigheden die ze tijdens hun studie ontwikkelen direct leren toepassen.',
    });
    expect(ppo.content.nl[0]).toEqual({
      type: 'paragraph',
      text: 'Gedurende je opleiding bouw je zelf een portfolio op. Je portfolio laat jouw persoonlijke en professionele ontwikkeling zien. Het bestaat uit eigen werk, opdrachten, resultaten en ander bewijs waarmee je kunt laten zien hoe je je hebt ontwikkeld.',
    });
    expect(leisure.content.nl).toHaveLength(4);
    expect(leisure.content.nl[3]).toEqual({
      type: 'paragraph',
      text: 'Leisure omvat activiteiten die mensen in hun vrije tijd doen voor bijvoorbeeld ontspanning, plezier of persoonlijke ontwikkeling.',
    });
  });

  it('keeps source provenance explicit and does not present PPO as verified terminology', () => {
    const dbe = firstYearInfoItems.find((item) => item.id === 'dbe')!;
    const ppo = firstYearInfoItems.find((item) => item.id === 'ppo-portfolio')!;
    const future = firstYearInfoItems.find(
      (item) => item.id === 'career-after-ad',
    )!;

    expect(dbe.source?.url).toBe(
      'https://www.nhlstenden.com/studeren-bij-nhl-stenden/over-ons-onderwijssysteem',
    );
    expect(ppo.source?.url).toContain(
      'leisure-and-events-management-associate-degree-voltijd/studieopbouw',
    );
    expect(ppo.content.nl.at(-1)).toMatchObject({
      type: 'paragraph',
      text: expect.stringContaining('de term die het projectteam gebruikt'),
    });
    expect(future.source?.url).toContain(
      'associate-degree-voltijd/jouw-toekomst',
    );
  });

  it.each([
    ['DBE', ['dbe']],
    ['portfolio', ['ppo-portfolio']],
    ['examencommissie', ['exam-board']],
    ['OER', ['oer']],
    ['toekomst', ['career-after-ad', 'study-choice-123']],
  ])(
    'finds %s across title, content, keywords and section',
    (query, expected) => {
      expect(searchFirstYearInfo(query, 'nl').map((item) => item.id)).toEqual(
        expected,
      );
    },
  );

  it('finds the Leisure cards and the event definition', () => {
    const leisureResults = searchFirstYearInfo('leisure', 'nl', 'leisure').map(
      (item) => item.id,
    );
    expect(leisureResults).toEqual([
      'what-is-leisure',
      'function-of-leisure',
      'events-definition',
    ]);
    expect(
      searchFirstYearInfo('evenement', 'nl').map((item) => item.id),
    ).toContain('events-definition');
    expect(searchFirstYearInfo('study facilities', 'en')[0].id).toBe(
      'study-facilities',
    );
  });
});

describe('First-year events', () => {
  it('shows ten verified active events in chronological order on implementation day', () => {
    const events = getVisibleFirstYearEvents(implementationDate);
    expect(events).toHaveLength(10);
    expect(events.map((event) => event.id)).toEqual([
      'friesland-pop-pizza-party-2026',
      'museumnacht-frl-2026',
      'let-op-hier-volgt-een-mening-2026',
      'weekend-van-de-wetenschap-leeuwarden-2026',
      'heropening-de-harmonie-2026',
      'popronde-leeuwarden-2026',
      'acqua-forte-parade-2026',
      'minormarkt-leeuwarden-2026',
      'noordelijk-film-festival-2026',
      'explore-the-north-2026',
    ]);
    expect(new Set(events.map((event) => event.sourceUrl)).size).toBe(
      events.length,
    );
    expect(new Set(firstYearEvents.map((event) => event.id)).size).toBe(
      firstYearEvents.length,
    );
    expect(new Set(firstYearEvents.map((event) => event.sourceUrl)).size).toBe(
      firstYearEvents.length,
    );
  });

  it('keeps Pizza Party scheduled with its verified date and time until it expires', () => {
    const pizzaParty = firstYearEvents.find(
      (event) => event.id === 'friesland-pop-pizza-party-2026',
    )!;

    expect(pizzaParty).toMatchObject({
      status: 'scheduled',
      startDate: '2026-09-23',
      startTime: '16:00',
      location: {
        nl: 'Neushoorn Café, Leeuwarden',
        en: 'Neushoorn Café, Leeuwarden',
      },
      sourceUrl: 'https://www.neushoorn.nl/events/pizza-party',
    });
    expect(getFirstYearEventState(pizzaParty, implementationDate)).toBe(
      'upcoming',
    );
    expect(
      getVisibleFirstYearEvents(implementationDate).map((event) => event.id),
    ).toContain('friesland-pop-pizza-party-2026');
    expect(
      getVisibleFirstYearEvents(new Date('2026-09-24T10:00:00Z')).map(
        (event) => event.id,
      ),
    ).not.toContain('friesland-pop-pizza-party-2026');
  });

  it('keeps The Grave Rave cancelled and out of the active list', () => {
    const graveRave = firstYearEvents.find(
      (event) => event.id === 'the-grave-rave-2026',
    )!;
    const visible = getVisibleFirstYearEvents(implementationDate).map(
      (event) => event.id,
    );

    expect(graveRave.status).toBe('cancelled');
    expect(getFirstYearEventState(graveRave, implementationDate)).toBe(
      'cancelled',
    );
    expect(visible).not.toContain('the-grave-rave-2026');
  });

  it('uses Europe/Amsterdam for today, ongoing and past states', () => {
    const museum = firstYearEvents.find(
      (event) => event.id === 'museumnacht-frl-2026',
    )!;
    const parade = firstYearEvents.find(
      (event) => event.id === 'acqua-forte-parade-2026',
    )!;

    const afterMidnightAmsterdam = new Date('2026-09-25T22:30:00Z');
    expect(getAmsterdamDate(afterMidnightAmsterdam)).toBe('2026-09-26');
    expect(getFirstYearEventState(museum, afterMidnightAmsterdam)).toBe(
      'today',
    );
    expect(
      getFirstYearEventState(parade, new Date('2026-10-10T10:00:00Z')),
    ).toBe('ongoing');
    expect(
      getFirstYearEventState(museum, new Date('2026-09-27T10:00:00Z')),
    ).toBe('past');
  });

  it('automatically hides expired events and deduplicates canonical source URLs', () => {
    expect(
      getVisibleFirstYearEvents(new Date('2026-09-27T10:00:00Z')).map(
        (event) => event.id,
      ),
    ).not.toContain('museumnacht-frl-2026');
    expect(
      getVisibleFirstYearEvents(new Date('2026-11-23T10:00:00Z')),
    ).toHaveLength(0);

    const museum = firstYearEvents.find(
      (event) => event.id === 'museumnacht-frl-2026',
    )!;
    expect(
      getVisibleFirstYearEvents(implementationDate, '', 'nl', [
        museum,
        { ...museum, id: 'duplicate' },
      ]),
    ).toHaveLength(1);
  });

  it('includes the active event section when searching for events', () => {
    expect(
      getVisibleFirstYearEvents(implementationDate, 'evenement', 'nl'),
    ).toHaveLength(10);
    expect(
      getVisibleFirstYearEvents(implementationDate, 'film', 'nl').map(
        (event) => event.id,
      ),
    ).toEqual(['noordelijk-film-festival-2026']);
  });
});
