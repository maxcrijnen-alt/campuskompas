'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Search,
} from 'lucide-react';
import type { CampusData, Locale } from '@/lib/campus/types';
import {
  firstYearFilters,
  firstYearSections,
  getFirstYearEventState,
  getVisibleFirstYearEvents,
  localizeFirstYearText,
  normalizeFirstYearSearch,
  searchFirstYearInfo,
  type FirstYearContentBlock,
  type FirstYearEvent,
  type FirstYearFilterId,
  type FirstYearInfoItem,
  type FirstYearSectionId,
} from '@/lib/campus/first-year';
import { Icon } from './icon';
import { ReportButton } from './community';
import { track } from '@/lib/campus/analytics';

type FirstYearTip = {
  id: string;
  icon: string;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
  target: string;
};

const firstYearTips: FirstYearTip[] = [
  {
    id: 'room-code',
    icon: 'door',
    title: { nl: 'Hoe lees je F3.025?', en: 'How do you read F3.025?' },
    body: {
      nl: 'F is de zone, 3 de verdieping en 025 het lokaal. Probeer de zoekfunctie met of zonder punt.',
      en: 'F is the zone, 3 is the floor and 025 is the room. Search with or without the dot.',
    },
    target: 'F3025',
  },
  {
    id: 'buildings',
    icon: 'map',
    title: { nl: 'R8 of R10?', en: 'R8 or R10?' },
    body: {
      nl: 'Controleer eerst het gebouw op je rooster of uitnodiging. Wissel boven de kaart tussen Rengerslaan 8 en 10.',
      en: 'First check the building on your timetable or invitation. Switch between Rengerslaan 8 and 10 above the map.',
    },
    target: 'R10_MAIN',
  },
  {
    id: 'help',
    icon: 'info',
    title: { nl: 'Een praktische vraag?', en: 'A practical question?' },
    body: {
      nl: 'Student Info vind je in R8. Bekijk de plek en plan je route.',
      en: 'Find Student Info in R8. View the location and plan your route.',
    },
    target: 'student-info',
  },
  {
    id: 'library',
    icon: 'book',
    title: { nl: 'Naar de bibliotheek', en: 'Find the library' },
    body: {
      nl: 'Zoek de bibliotheek op de begane grond van R8. Actuele openingstijden staan bij de locatie.',
      en: 'Find the library on the ground floor of R8. Check its location details for opening hours.',
    },
    target: 'library',
  },
  {
    id: 'coffee',
    icon: 'coffee',
    title: { nl: 'Tijd voor een pauze', en: 'Time for a break' },
    body: {
      nl: 'Central Brew staat op de kaart in de centrale hal van R8. Zoek op koffie voor andere plekken.',
      en: 'Central Brew is shown in the central hall of R8. Search coffee for other places.',
    },
    target: 'central-brew',
  },
  {
    id: 'study',
    icon: 'book',
    title: { nl: 'Een plek om te studeren', en: 'A place to study' },
    body: {
      nl: 'Begin bij de bibliotheek. Zoek studieplekken op de kaart; beschikbaarheid wordt niet live bijgehouden.',
      en: 'Start at the library. Search study places on the map; availability is not tracked live.',
    },
    target: 'library',
  },
  {
    id: 'access',
    icon: 'access',
    title: { nl: 'Drempelvrij op weg', en: 'Step-free navigation' },
    body: {
      nl: 'Zet Toegankelijke route aan. Trappen en bevestigde niet-toegankelijke delen worden vermeden. Onbekende toegankelijkheid kan met een duidelijke waarschuwing als kandidaat worden gebruikt.',
      en: 'Enable Accessible route. Stairs and confirmed inaccessible sections are avoided. Unknown accessibility may be used as a candidate with a clear warning.',
    },
    target: '',
  },
  {
    id: 'campus-tour',
    icon: 'compass',
    title: {
      nl: 'Ontdek de campus met een Campus Tour',
      en: 'Discover the campus with a Campus Tour',
    },
    body: {
      nl: 'Bekijk of boek via NHL Stenden een persoonlijke rondleiding om de campus, studieplekken en belangrijke voorzieningen te leren kennen.',
      en: 'View or book a personal tour with NHL Stenden to get to know the campus, study areas and key facilities.',
    },
    target: '',
  },
  {
    id: 'report',
    icon: 'info',
    title: { nl: 'Klopt de informatie niet?', en: 'Is something incorrect?' },
    body: {
      nl: 'Gebruik de meldknop bij een plek. Een beheerder controleert je melding voordat de kaart verandert.',
      en: 'Use the report button on a location. An administrator checks your report before changing the map.',
    },
    target: '',
  },
];

function ContentBlock({ block }: { block: FirstYearContentBlock }) {
  if (block.type === 'paragraph') return <p>{block.text}</p>;
  return (
    <ul>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function StudyCard({
  item,
  locale,
}: {
  item: FirstYearInfoItem;
  locale: Locale;
}) {
  const en = locale === 'en';
  const content = item.content[locale];

  return (
    <article
      className="discovery-card tip-action first-year-card"
      data-first-year-id={item.id}
    >
      <div className="first-year-card-heading">
        <div className="card-icon">
          <Icon name={item.icon} />
        </div>
      </div>
      <h3>{localizeFirstYearText(item.title, locale)}</h3>
      <div className="first-year-content">
        <ContentBlock block={content[0]} />
        {content.length > 1 && (
          <details className="study-more">
            <summary>
              <span className="study-more-closed">
                {en ? 'Read more' : 'Lees meer'}
              </span>
              <span className="study-more-open">
                {en ? 'Show less' : 'Toon minder'}
              </span>
            </summary>
            <div className="study-more-content">
              {content.slice(1).map((block) => (
                <ContentBlock
                  block={block}
                  key={
                    block.type === 'paragraph'
                      ? block.text
                      : block.items.join('|')
                  }
                />
              ))}
            </div>
          </details>
        )}
      </div>
      {item.internalLink && (
        <Link
          className="text-link first-year-source"
          href={item.internalLink.href}
        >
          {item.internalLink.label[locale]} →
        </Link>
      )}
      {item.source && (
        <a
          className="text-link first-year-source"
          href={item.source.url}
          target="_blank"
          rel="noreferrer"
        >
          {item.source.label[locale]}
          <ExternalLink size={15} aria-hidden="true" />
          <span className="sr-only">
            {en ? '(opens in a new tab)' : '(opent in een nieuw tabblad)'}
          </span>
        </a>
      )}
    </article>
  );
}

function formatEventDate(event: FirstYearEvent, locale: Locale) {
  const formatter = new Intl.DateTimeFormat(
    locale === 'nl' ? 'nl-NL' : 'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Amsterdam',
    },
  );
  const date = (value: string) => new Date(`${value}T12:00:00Z`);
  if (!event.endDate || event.endDate === event.startDate) {
    return formatter.format(date(event.startDate));
  }
  return `${formatter.format(date(event.startDate))} – ${formatter.format(
    date(event.endDate),
  )}`;
}

function EventCard({
  event,
  locale,
  now,
}: {
  event: FirstYearEvent;
  locale: Locale;
  now: Date;
}) {
  const en = locale === 'en';
  const state = getFirstYearEventState(event, now);
  const time = event.startTime
    ? event.endTime
      ? `${event.startTime}–${event.endTime}`
      : event.startTime
    : null;

  return (
    <article
      className="discovery-card tip-action first-year-card event-card"
      data-event-id={event.id}
      data-event-state={state}
    >
      <div className="first-year-card-heading">
        <div className="card-icon">
          <CalendarDays size={20} aria-hidden="true" />
        </div>
        <span className="status-chip study-category">
          {state === 'today'
            ? en
              ? 'Today'
              : 'Vandaag'
            : state === 'ongoing'
              ? en
                ? 'Now'
                : 'Nu'
              : event.category[locale]}
        </span>
      </div>
      <h3>{event.title[locale]}</h3>
      <div className="event-meta">
        <span>
          <CalendarDays size={16} aria-hidden="true" />
          {formatEventDate(event, locale)}
        </span>
        {time && (
          <span>
            <Clock size={16} aria-hidden="true" />
            {time}
          </span>
        )}
        {event.location && (
          <span>
            <MapPin size={16} aria-hidden="true" />
            {event.location[locale]}
          </span>
        )}
      </div>
      <a
        className="text-link first-year-source"
        href={event.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        {en ? 'View event' : 'Bekijk evenement'} · {event.sourceLabel[locale]}
        <ExternalLink size={15} aria-hidden="true" />
        <span className="sr-only">
          {en ? '(opens in a new tab)' : '(opent in een nieuw tabblad)'}
        </span>
      </a>
    </article>
  );
}

function SectionHeading({
  id,
  locale,
}: {
  id: Exclude<FirstYearFilterId, 'all'>;
  locale: Locale;
}) {
  const section = firstYearSections.find((entry) => entry.id === id)!;
  return (
    <div className="first-year-section-heading">
      <h2>{section.title[locale]}</h2>
      <p>{section.description[locale]}</p>
    </div>
  );
}

export function TipsPage({
  data,
  locale,
  today,
}: {
  data: CampusData;
  locale: Locale;
  today: string;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FirstYearFilterId>('all');
  const now = useMemo(() => new Date(`${today}T12:00:00Z`), [today]);
  const en = locale === 'en';

  const infoSection = (
    ['start', 'leisure', 'future'] as FirstYearSectionId[]
  ).includes(filter as FirstYearSectionId)
    ? (filter as FirstYearSectionId)
    : 'all';
  const visibleInfo = useMemo(
    () =>
      ['all', 'start', 'leisure', 'future'].includes(filter)
        ? searchFirstYearInfo(query, locale, infoSection)
        : [],
    [filter, infoSection, locale, query],
  );
  const visibleEvents = useMemo(
    () =>
      filter === 'all' || filter === 'nearby-events'
        ? getVisibleFirstYearEvents(now, query, locale)
        : [],
    [filter, locale, now, query],
  );
  const visibleTips = useMemo(() => {
    if (filter !== 'all' && filter !== 'tips') return [];
    const needle = normalizeFirstYearSearch(query);
    return firstYearTips
      .map((tip) => {
        const stored = data.tips.find((entry) => entry.id === tip.id);
        return {
          ...tip,
          resolvedTitle: stored?.published
            ? stored.title[locale]
            : tip.title[locale],
          resolvedBody: stored?.published
            ? stored.body[locale]
            : tip.body[locale],
          location: data.locations.find(
            (location) => location.id === tip.target,
          ),
        };
      })
      .filter((tip) => {
        if (!needle) return true;
        return normalizeFirstYearSearch(
          [
            tip.id,
            tip.resolvedTitle,
            tip.resolvedBody,
            en ? 'first-year tips campus tour' : 'eerstejaars tips campus tour',
          ].join(' '),
        ).includes(needle);
      });
  }, [data.locations, data.tips, en, filter, locale, query]);

  const totalResults =
    visibleInfo.length + visibleEvents.length + visibleTips.length;

  return (
    <div className="content-page first-year-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {en ? 'A GOOD START' : 'EEN GOED BEGIN'}
          </span>
          <h1>{en ? 'First-year' : 'Eerstejaars'}</h1>
          <p>
            {en
              ? 'Study essentials, events nearby and practical help in one place.'
              : 'Studie-informatie, evenementen in de buurt en praktische hulp op één plek.'}
          </p>
        </div>
      </div>

      <label className="first-year-search">
        <Search size={21} aria-hidden="true" />
        <span className="sr-only">
          {en ? 'Search within First-year' : 'Zoek in Eerstejaars'}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            en ? 'Search within First-year...' : 'Zoek in Eerstejaars...'
          }
          aria-label={en ? 'Search within First-year' : 'Zoek in Eerstejaars'}
        />
      </label>

      <div
        className="quick-actions first-year-filters"
        role="group"
        aria-label={en ? 'Filter first-year information' : 'Filter Eerstejaars'}
      >
        {firstYearFilters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={filter === entry.id}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label[locale]}
          </button>
        ))}
      </div>

      <p className="study-result-count" aria-live="polite">
        {en ? `${totalResults} results` : `${totalResults} resultaten`}
      </p>

      {(['start', 'leisure', 'future'] as FirstYearSectionId[]).map(
        (sectionId) => {
          const items = visibleInfo.filter(
            (item) => item.section === sectionId,
          );
          if (!items.length) return null;
          return (
            <section className="first-year-section" key={sectionId}>
              <SectionHeading id={sectionId} locale={locale} />
              <div className="card-grid first-year-grid">
                {items.map((item) => (
                  <StudyCard item={item} locale={locale} key={item.id} />
                ))}
              </div>
            </section>
          );
        },
      )}

      {visibleEvents.length > 0 && (
        <section
          className="first-year-section"
          data-first-year-section="events"
        >
          <SectionHeading id="nearby-events" locale={locale} />
          <div className="card-grid first-year-grid">
            {visibleEvents.map((event) => (
              <EventCard
                event={event}
                locale={locale}
                now={now}
                key={event.id}
              />
            ))}
          </div>
        </section>
      )}

      {visibleTips.length > 0 && (
        <section className="first-year-section" data-first-year-section="tips">
          <SectionHeading id="tips" locale={locale} />
          <div className="card-grid first-year-grid">
            {visibleTips.map((tip) => (
              <article
                className="discovery-card tip-action first-year-card"
                data-tip-id={tip.id}
                key={tip.id}
              >
                <div className="card-icon">
                  <Icon name={tip.icon} />
                </div>
                <h3>{tip.resolvedTitle}</h3>
                <p>{tip.resolvedBody}</p>
                {tip.id === 'room-code' && (
                  <div className="welcome-example">
                    <span>F</span>
                    <span>3</span>
                    <span>025</span>
                    <small>Zone</small>
                    <small>{en ? 'Floor' : 'Verdieping'}</small>
                    <small>{en ? 'Room' : 'Lokaal'}</small>
                  </div>
                )}
                {tip.location ? (
                  <Link
                    className="text-link"
                    href={`/map?to=${tip.location.id}`}
                    onClick={() => track('tip_view', { tip_id: tip.id })}
                  >
                    {en ? 'View on map' : 'Bekijk op kaart'} →
                  </Link>
                ) : tip.id === 'report' ? (
                  <ReportButton locale={locale} />
                ) : tip.id === 'campus-tour' ? (
                  <a
                    className="text-link"
                    onClick={() => track('tip_view', { tip_id: tip.id })}
                    href="https://www.nhlstenden.com/hulp-bij-studiekeuze/campustour"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {en ? 'View Campus Tour' : 'Bekijk Campus Tour'}{' '}
                    <ExternalLink size={15} aria-hidden="true" />
                    <span className="sr-only">
                      {en
                        ? '(opens in a new tab)'
                        : '(opent in een nieuw tabblad)'}
                    </span>
                  </a>
                ) : (
                  <Link
                    className="text-link"
                    onClick={() => track('tip_view', { tip_id: tip.id })}
                    href={
                      tip.id === 'access'
                        ? '/map?to=library&navigate=1&accessible=1'
                        : '/map'
                    }
                  >
                    {en ? 'Open map' : 'Open kaart'} →
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {totalResults === 0 && (
        <div className="empty-state first-year-empty">
          <h2>{en ? 'No information found' : 'Geen informatie gevonden'}</h2>
          <p>
            {en
              ? 'Try another search term or choose All.'
              : 'Probeer een andere zoekterm of kies Alles.'}
          </p>
        </div>
      )}
    </div>
  );
}
