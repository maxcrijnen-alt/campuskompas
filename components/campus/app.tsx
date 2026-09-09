'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Compass, Search } from 'lucide-react';
import type { CampusData, Locale, Location, Gem } from '@/lib/campus/types';
import { brand } from '@/lib/campus/brand';
import { normalizeRoomCode } from '@/lib/routing/normalization';
import type { Route } from '@/lib/routing/graph';
import { CampusMap } from './map';
import { Icon } from './icon';
import { CampusSearch } from './search';
import { LocationPanel } from './details';
import { RoutePanel } from './route-panel';
import { GemsPage } from './gems';
import {TipsPage} from './tips';
import {track} from '@/lib/campus/analytics';
export function CampusApp({
  data,
  connected,
  unavailable,
  view = 'map',
  initialTarget,
  gemSlug,
}: {
  data: CampusData;
  connected: boolean;
  unavailable: boolean;
  view?: 'map' | 'gems' | 'tips';
  initialTarget?: string;
  gemSlug?: string;
}) {
  const [locale, setLocale] = useState<Locale>('nl'),
    [floorId, setFloor] = useState(data.floors[0]?.id ?? ''),
    [selected, setSelected] = useState<Location | null>(null),
    [from, setFrom] = useState(''),
    [qrOrigin,setQrOrigin]=useState(false),
    [hasOrigin, setHasOrigin] = useState(false),
    [routing, setRouting] = useState(false),
    [route, setRoute] = useState<Route | null>(null),
    [picking, setPicking] = useState(false),
    [toast, setToast] = useState(''),
    [gems, setGems] = useState<Gem[]>([]),
    [globalSearch, setGlobalSearch] = useState(false),
    [missing, setMissing] = useState(false);
  const en = locale === 'en',
    floor = data.floors.find((f) => f.id === floorId);
  useEffect(() => {
    try {
      const lang = localStorage.getItem('ck-locale');
      if (lang === 'en' || lang === 'nl') setLocale(lang);
    } catch {}
    const params = new URLSearchParams(window.location.search),
      target = initialTarget ?? params.get('to');
    if (target) {
      const l = data.locations.find(
        (l) =>
          normalizeRoomCode(l.id) === normalizeRoomCode(target) || normalizeRoomCode(l.id)===normalizeRoomCode(target.replace(/^loc-/,'')) ||
          (l.room_code &&
            normalizeRoomCode(l.room_code) === normalizeRoomCode(target)),
      );
      if (l) {
        setSelected(l);
        setFloor(l.floor_id);
        if(params.get('navigate')==='1')setRouting(true);
      } else setMissing(true);
    }
    let origin = params.get('from');
    if (origin?.startsWith('qr:'))
      origin =
        data.qr.find((q) => q.code === origin?.slice(3) && q.active)
          ?.route_node_id ?? null;
    const n =
      data.nodes.find((n) => n.id === origin) ||
      data.nodes.find(
        (n) => n.id === data.locations.find((l) => l.id === origin || l.id === origin?.replace(/^loc-/,''))?.node_id,
      );
    if (n) {
      setQrOrigin(params.get('from')?.startsWith('qr:')??false);
      if(params.get('from')?.startsWith('qr:'))track('qr_entry',{building:n.building_id});
      setFrom(n.id);
      setHasOrigin(true);
      if (!target) setFloor(n.floor_id);
      if (target) setRouting(true);
    } else if (params.has('from'))
      setToast('QR/startpunt niet herkend · Starting point not found');
    if (connected)
      fetch('/api/gems')
        .then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then((v) => setGems((v as { gems: Gem[] }).gems))
        .catch(() => {});
  }, [data, initialTarget, connected]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(()=>{if(view==='map'&&floor){try{sessionStorage.setItem('ck-building',floor.building_id);sessionStorage.setItem('ck-floor',floor.id);}catch{}}},[floor,view]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  function select(l: Location) {
    if (picking && l.node_id) {
      setFrom(l.node_id);
      setHasOrigin(true);
      setQrOrigin(false);
      setPicking(false);
      return;
    }
    track('location_view',{location_id:l.id,category:l.category_id});
    setSelected(l);
    setFloor(l.floor_id);
    setRoute(null);
    setRouting(false);
    setMissing(false);
    const url = new URL(window.location.href);
    url.searchParams.set('to', l.id);
    url.searchParams.delete('route');url.searchParams.delete('stage');
    try{sessionStorage.setItem('ck-building',l.building_id);sessionStorage.setItem('ck-floor',l.floor_id);}catch{}
    window.history.replaceState(null, '', url);
  }
  const nav = (
    <>
      {[
        ['map', en ? 'Map' : 'Kaart', 'map'],
        ['gems', 'Hidden Gems', 'sparkles'],
        ['tips', en ? 'First-year tips' : 'Eerstejaars Tips', 'book'],
      ].map(([id, label, icon]) => (
        <Link
          key={id}
          className={'nav-link ' + (view === id ? 'active' : '')}
          aria-current={view === id ? 'page' : undefined}
          href={'/' + id}
        >
          <Icon name={icon} />
          {label}
        </Link>
      ))}
    </>
  );
  return (
    <>
      <header className="app-header">
        <Link href="/" className="wordmark">
          <span className="logo">
            <Compass size={26} />
          </span>
          {brand.name}
        </Link>
        <nav
          className="desktop-nav"
          aria-label={en ? 'Main navigation' : 'Hoofdnavigatie'}
        >
          {nav}
        </nav>
        <div className="header-end">
          <span className="campus-label">Leeuwarden campus</span>
          {view !== 'map' && (
            <button
              className="icon-button"
              aria-label={en ? 'Search campus' : 'Zoek op campus'}
              onClick={() => setGlobalSearch(!globalSearch)}
            >
              <Search size={20} />
            </button>
          )}
          <button
            className="locale"
            aria-label={en ? 'Switch to Dutch' : 'Switch to English'}
            onClick={() => {const next=en?'nl':'en';try{localStorage.setItem('ck-locale',next);}catch{}setLocale(next);}}
          >
            {en ? 'EN / NL' : 'NL / EN'}
          </button>
        </div>
      </header>
      <main id="main" className={"page-wrap "+(view==='map'?'map-page '+(selected?'has-selection':''):'')}>
        {unavailable && (
          <div role="status" className="notice">
            {en
              ? 'The campus database is temporarily unavailable. Refresh the page to try again.'
              : 'De campusdatabase is tijdelijk niet beschikbaar. Vernieuw de pagina om opnieuw te proberen.'}
          </div>
        )}
        {globalSearch && (
          <CampusSearch
            data={data}
            locale={locale}
            focusOnOpen
            gems={gems}
            onSelect={(l) => {
              window.location.href = '/map?to=' + l.id;
            }}
          />
        )}
        {view === 'map' ? (
          <>
            <div className="intro-line"><h1>{en?'Where are you heading?':'Waar moet je heen?'}</h1><span className="campus-label">Rengerslaan 8 & 10</span></div>
            {hasOrigin&&<div className="origin-banner"><strong>{qrOrigin?(en?'You are here':'Je bent hier'):(en?'Starting point selected':'Startpunt gekozen')}</strong><span>{data.nodes.find(n=>n.id===from)?.label[locale]}</span></div>}
            {missing && (
              <div className="notice" role="status">
                {en
                  ? 'This location was not found. Search for another room or ask reception.'
                  : 'Deze locatie is niet gevonden. Zoek een ander lokaal of vraag de receptie.'}
              </div>
            )}
            <div className="workspace">
              <section
                className="map-card"
                aria-label={en ? 'Campus map' : 'Campuskaart'}
              >
                <CampusSearch
                  data={data}
                  locale={locale}
                  onSelect={select}
                  gems={gems}
                />
                {floor ? (
                  <>
                    <div className="map-toolbar">
                      <div className="building-buttons">
                        {data.buildings.map((b) => (
                          <button
                            key={b.id}
                            className={
                              b.id === floor.building_id ? 'active' : ''
                            }
                            aria-pressed={b.id === floor.building_id}
                            onClick={() =>
                              setFloor(
                                data.floors.find((f) => f.building_id === b.id)!
                                  .id,
                              )
                            }
                          >
                            {b.id}
                          </button>
                        ))}
                      </div>
                      <div className="floor-buttons">
                        <span className="floor-label">
                          {en ? 'Floor' : 'Verdieping'}
                        </span>
                        {data.floors
                          .filter((f) => f.building_id === floor.building_id)
                          .map((f) => (
                            <button
                              key={f.id}
                              aria-label={
                                (en ? 'Floor ' : 'Verdieping ') + f.level
                              }
                              aria-pressed={floor.id === f.id}
                              className={
                                (floor.id === f.id ? 'active ' : '') +
                                (route?.nodes.some((n) => n.floor_id === f.id)
                                  ? 'in-route'
                                  : '')
                              }
                              onClick={() => setFloor(f.id)}
                            >
                              {f.level}
                            </button>
                          ))}
                      </div>
                    </div>
                    {picking && (
                      <div className="notice">
                        {en
                          ? 'Select a marker as your starting point. You can also select it from the route list.'
                          : 'Kies een marker als startpunt. Je kunt ook de keuzelijst bij de route gebruiken.'}
                        <button
                          className="text-link"
                          onClick={() => setPicking(false)}
                        >
                          {en ? 'Cancel' : 'Annuleren'}
                        </button>
                      </div>
                    )}
                    <CampusMap
                      data={data}
                      floor={floor}
                      selected={selected}
                      from={routing||hasOrigin?from:''}
                      route={route}
                      onSelect={select}
                      locale={locale}
                    />
                  </>
                ) : (
                  <div className="empty-state">
                    {en
                      ? 'No map available for this floor.'
                      : 'Geen kaart beschikbaar voor deze verdieping.'}
                  </div>
                )}
              </section>
              <aside className="side-stack">
                {selected ? (
                  routing ? (
                    <RoutePanel
                      key={selected.id}
                      data={data}
                      to={selected}
                      locale={locale}
                      from={from}
                      setFrom={(id)=>{setFrom(id);setHasOrigin(true);setQrOrigin(false);}}
                      onRoute={setRoute}
                      onStop={() => {
                        setRouting(false);
                        setRoute(null);
                        setPicking(false);
                        const u=new URL(window.location.href);u.searchParams.delete('route');u.searchParams.delete('stage');window.history.replaceState(null,'',u);
                      }}
                      onFloor={setFloor}
                      onPick={() => setPicking(true)}
                    />
                  ) : (
                    <LocationPanel
                      location={selected}
                      data={data}
                      locale={locale}
                      onClose={() => {
                        setSelected(null);
                        const u = new URL(window.location.href);
                        u.searchParams.delete('to');
                        window.history.replaceState(null, '', u);
                      }}
                      onRoute={() => setRouting(true)}
                      onToast={setToast}
                    />
                  )
                ) : (
                  <section className="panel welcome-panel"><span className="badge">{en?'FIND YOUR WAY':'VIND JE WEG'}</span><h2>{en?'Your next stop.':'Je volgende bestemming.'}</h2><p>{en?'Enter a room code or choose a facility. We will show the building, floor and place on the map.':'Vul een lokaalcode in of kies een voorziening. Je ziet meteen het gebouw, de verdieping en de plek op de kaart.'}</p><div className="welcome-example"><span>F</span><span>3</span><span>025</span><small>{en?'Zone':'Zone'}</small><small>{en?'Floor':'Verdieping'}</small><small>{en?'Room':'Lokaal'}</small></div><Link className="text-link" href="/tips">{en?'Help with your first week':'Hulp bij je eerste week'} →</Link><Link className="text-link" href="/gems">{en?'Discover campus tips':'Ontdek campustips'} →</Link></section>
                )}
              </aside>
            </div>
          </>
        ) : view === 'gems' ? (
          <GemsPage
            data={data}
            locale={locale}
            connected={connected}
            gems={gems}
            setGems={setGems}
            slug={gemSlug}
            onToast={setToast}
          />
        ) : (
          <TipsPage data={data} locale={locale}/>
        )}
        <footer className="page-footer">
          <span>
            {brand.name} ·{' '}
            {en ? 'Independent campus concept' : 'Onafhankelijk campusconcept'}
          </span>
          <span>
            {en ? 'Sources checked' : 'Bronnen gecontroleerd'} 08.09.2026
          </span>
          <Link href="/admin">{en ? 'Administration' : 'Beheer'}</Link>
        </footer>
      </main>
      <nav
        className="bottom-nav"
        aria-label={en ? 'Mobile navigation' : 'Mobiele navigatie'}
      >
        {nav}
      </nav>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
