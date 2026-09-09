'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Plus, Heart, ArrowUpRight, Sparkles } from 'lucide-react';
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
import { Icon } from './icon';
import {track} from '@/lib/campus/analytics';
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
    [sort,setSort]=useState('popular'),
    [context,setContext]=useState({building:'',floor:''}),
    [busy, setBusy] = useState<string | null>(null),
    [liked, setLiked] = useState<string[]>([]),
    en = locale === 'en';
  useEffect(()=>{try{setContext({building:sessionStorage.getItem('ck-building')??'',floor:sessionStorage.getItem('ck-floor')??''});const ids=JSON.parse(localStorage.getItem('ck-liked')??'[]');if(Array.isArray(ids))setLiked(ids.filter(x=>typeof x==='string').slice(-1000));}catch{}if(slug)track('gem_view');},[slug]);
  const near=(g:Gem)=>{const l=data.locations.find(l=>l.id===g.location_id);return l?.floor_id===context.floor?2:l?.building_id===context.building?1:0;};
  const shown = gems.filter(
    (g) =>
      (!slug || g.slug === slug) && (filter === 'all' || g.category === filter),
  ).sort((a,b)=>sort==='new'?(b.created_at??'').localeCompare(a.created_at??''):sort==='nearby'?near(b)-near(a)||b.likes-a.likes:b.likes-a.likes);
  async function like(g: Gem) {
    if (busy || liked.includes(g.id)) return;
    setBusy(g.id);
    setGems(gems.map(item=>item.id===g.id?{...item,likes:item.likes+1}:item));
    setLiked([...liked,g.id]);
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
      try{localStorage.setItem('ck-liked',JSON.stringify([...liked,g.id].slice(-1000)));}catch{}
      track('gem_like',{gem_id:g.id});
      onToast(en ? 'Thanks for your vote!' : 'Bedankt voor je like!');
    } catch {
      setGems(gems);setLiked(liked);
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
      <div className="gem-sorting" role="group" aria-label={en?'Sort gems':'Gems sorteren'}>{[['popular',en?'Popular':'Populair'],['new',en?'New':'Nieuw'],...(context.building?[['nearby',en?'Nearby':'Dichtbij']]:[])].map(([id,label])=><button className="secondary-button" key={id} aria-pressed={sort===id} onClick={()=>setSort(id)}>{label}</button>)}{sort==='nearby'&&<small>{en?'Based on your chosen floor/building':'Op basis van je gekozen verdieping/gebouw'} · {context.building}</small>}</div>
      <div className="card-grid">
        {shown.map((g) => {
          const location = data.locations.find((l) => l.id === g.location_id);
          return (
            <article className="gem-card" key={g.id}>
              {g.photo_path && (
                <Image unoptimized
                  src={'/api/gems/' + g.id + '/photo'}
                  alt={g.title}
                  width={400}
                  height={240}
                  loading="lazy"
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
              <small className="gem-origin">{en?'Discovered by students':'Door studenten ontdekt'}</small>
              <h2>
                <Link onClick={()=>track('gem_view',{gem_id:g.id})} href={'/gems/' + g.slug}>{g.title}</Link>
              </h2>
              <p>{g.description}</p>
              <small className="muted">
                {location?.name[locale]} · {location?.building_id} · {en?'Floor':'Verdieping'} {data.floors.find(f=>f.id===location?.floor_id)?.level}
              </small>
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
                <Link className="text-link" href={'/map?to=' + g.location_id}>
                  {en ? 'View on map' : 'Bekijk op kaart'}
                  <ArrowUpRight size={16} />
                </Link>
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
      {!slug&&gems.length<3&&<section className="curated-section"><h2>CampusKompas-tips</h2><div className="card-grid">{['library','central-brew','food-court'].map(id=>data.locations.find(l=>l.id===id)).filter(l=>!!l&&(filter==='all'||filter==='coffee'&&l.category_id==='coffee'||filter==='food'&&l.category_id==='food'||filter==='study'&&l.category_id==='library')).map(l=>l&&<article key={l.id} className="gem-card"><span className="tag">CampusKompas-tip</span><h3>{l.name[locale]}</h3><p>{l.description[locale]}</p><small>{l.building_id} · {en?'Floor':'Verdieping'} {data.floors.find(f=>f.id===l.floor_id)?.level}</small><Link className="text-link" href={'/map?to='+l.id}>{en?'View on map':'Bekijk op kaart'} →</Link></article>)}</div></section>}
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
  const [building, setBuilding] = useState(data.buildings[0]?.id ?? ''),
    [floor, setFloor] = useState(data.floors[0]?.id ?? ''),
    [location, setLocation] = useState(''),
    [category, setCategory] = useState('study'),
    [started] = useState(Date.now),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [showMap, setShowMap] = useState(false),
    en = locale === 'en';
  const places = data.locations.filter((l) => l.floor_id === floor),
    currentFloor = data.floors.find((f) => f.id === floor);
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    form.set('category', category);
    form.set('location_id', location);
    form.set('started_at', String(started));
    const parsed = gemSchema.safeParse({
      ...Object.fromEntries([...form.entries()].filter(([k]) => k !== 'photo')),
      started_at: started,
    });
    if (!parsed.success) {
      setError(
        en
          ? 'Use a title of 5–90 characters, a description of 15–1200 characters and select a location.'
          : 'Gebruik een titel van 5–90 tekens, een beschrijving van 15–1200 tekens en kies een locatie.',
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
      <div className="form-grid">
        <Picker
          label={en ? 'Building' : 'Gebouw'}
          value={building}
          onChange={(b) => {
            setBuilding(b);
            setFloor(data.floors.find((f) => f.building_id === b)!.id);
            setLocation('');
          }}
          options={data.buildings.map((b) => ({ value: b.id, label: b.name }))}
        />
        <Picker
          label={en ? 'Floor' : 'Verdieping'}
          value={floor}
          onChange={(f) => {
            setFloor(f);
            setLocation('');
          }}
          options={data.floors
            .filter((f) => f.building_id === building)
            .map((f) => ({ value: f.id, label: String(f.level) }))}
        />
      </div>
      <Picker
        label={en ? 'Location' : 'Locatie'}
        value={location}
        onChange={setLocation}
        options={places.map((l) => ({ value: l.id, label: l.name[locale] }))}
      />
      {!places.length && (
        <p className="form-note">
          {en
            ? 'There are no registered locations on this floor yet.'
            : 'Op deze verdieping zijn nog geen locaties geregistreerd.'}
        </p>
      )}
      <button
        type="button"
        className="text-link"
        onClick={() => setShowMap(!showMap)}
      >
        {en ? 'Choose location on map' : 'Locatie kiezen op kaart'}
      </button>
      {showMap && currentFloor && (
        <CampusMap
          data={data}
          floor={currentFloor}
          selected={data.locations.find((l) => l.id === location) ?? null}
          from=""
          route={null}
          onSelect={(l) => setLocation(l.id)}
          locale={locale}
        />
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
