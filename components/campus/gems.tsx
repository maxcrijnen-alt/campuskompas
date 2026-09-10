'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  Plus,
  Heart,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { CampusData, Locale, Gem } from '@/lib/campus/types';
import { gemCategories, gemSchema, photoLimit } from '@/lib/campus/validation';
import { Picker } from './picker';
import { CampusMap } from './map';
import { CampusSearch } from './search';
import { Icon } from './icon';
import { track } from '@/lib/campus/analytics';
import { createRouteEndpointResolver } from '@/lib/routing/endpoints';
import { OpeningHours } from './opening-hours';
const labels = {
  nl: [
    'Rust',
    'Studeren',
    'Chillen',
    'Eten',
    'Koffie',
    'Stopcontacten',
    'Uitzicht',
    'Groepswerk',
    'Overig',
  ],
  en: [
    'Quiet',
    'Study',
    'Chill',
    'Food',
    'Coffee',
    'Power outlets',
    'View',
    'Group work',
    'Other',
  ],
};
export function GemsPage({
  data,
  locale,
  connected,
  gems,
  setGems,
  slug,
  onToast,
}: {
  data: CampusData;
  locale: Locale;
  connected: boolean;
  gems: Gem[];
  setGems: (g: Gem[]) => void;
  slug?: string;
  onToast: (s: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [filter, setFilter] = useState('all'),
    [sort, setSort] = useState('popular'),
    [context, setContext] = useState({ building: '', floor: '' }),
    [busy, setBusy] = useState<string | null>(null),
    [liked, setLiked] = useState<string[]>([]),
    en = locale === 'en',
    resolver = createRouteEndpointResolver(data);
  useEffect(() => {
    try {
      setContext({
        building: sessionStorage.getItem('ck-building') ?? '',
        floor: sessionStorage.getItem('ck-floor') ?? '',
      });
      const ids = JSON.parse(localStorage.getItem('ck-liked') ?? '[]');
      if (Array.isArray(ids))
        setLiked(ids.filter((x) => typeof x === 'string').slice(-1000));
    } catch {}
    if (slug) track('gem_view');
  }, [slug]);
  const near = (g: Gem) => {
    const l = data.locations.find((l) => l.id === g.location_id);
    return l?.floor_id === context.floor
      ? 2
      : l?.building_id === context.building
        ? 1
        : 0;
  };
  const shown = gems
    .filter(
      (g) =>
        (!slug || g.slug === slug) &&
        (filter === 'all' || g.category === filter),
    )
    .sort((a, b) =>
      sort === 'new'
        ? (b.created_at ?? '').localeCompare(a.created_at ?? '')
        : sort === 'nearby'
          ? near(b) - near(a) || b.likes - a.likes
          : b.likes - a.likes,
    );
  async function like(g: Gem) {
    if (busy || liked.includes(g.id)) return;
    setBusy(g.id);
    setGems(
      gems.map((item) =>
        item.id === g.id ? { ...item, likes: item.likes + 1 } : item,
      ),
    );
    setLiked([...liked, g.id]);
    try {
      const response = await fetch('/api/gems/' + g.id + '/like', {
        method: 'POST',
      });
      if (!response.ok) throw Error();
      const result = (await response.json()) as { likes: number };
      setGems(
        gems.map((item) =>
          item.id === g.id ? { ...item, likes: result.likes } : item,
        ),
      );
      try {
        localStorage.setItem(
          'ck-liked',
          JSON.stringify([...liked, g.id].slice(-1000)),
        );
      } catch {}
      track('gem_like', { gem_id: g.id });
      onToast(en ? 'Thanks for your vote!' : 'Bedankt voor je like!');
    } catch {
      setGems(gems);
      setLiked(liked);
      onToast(
        en
          ? 'Could not save your like. Please try again.'
          : 'Je like kon niet worden opgeslagen. Probeer opnieuw.',
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="content-page">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            {en ? 'GOOD SPOTS ARE MEANT TO BE SHARED' : 'GOEDE PLEKKEN DEEL JE'}
          </div>
          <h1>
            Hidden Gems <Sparkles size={30} style={{ display: 'inline' }} />
          </h1>
          <p>
            {en
              ? 'The little campus discoveries that make your day.'
              : 'Die kleine campusontdekkingen die je dag beter maken.'}
          </p>
        </div>
        <button className="primary-button" onClick={() => setOpen(true)}>
          <Plus size={20} />
          {en ? 'Share a Hidden Gem' : 'Deel een Hidden Gem'}
        </button>
      </div>
      <div className="quick-actions" style={{ marginBottom: 24 }}>
        <button
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          {en ? 'All spots' : 'Alle plekken'}
        </button>
        {gemCategories.map((c, i) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
          >
            {labels[locale][i]}
          </button>
        ))}
      </div>
      <div
        className="gem-sorting"
        role="group"
        aria-label={en ? 'Sort gems' : 'Gems sorteren'}
      >
        {[
          ['popular', en ? 'Popular' : 'Populair'],
          ['new', en ? 'New' : 'Nieuw'],
          ...(context.building ? [['nearby', en ? 'Nearby' : 'Dichtbij']] : []),
        ].map(([id, label]) => (
          <button
            className="secondary-button"
            key={id}
            aria-pressed={sort === id}
            onClick={() => setSort(id)}
          >
            {label}
          </button>
        ))}
        {sort === 'nearby' && (
          <small>
            {en
              ? 'Based on your chosen floor/building'
              : 'Op basis van je gekozen verdieping/gebouw'}{' '}
            · {context.building}
          </small>
        )}
      </div>
      <div className="card-grid">
        {shown.map((g) => {
          const location = data.locations.find((l) => l.id === g.location_id);
          const routeable = location
            ? resolver.resolveLocation(location).nodeId !== null
            : false;
          return (
            <article className="gem-card" key={g.id}>
              {g.photo_path && (
                <Image
                  unoptimized
                  src={'/api/gems/' + g.id + '/photo'}
                  alt={g.title}
                  width={400}
                  height={240}
                  loading="eager"
                  style={{
                    width: '100%',
                    height: 190,
                    objectFit: 'cover',
                    borderRadius: 12,
                  }}
                />
              )}
              <span className="tag">
                {g.featured ? '★ ' : ''}
                {
                  labels[locale][
                    gemCategories.indexOf(
                      g.category as (typeof gemCategories)[number],
                    )
                  ]
                }
              </span>
              <small className="gem-origin">
                {en ? 'Discovered by students' : 'Door studenten ontdekt'}
              </small>
              <h2>
                <Link
                  onClick={() => track('gem_view', { gem_id: g.id })}
                  href={'/gems/' + g.slug}
                >
                  {g.title}
                </Link>
              </h2>
              <p>{g.description}</p>
              <small className="muted">
                {location
                  ? `${location.name[locale]} · ${location.building_id} · ${en ? 'Floor' : 'Verdieping'} ${data.floors.find((f) => f.id === location.floor_id)?.level}`
                  : [g.proposed_location_name, g.proposed_room_zone]
                      .filter(Boolean)
                      .join(' · ')}
              </small>
              <div className="gem-statuses">
                <span
                  className={`status-chip ${routeable ? 'status-success' : 'status-warning'}`}
                >
                  {routeable ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <AlertTriangle size={15} />
                  )}
                  {routeable
                    ? en
                      ? 'Route available'
                      : 'Route beschikbaar'
                    : en
                      ? 'Route needs verification'
                      : 'Route moet worden gecontroleerd'}
                </span>
              </div>
              {!routeable && (
                <p className="form-note" role="status">
                  {en
                    ? 'This place is awaiting map and route verification.'
                    : 'Deze plek wacht nog op kaart- en routecontrole.'}
                </p>
              )}
              {g.hours_id && (
                <OpeningHours
                  locale={locale}
                  hours={data.hours.find((hours) => hours.id === g.hours_id)}
                />
              )}
              <div className="gem-card-footer">
                <button
                  className="like-button"
                  aria-label={(en ? 'Like ' : 'Like ') + g.title}
                  aria-pressed={liked.includes(g.id)}
                  disabled={!!busy || liked.includes(g.id)}
                  onClick={() => like(g)}
                >
                  <Heart
                    size={20}
                    fill={liked.includes(g.id) ? 'currentColor' : 'none'}
                  />
                  {g.likes}
                </button>
                {routeable && location && (
                  <span className="gem-route-actions">
                    <Link className="text-link" href={'/map?to=' + location.id}>
                      {en ? 'View map' : 'Bekijk kaart'}
                    </Link>
                    <Link
                      className="text-link"
                      href={'/map?to=' + location.id + '&navigate=1'}
                    >
                      {en ? 'Route here' : 'Route hierheen'}
                      <ArrowUpRight size={16} />
                    </Link>
                  </span>
                )}
              </div>
            </article>
          );
        })}
        {!shown.length && (
          <div className="empty-state">
            <Icon name="sparkles" size={32} />
            <h2>
              {slug
                ? en
                  ? 'This gem is not available'
                  : 'Deze gem is niet beschikbaar'
                : en
                  ? 'Your discovery could be the first.'
                  : 'Jouw ontdekking kan de eerste zijn.'}
            </h2>
            <p>
              {en
                ? 'Share a useful spot. New tips appear here after a moderator has checked them.'
                : 'Deel een handige plek. Nieuwe tips verschijnen hier nadat een beheerder ze heeft gecontroleerd.'}
            </p>
            {!connected && (
              <p className="notice">
                {en
                  ? 'Submissions become available once the campus database is connected.'
                  : 'Insturen wordt beschikbaar zodra de campusdatabase is verbonden.'}
              </p>
            )}
          </div>
        )}
      </div>
      {!slug && gems.length < 3 && (
        <section className="curated-section">
          <h2>CampusKompas-tips</h2>
          <div className="card-grid">
            {['library', 'central-brew', 'food-court']
              .map((id) => data.locations.find((l) => l.id === id))
              .filter(
                (l) =>
                  !!l &&
                  (filter === 'all' ||
                    (filter === 'coffee' && l.category_id === 'coffee') ||
                    (filter === 'food' && l.category_id === 'food') ||
                    (filter === 'study' && l.category_id === 'library')),
              )
              .map(
                (l) =>
                  l && (
                    <article key={l.id} className="gem-card">
                      <span className="tag">CampusKompas-tip</span>
                      <h3>{l.name[locale]}</h3>
                      <p>{l.description[locale]}</p>
                      <small>
                        {l.building_id} · {en ? 'Floor' : 'Verdieping'}{' '}
                        {data.floors.find((f) => f.id === l.floor_id)?.level}
                      </small>
                      <Link className="text-link" href={'/map?to=' + l.id}>
                        {en ? 'View on map' : 'Bekijk op kaart'} →
                      </Link>
                    </article>
                  ),
              )}
          </div>
        </section>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dialog-form">
          <DialogTitle>
            {en ? 'Share a Hidden Gem' : 'Deel een Hidden Gem'}
          </DialogTitle>
          <DialogDescription>
            {en
              ? 'A little discovery, a big help. Your tip is reviewed before publication.'
              : 'Kleine ontdekking, groot plezier. We controleren je tip voordat die verschijnt.'}
          </DialogDescription>
          <GemForm
            data={data}
            locale={locale}
            connected={connected}
            onDone={() => {
              setOpen(false);
              onToast(
                en
                  ? 'Thanks! Your tip will be reviewed first.'
                  : 'Thanks! Je tip wordt eerst even gecontroleerd.',
              );
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
function GemForm({
  data,
  locale,
  connected,
  onDone,
}: {
  data: CampusData;
  locale: Locale;
  connected: boolean;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<'existing' | 'proposed'>('existing'),
    [building, setBuilding] = useState(''),
    [floor, setFloor] = useState(''),
    [location, setLocation] = useState<CampusData['locations'][number] | null>(
      null,
    ),
    [category, setCategory] = useState('study'),
    [started] = useState(Date.now),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [showMap, setShowMap] = useState(false),
    en = locale === 'en';
  const currentFloor = data.floors.find((f) => f.id === location?.floor_id);
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('category', category);
    form.set('location_mode', mode);
    form.set('location_id', mode === 'existing' ? (location?.id ?? '') : '');
    if (mode === 'proposed') {
      form.set('proposed_building_id', building);
      form.set('proposed_floor_id', floor);
    }
    form.set('started_at', String(started));
    const parsed = gemSchema.safeParse({
      ...Object.fromEntries([...form.entries()].filter(([k]) => k !== 'photo')),
      started_at: started,
    });
    if (!parsed.success) {
      setError(
        en
          ? 'Check the title, description and location information.'
          : 'Controleer de titel, beschrijving en locatiegegevens.',
      );
      return;
    }
    const photo = form.get('photo');
    if (photo instanceof File && photo.size > photoLimit) {
      setError(
        en
          ? 'Photo must be smaller than 3 MB.'
          : 'Je foto mag maximaal 3 MB zijn.',
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/gems', { method: 'POST', body: form });
      if (!response.ok) throw Error(String(response.status));
      track('gem_submit');
      onDone();
    } catch (e) {
      setError(
        e instanceof Error && e.message === '429'
          ? en
            ? 'Too many submissions. Try again later.'
            : 'Te veel inzendingen. Probeer het later opnieuw.'
          : en
            ? 'Your tip was not saved. Please try again later.'
            : 'Je tip is niet opgeslagen. Probeer het later opnieuw.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <label className="field-label">
        {en ? 'Title' : 'Titel'}
        <input
          className="field-input"
          name="title"
          required
          minLength={5}
          maxLength={90}
          placeholder={
            en
              ? 'What makes this spot special?'
              : 'Wat maakt deze plek bijzonder?'
          }
        />
      </label>
      <label className="field-label">
        {en ? 'Description' : 'Beschrijving'}
        <textarea
          className="field-input"
          name="description"
          required
          minLength={15}
          maxLength={1200}
          rows={3}
        />
      </label>
      <Picker
        label={en ? 'Category' : 'Categorie'}
        value={category}
        onChange={setCategory}
        options={gemCategories.map((c, i) => ({
          value: c,
          label: labels[locale][i],
        }))}
      />
      <fieldset className="location-mode">
        <legend>{en ? 'Where is it?' : 'Waar is de plek?'}</legend>
        <label>
          <input
            type="radio"
            checked={mode === 'existing'}
            onChange={() => setMode('existing')}
          />{' '}
          {en
            ? 'Choose a known campus location'
            : 'Kies een bekende campuslocatie'}
        </label>
        <label>
          <input
            type="radio"
            checked={mode === 'proposed'}
            onChange={() => setMode('proposed')}
          />{' '}
          {en ? 'Propose a new place' : 'Stel een nieuwe plek voor'}
        </label>
      </fieldset>
      {mode === 'existing' ? (
        <>
          <CampusSearch
            data={data}
            locale={locale}
            compact
            selected={location}
            inputLabel={
              en ? 'Search a campus location' : 'Zoek een campuslocatie'
            }
            placeholder={
              en ? 'Room, café, library…' : 'Lokaal, café, bibliotheek…'
            }
            onSelect={setLocation}
          />
          {location && (
            <button
              type="button"
              className="text-link"
              onClick={() => setShowMap(!showMap)}
            >
              {en ? 'Check on map' : 'Controleer op kaart'}
            </button>
          )}
          {showMap && currentFloor && location && (
            <CampusMap
              data={data}
              floor={currentFloor}
              selected={location}
              from=""
              route={null}
              onSelect={setLocation}
              locale={locale}
            />
          )}
        </>
      ) : (
        <div className="proposed-location-fields">
          <label className="field-label">
            {en ? 'Place name' : 'Naam van de plek'}
            <input
              className="field-input"
              name="proposed_location_name"
              required
              maxLength={120}
            />
          </label>
          <div className="form-grid">
            <label className="field-label">
              {en ? 'Building (if known)' : 'Gebouw (indien bekend)'}
              <select
                className="field-input"
                value={building}
                onChange={(event) => {
                  setBuilding(event.target.value);
                  setFloor('');
                }}
              >
                <option value="">{en ? 'Unknown' : 'Onbekend'}</option>
                {data.buildings.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              {en ? 'Floor (if known)' : 'Verdieping (indien bekend)'}
              <select
                className="field-input"
                value={floor}
                onChange={(event) => setFloor(event.target.value)}
                disabled={!building}
              >
                <option value="">{en ? 'Unknown' : 'Onbekend'}</option>
                {data.floors
                  .filter((entry) => entry.building_id === building)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.level}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="field-label">
            {en ? 'Room or zone (if known)' : 'Lokaal of zone (indien bekend)'}
            <input
              className="field-input"
              name="proposed_room_zone"
              maxLength={120}
            />
          </label>
          <label className="field-label">
            {en
              ? 'How can a moderator find it?'
              : 'Hoe kan een beheerder de plek vinden?'}
            <textarea
              className="field-input"
              name="proposed_location_description"
              maxLength={600}
              rows={3}
            />
          </label>
          <p className="form-note">
            {en
              ? 'A proposal is reviewed before it can appear on the map or be used for routing.'
              : 'Een voorstel wordt gecontroleerd voordat het op de kaart of in een route kan verschijnen.'}
          </p>
        </div>
      )}
      <label className="field-label">
        {en ? 'Photo (optional, max. 3 MB)' : 'Foto (optioneel, max. 3 MB)'}
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          className="field-input"
        />
      </label>
      <p className="form-note">
        {en
          ? 'Use your own photo. Avoid recognisable people and personal information. No student account needed.'
          : 'Gebruik je eigen foto. Vermijd herkenbare personen en persoonsgegevens. Geen studentenaccount nodig.'}
      </p>
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!connected && (
        <p className="notice">
          {en
            ? 'Submissions are unavailable until the database is connected.'
            : 'Insturen is niet beschikbaar totdat de database is verbonden.'}
        </p>
      )}
      <button
        className="primary-button"
        type="submit"
        disabled={busy || !connected}
      >
        {busy
          ? en
            ? 'Sending…'
            : 'Versturen…'
          : en
            ? 'Send my discovery'
            : 'Verstuur mijn ontdekking'}
      </button>
    </form>
  );
}
