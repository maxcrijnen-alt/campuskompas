'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import type { Locale } from '@/lib/campus/types';
import { searchStudyInfo, studyInfoItems } from '@/lib/campus/study-info';

export function StudyInfoPage({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState('');
  const en = locale === 'en';
  const results = useMemo(
    () => searchStudyInfo(query, locale),
    [query, locale],
  );

  return (
    <div className="content-page study-info-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {en ? 'QUICK ANSWERS' : 'SNEL ANTWOORD'}
          </span>
          <h1>{en ? 'Study info' : 'Studie-info'}</h1>
          <p>
            {en
              ? 'Find the right official information without searching the entire university website.'
              : 'Vind snel de juiste officiële informatie zonder de hele website te doorzoeken.'}
          </p>
        </div>
      </div>
      <label className="study-info-search">
        <Search size={21} aria-hidden="true" />
        <span className="sr-only">
          {en ? 'Search study information' : 'Zoek studie-informatie'}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            en
              ? 'Search study information, exam board, regulations...'
              : 'Zoek studie-informatie, examencommissie, OER...'
          }
          aria-label={
            en ? 'Search study information' : 'Zoek studie-informatie'
          }
        />
      </label>
      <p className="study-result-count" aria-live="polite">
        {en
          ? `${results.length} of ${studyInfoItems.length} topics`
          : `${results.length} van ${studyInfoItems.length} onderwerpen`}
      </p>
      {results.length ? (
        <div className="study-info-grid">
          {results.map((item) => (
            <article className="study-info-card" key={item.id}>
              <span className="status-chip study-category">
                {item.category[locale]}
              </span>
              <h2>{item.title[locale]}</h2>
              <p>{item.summary[locale]}</p>
              <a
                className="text-link"
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {en ? 'View official source' : 'Bekijk officiële bron'}
                <ExternalLink size={15} aria-hidden="true" />
                <span className="sr-only">
                  {en ? '(opens in a new tab)' : '(opent in een nieuw tabblad)'}
                </span>
              </a>
              <small>{item.sourceTitle}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state study-info-empty">
          <h2>{en ? 'No information found' : 'Geen informatie gevonden'}</h2>
          <p>
            {en
              ? 'Try another search term or contact Student Info.'
              : 'Probeer een andere zoekterm of neem contact op met Student Info.'}
          </p>
          <a
            className="text-link"
            href={studyInfoItems[0].sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Student Info <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}
