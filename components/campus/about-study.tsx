'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { Icon } from './icon';
import type { Locale } from '@/lib/campus/types';
import {
  localizeStudyContent,
  localizeStudyText,
  searchStudyInfo,
  studyCategories,
  studyInfoItems,
  type StudyCategoryId,
  type StudyContentBlock,
} from '@/lib/campus/about-study';

function ContentBlock({ block }: { block: StudyContentBlock }) {
  if (block.type === 'paragraph') return <p>{block.text}</p>;
  return (
    <ul>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function AboutStudyPage({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | StudyCategoryId>('all');
  const en = locale === 'en';
  const results = useMemo(
    () => searchStudyInfo(query, locale, category),
    [query, locale, category],
  );

  return (
    <div className="content-page about-study-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {en ? 'STUDY BASICS' : 'OVER JE STUDIE'}
          </span>
          <h1>{en ? 'About the study' : 'Over de studie'}</h1>
          <p>
            {en
              ? 'Clear explanations of NHL Stenden, education and Leisure & Events.'
              : 'Duidelijke uitleg over NHL Stenden, onderwijs en Leisure & Events.'}
          </p>
        </div>
      </div>

      <label className="about-study-search">
        <Search size={21} aria-hidden="true" />
        <span className="sr-only">
          {en ? 'Search within About the study' : 'Zoek binnen Over de studie'}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            en
              ? 'Search within About the study...'
              : 'Zoek binnen Over de studie...'
          }
          aria-label={
            en ? 'Search within About the study' : 'Zoek binnen Over de studie'
          }
        />
      </label>

      <div
        className="quick-actions about-study-filters"
        role="group"
        aria-label={en ? 'Filter study topics' : 'Filter studieonderwerpen'}
      >
        {studyCategories.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={category === entry.id}
            onClick={() => setCategory(entry.id)}
          >
            {entry.label[locale]}
          </button>
        ))}
      </div>

      <p className="study-result-count" aria-live="polite">
        {en
          ? `${results.length} of ${studyInfoItems.length} topics`
          : `${results.length} van ${studyInfoItems.length} onderwerpen`}
      </p>

      {results.length ? (
        <div className="card-grid about-study-grid">
          {results.map((item) => {
            const content = localizeStudyContent(item, locale);
            const categoryLabel = studyCategories.find(
              (entry) => entry.id === item.category,
            )!.label[locale];
            return (
              <article
                className="discovery-card tip-action about-study-card"
                data-study-id={item.id}
                data-content-status={
                  item.awaitingFullProjectText
                    ? 'awaiting-project-text'
                    : 'complete'
                }
                key={item.id}
              >
                <div className="about-study-card-heading">
                  <div className="card-icon">
                    <Icon name={item.icon} />
                  </div>
                  <span className="status-chip study-category">
                    {categoryLabel}
                  </span>
                </div>
                <h2>{localizeStudyText(item.title, locale)}</h2>
                <div className="about-study-content">
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
                        {content.slice(1).map((block, index) => (
                          <ContentBlock block={block} key={index} />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
                {item.source && (
                  <a
                    className="text-link about-study-source"
                    href={item.source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {localizeStudyText(item.source.label, locale)}
                    <ExternalLink size={15} aria-hidden="true" />
                    <span className="sr-only">
                      {en
                        ? '(opens in a new tab)'
                        : '(opent in een nieuw tabblad)'}
                    </span>
                  </a>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state about-study-empty">
          <h2>{en ? 'No topic found' : 'Geen onderwerp gevonden'}</h2>
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
