'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowUpRight } from 'lucide-react';
import type { CampusData, Locale, Location, Gem } from '@/lib/campus/types';
import { searchLocations } from '@/lib/campus/search';
import { normalizeSearch } from '@/lib/routing/normalization';
import { Icon } from './icon';
import {ReportButton,Feedback} from './community';
import {track} from '@/lib/campus/analytics';
export function CampusSearch({
  data,
  locale,
  onSelect,
  gems = [],
  focusOnOpen = false,
}: {
  data: CampusData;
  locale: Locale;
  onSelect: (l: Location) => void;
  gems?: Gem[];
  focusOnOpen?: boolean;
}) {
  const [query, setQuery] = useState(''),
    [focused, setFocused] = useState(false),
    [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null),
    en = locale === 'en';
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem('ck-recent') ?? '[]'));
    } catch {}
    if (focusOnOpen) input.current?.focus();
  }, [focusOnOpen]);
  const results = searchLocations(data, query),
    gemResults = query
      ? gems.filter((g) =>
          normalizeSearch(g.title + ' ' + g.description).includes(
            normalizeSearch(query),
          ),
        )
      : [];
  function choose(l: Location) {
    track('search',{result_count:results.length});
    const ids = [l.id, ...recent.filter((id) => id !== l.id)].slice(0, 5);
    setRecent(ids);
    try {
      localStorage.setItem('ck-recent', JSON.stringify(ids));
    } catch {}
    setQuery('');
    setFocused(false);
    input.current?.blur();
    onSelect(l);
  }
  return (
    <div
      className="search-area"

    >
      <div className="search-box">
        <Search size={21} />
        <input
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setQuery('');
          setFocused(false);
          input.current?.focus();
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          e.currentTarget.closest('.search-area')?.querySelector<HTMLButtonElement>('.result')?.focus();
        }
      }}
          ref={input}
          aria-label={
            en ? 'Search room or facility' : 'Zoek lokaal of voorziening'
          }
          aria-controls={focused&&(query||recent.length>0)?'campus-results':undefined}
          value={query}
          maxLength={100}
          autoComplete="off"
          enterKeyHint="search"
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocused(true);
          }}
          placeholder={
            en
              ? 'Search room, coffee, library...'
              : 'Zoek lokaal, koffie, bibliotheek...'
          }
        />
        {query ? (
          <button
            className="icon-button"
            aria-label={en ? 'Clear search' : 'Zoekopdracht wissen'}
            onClick={() => {
              setQuery('');
              input.current?.focus();
            }}
          >
            <X size={18} />
          </button>
        ) : (
          <span className="key-hint">
            <Search size={13} />
          </span>
        )}
      </div>
      {focused && (query || recent.length > 0) && (
        <div className="search-results" id="campus-results">
          <button className="text-link" onClick={() => setFocused(false)}>
            {en ? 'Close results' : 'Resultaten sluiten'} <X size={14} />
          </button>
          {!query ? (
            <>
              <div className="result-group">
                {en ? 'Recent searches' : 'Recent gezocht'}
              </div>
              {recent
                .map((id) => data.locations.find((l) => l.id === id))
                .filter((l): l is Location => !!l)
                .map((l) => (
                  <Result
                    key={l.id}
                    l={l}
                    data={data}
                    locale={locale}
                    choose={choose}
                  />
                ))}
            </>
          ) : (
            <>
              {['room', 'facility'].map((group) => {
                const matches = results.filter((l) =>
                  group === 'room'
                    ? l.category_id === 'room'
                    : l.category_id !== 'room',
                );
                return (
                  matches.length > 0 && (
                    <div key={group}>
                      <div className="result-group">
                        {group === 'room'
                          ? en
                            ? 'Rooms'
                            : 'Lokalen'
                          : en
                            ? 'Facilities'
                            : 'Voorzieningen'}
                      </div>
                      {matches.slice(0,6).map((l) => (
                        <Result
                          key={l.id}
                          l={l}
                          data={data}
                          locale={locale}
                          choose={choose}
                        />
                      ))}
                    </div>
                  )
                );
              })}
              {gemResults.length > 0 && (
                <div>
                  <div className="result-group">Hidden Gems</div>
                  {gemResults.slice(0,3).map((g) => (
                    <Link className="result" key={g.id} href={'/gems/' + g.slug}>
                      {g.title}
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                </div>
              )}
              {!results.length && !gemResults.length && (
                <div className="empty-search">
                  <strong>
                    {en ? 'We cannot find this place yet.' : 'Deze plek kunnen we nog niet vinden.'}
                  </strong>
                  <p>
                    {en
                      ? 'Try a different spelling, or find your room on the map.'
                      : 'Probeer een andere schrijfwijze, of zoek je lokaal op de kaart.'}
                  </p>
                  <button className="secondary-button" onClick={()=>{track('search_no_results');setFocused(false);}}>{en?'View map':'Bekijk kaart'}</button>
                  <ReportButton locale={locale} query={query}/>
                  <Feedback locale={locale} context="search"/>
                </div>
              )}
            </>
          )}
        </div>
      )}
      <div className="quick-actions">
        <button
          onClick={() => {
            input.current?.focus();
            setQuery('');
            setFocused(true);
          }}
        >
          <Icon name="door" size={15} />
          {en ? 'Find a room' : 'Zoek lokaal'}
        </button>
        {['library', 'coffee', 'study', 'toilet', 'info'].map((id) => {
          const c = data.categories.find((c) => c.id === id);
          return (
            c && (
              <button
                key={id}
                onClick={() => {
                  setQuery(c.name[locale]);
                  setFocused(true);
                }}
              >
                <Icon name={c.icon} size={15} />
                {c.name[locale]}
              </button>
            )
          );
        })}
      </div>
    </div>
  );
}
function Result({
  l,
  data,
  locale,
  choose,
}: {
  l: Location;
  data: CampusData;
  locale: Locale;
  choose: (l: Location) => void;
}) {
  const c = data.categories.find((c) => c.id === l.category_id),
    f = data.floors.find((f) => f.id === l.floor_id);
  return (
    <button className="result" onClick={() => choose(l)}>
      <span className="result-icon">
        <Icon name={c?.icon ?? 'map'} />
      </span>
      <span>
        <strong>{l.name[locale]}</strong>
        <small>
          {l.building_id} · {locale === 'nl' ? 'Verdieping' : 'Floor'}{' '}
          {f?.level} · {c?.name[locale]}
        </small>
      </span>
      <ArrowUpRight size={16} />
    </button>
  );
}
