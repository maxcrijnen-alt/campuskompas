'use client';
import { useMemo, useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Accessibility,
  Navigation,
  ArrowUpDown,
  Clock3,
  Flag,
  Footprints,
  MapPin,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { CampusData, Locale, Location } from '@/lib/campus/types';
import { shortestPath, type Route } from '@/lib/routing/graph';
import { createRouteEndpointResolver } from '@/lib/routing/endpoints';
import {
  createRouteExperience,
  routingDebugEnabled,
} from '@/lib/routing/experience';
import { resolveLocationReference } from '@/lib/campus/search';
import { CampusSearch } from './search';
import { Feedback } from './community';
import { track } from '@/lib/campus/analytics';
const param = (key: string) =>
  typeof window === 'undefined'
    ? null
    : new URLSearchParams(window.location.search).get(key);
export function RoutePanel({
  data,
  to,
  locale,
  from,
  setFrom,
  onRoute,
  onStage,
  onStop,
  onFloor,
  onPick,
  onSwap,
}: {
  data: CampusData;
  to: Location;
  locale: Locale;
  from: string;
  setFrom: (id: string) => void;
  onRoute: (r: Route | null) => void;
  onStage: (stage: number) => void;
  onStop: () => void;
  onFloor: (id: string) => void;
  onPick: () => void;
  onSwap: (origin: Location) => void;
}) {
  const en = locale === 'en',
    [accessible, setAccessible] = useState(() => param('accessible') === '1'),
    [attempted, setAttempted] = useState(
      () => !!from && !!param('from') && !!param('to'),
    ),
    [stage, setStage] = useState(() =>
      Math.max(0, Number(param('stage')) || 0),
    ),
    [finished, setFinished] = useState(false);
  const resolver = useMemo(() => createRouteEndpointResolver(data), [data]);
  const originEndpoint = useMemo(
    () => resolver.resolveReference(from),
    [resolver, from],
  );
  const destinationEndpoint = useMemo(
    () => resolver.resolveLocation(to),
    [resolver, to],
  );
  const originLocation = useMemo(() => {
    const resolved = resolveLocationReference(data, from).location;
    if (resolved) return resolved;
    const matches = data.locations.filter(
      (location) => location.node_id === originEndpoint.nodeId,
    );
    return matches.length === 1 ? matches[0] : null;
  }, [data, from, originEndpoint.nodeId]);
  const candidateRoute = useMemo(
    () =>
      originEndpoint.nodeId && destinationEndpoint.nodeId
        ? shortestPath(
            data.nodes,
            data.edges,
            originEndpoint.nodeId,
            destinationEndpoint.nodeId,
            accessible,
          )
        : null,
    [data, originEndpoint.nodeId, destinationEndpoint.nodeId, accessible],
  );
  const experience = useMemo(
      () =>
        candidateRoute && originLocation
          ? createRouteExperience(
              candidateRoute,
              data,
              originLocation,
              to,
              locale,
            )
          : null,
      [candidateRoute, originLocation, data, to, locale],
    ),
    active = attempted && experience?.visuallyComplete ? candidateRoute : null,
    stages = experience?.legs ?? [],
    current = Math.min(stage, Math.max(0, stages.length - 1)),
    currentStage = stages[current];
  useEffect(() => {
    onRoute(active);
    onStage(current);
    if (active && currentStage) onFloor(currentStage.floorId);
  }, [active, current, currentStage, onRoute, onStage, onFloor]);
  function updateUrl(nextStage = 0, start = true) {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('from');
    const qr = raw?.startsWith('qr:')
      ? data.qr.find((q) => q.code === raw.slice(3))
      : null;
    url.searchParams.set(
      'from',
      qr?.route_node_id === originEndpoint.nodeId ? raw! : from,
    );
    url.searchParams.set('to', to.id);
    url.searchParams.set('accessible', accessible ? '1' : '0');
    url.searchParams.set('stage', String(nextStage));
    if (start) url.searchParams.set('route', 'active');
    window.history.replaceState(null, '', url);
  }
  function start() {
    setAttempted(true);
    setStage(0);
    setFinished(false);
    updateUrl();
    track(accessible ? 'accessible_route_start' : 'route_start', {
      location_id: to.id,
    });
    if (!candidateRoute || !experience?.visuallyComplete)
      track('route_unavailable', {
        location_id: to.id,
        reason: candidateRoute ? 'missing_map_geometry' : 'no_graph_route',
      });
  }
  function choose(id: string) {
    setFrom(id);
    setAttempted(false);
    setFinished(false);
    setStage(0);
  }
  const debugEnabled = routingDebugEnabled(
    process.env.NODE_ENV,
    typeof window === 'undefined' ? '' : window.location.search,
  );
  const floorLabel = (level: number) =>
    level === 0
      ? en
        ? 'Ground floor'
        : 'Begane grond'
      : (en ? 'Floor ' : 'Verdieping ') + level;
  return (
    <section
      className="panel route-panel"
      aria-label={en ? 'Your route' : 'Jouw route'}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="panel-heading">
        <span className="badge">{en ? 'Your route' : 'Jouw route'}</span>
        <button
          className="icon-button"
          aria-label={en ? 'Close route' : 'Route sluiten'}
          onClick={onStop}
        >
          <X size={20} />
        </button>
      </div>
      <h2>
        {en ? 'To ' : 'Naar '}
        {to.room_code || to.name[locale]}
      </h2>
      <p className="location-meta">
        {to.building_id} ·{' '}
        {floorLabel(data.floors.find((f) => f.id === to.floor_id)?.level ?? 0)}
      </p>
      {!attempted && !finished && (
        <>
          <h3>{en ? 'Where are you now?' : 'Waar ben je nu?'}</h3>
          <div className="entrance-choices">
            {['R8', 'R10'].map((b) => {
              const loc = data.locations.find((l) => l.id === b + '_MAIN');
              return (
                loc &&
                resolver.resolveLocation(loc).nodeId && (
                  <button
                    key={b}
                    className="secondary-button"
                    aria-pressed={from === loc.id}
                    onClick={() => choose(loc.id)}
                  >
                    {en ? b + ' main entrance' : 'Hoofdingang ' + b}
                  </button>
                )
              );
            })}
          </div>
          <CampusSearch
            key={`${originLocation?.id ?? 'none'}-${locale}`}
            data={data}
            locale={locale}
            compact
            selected={originLocation}
            inputLabel={en ? 'Search current location' : 'Zoek huidige locatie'}
            placeholder={
              en ? 'Room, iShop, library...' : 'Lokaal, iShop, bibliotheek...'
            }
            onSelect={(location) => choose(location.id)}
          />
          <button
            className="secondary-button route-swap"
            disabled={!originLocation}
            onClick={() => originLocation && onSwap(originLocation)}
          >
            <ArrowUpDown size={17} />
            {en ? 'Swap start and destination' : 'Wissel start en bestemming'}
          </button>
          <button className="text-link" onClick={onPick}>
            {en ? 'Choose starting point on map' : 'Kies startpunt op kaart'} →
          </button>
          <small className="form-note">
            {en
              ? 'Scan a CampusKompas QR code on campus to use that starting point.'
              : 'Scan een CampusKompas-QR op de campus om dat startpunt te gebruiken.'}
          </small>
        </>
      )}
      {!attempted && !finished && (
        <label className="toggle-line accessible-control">
          <Switch
            aria-label={en ? 'Accessible route' : 'Toegankelijke route'}
            checked={accessible}
            onCheckedChange={(v) => {
              setAccessible(v);
              setAttempted(false);
              onRoute(null);
              const url = new URL(window.location.href);
              url.searchParams.set('accessible', v ? '1' : '0');
              url.searchParams.delete('route');
              window.history.replaceState(null, '', url);
            }}
          />
          <Accessibility size={20} />
          <span>
            {en ? 'Accessible route' : 'Toegankelijke route'}
            <small>
              {en
                ? 'Avoids stairs; unverified sections are clearly marked'
                : 'Vermijdt trappen; onbevestigde delen worden duidelijk gemeld'}
            </small>
          </span>
        </label>
      )}
      {!attempted && !finished && (
        <button className="primary-button" disabled={!from} onClick={start}>
          <Navigation size={18} />
          {en ? 'Show route' : 'Toon route'}
        </button>
      )}
      {attempted && !active && !finished && (
        <div className="route-unavailable" role="status">
          <strong>
            {accessible
              ? en
                ? 'No step-free candidate route is available.'
                : 'Geen mogelijke trapvrije route beschikbaar.'
              : en
                ? 'We cannot make a reliable route for this combination yet.'
                : 'Voor deze combinatie kunnen we nog geen betrouwbare route maken.'}
          </strong>
          <p>
            {accessible
              ? en
                ? 'The current graph cannot provide a route without stairs or confirmed barriers. Ask reception for help.'
                : 'De huidige kaart kan geen route zonder trappen of bevestigde barrières maken. Vraag de receptie om hulp.'
              : candidateRoute && !experience?.visuallyComplete
                ? en
                  ? 'A technical path exists, but part of its corridor geometry is missing. We do not draw a shortcut through the building.'
                  : 'Er bestaat technisch een pad, maar een deel van de ganggeometrie ontbreekt. We tekenen geen afsnijding door het gebouw.'
                : en
                  ? 'Choose another starting point or ask reception.'
                  : 'Kies een ander startpunt of vraag de receptie.'}
          </p>
          <div className="no-route-actions">
            <button className="secondary-button" onClick={onStop}>
              {en ? 'View destination' : 'Bekijk bestemming'}
            </button>
            <button
              className="secondary-button"
              onClick={() => setAttempted(false)}
            >
              {en ? 'Choose another start' : 'Kies ander startpunt'}
            </button>
          </div>
          <Feedback locale={locale} context="route" entityId={to.id} />
        </div>
      )}
      {active && !finished && (
        <>
          <div
            className="route-summary"
            aria-label={en ? 'Route overview' : 'Routeoverzicht'}
          >
            <div className="route-endpoints">
              <span className="route-endpoint route-endpoint-start">
                <MapPin size={16} />
                <small>START</small>
                <b>
                  {originLocation?.room_code || originLocation?.name[locale]}
                </b>
              </span>
              <span className="route-endpoint-arrow" aria-hidden="true">
                →
              </span>
              <span className="route-endpoint route-endpoint-destination">
                <Flag size={16} />
                <small>{en ? 'DESTINATION' : 'BESTEMMING'}</small>
                <b>{to.room_code || to.name[locale]}</b>
              </span>
            </div>
            <span className="route-time">
              <Clock3 size={17} />± {experience!.walkingMinutes}{' '}
              {en ? 'min walk' : 'min lopen'}
            </span>
          </div>
          {!active.verified && (
            <p className="route-beta">
              {en
                ? 'Plan-based preview · campus check still needed'
                : 'Kaartindicatie · controle op campus nog nodig'}
            </p>
          )}
          {accessible && (
            <p className={active.accessibility === 'confirmed' ? 'route-accessibility-confirmed' : 'route-accessibility-warning'} role="status">
              {active.accessibility === 'confirmed'
                ? en
                  ? 'This route is confirmed accessible.'
                  : 'Deze route is bevestigd toegankelijk.'
                : en
                  ? 'This route avoids stairs, but accessibility of some sections has not yet been verified.'
                  : 'Deze route vermijdt trappen, maar de toegankelijkheid van delen is nog niet geverifieerd.'}
            </p>
          )}
          <div className="next-step">
            <span className="eyebrow">
              {en ? 'NOW ON THE MAP' : 'NU OP DE KAART'}
            </span>
            <h3>
              {currentStage?.buildingId} ·{' '}
              {floorLabel(currentStage?.level ?? 0)}
            </h3>
            <ol className="active-instructions">
              {currentStage?.instructions.map((instruction, index) => (
                <li key={instruction}>
                  <span>{index + 1}</span>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
          <div className="stage-control route-stage-control">
            <button
              aria-label={en ? 'Previous route stage' : 'Vorige routefase'}
              disabled={current === 0}
              onClick={() => {
                setStage(current - 1);
                updateUrl(current - 1);
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {en ? 'Part ' : 'Deel '}
              {current + 1} {en ? 'of' : 'van'} {stages.length}
            </span>
            <button
              aria-label={en ? 'Next route stage' : 'Volgende routefase'}
              disabled={current === stages.length - 1}
              onClick={() => {
                setStage(current + 1);
                updateUrl(current + 1);
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <progress
            value={current + 1}
            max={stages.length}
            aria-label={en ? 'Route progress' : 'Routevoortgang'}
          />
          <div className="route-overview">
            <strong>
              <Footprints size={16} />
              {en ? 'Whole route' : 'Hele route'}
            </strong>
            <ol className="route-overview-list">
              {experience!.overview.map((item, index) => (
                <li
                  key={`${item.kind}-${item.legIndex}-${index}`}
                  className={`overview-${item.kind}`}
                >
                  {item.kind === 'floor' ? (
                    <button
                      aria-current={
                        current === item.legIndex ? 'step' : undefined
                      }
                      onClick={() => {
                        setStage(item.legIndex);
                        updateUrl(item.legIndex);
                      }}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
          {debugEnabled && (
            <details className="routing-debug" open>
              <summary>Routing debug</summary>
              <dl>
                <div>
                  <dt>From</dt>
                  <dd>
                    {originEndpoint.locationId ?? from} →{' '}
                    {originEndpoint.nodeId}
                  </dd>
                </div>
                <div>
                  <dt>To</dt>
                  <dd>
                    {destinationEndpoint.locationId} →{' '}
                    {destinationEndpoint.nodeId}
                  </dd>
                </div>
                <div>
                  <dt>Resolution</dt>
                  <dd>
                    {originEndpoint.resolutionType} /{' '}
                    {destinationEndpoint.resolutionType}
                  </dd>
                </div>
                <div>
                  <dt>Component</dt>
                  <dd>
                    {originEndpoint.nodeId
                      ? resolver.graph.componentByNode.get(
                          originEndpoint.nodeId,
                        )
                      : 'none'}
                  </dd>
                </div>
              </dl>
              <pre>
                {JSON.stringify(
                  {
                    stage: current,
                    floor: currentStage?.floorId,
                    routeNodes: active.nodes.map((node) => node.id),
                    edgeTypes: active.edges.map((edge) => edge.edge_type),
                    visibleEdgeIds: currentStage?.mapSegments.map(
                      (segment) => segment.edgeId,
                    ),
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          )}
          <button
            className="secondary-button route-finish"
            onClick={() => {
              setFinished(true);
              onRoute(null);
              track('route_complete', { location_id: to.id });
              const url = new URL(window.location.href);
              url.searchParams.delete('route');
              url.searchParams.delete('from');
              url.searchParams.delete('stage');
              window.history.replaceState(null, '', url);
            }}
          >
            {en ? 'Finish route' : 'Route afronden'}
          </button>
          <button
            className="text-link"
            onClick={() => {
              setAttempted(false);
              onRoute(null);
            }}
          >
            {en ? 'Change starting point' : 'Startpunt wijzigen'}
          </button>
        </>
      )}
      {finished && (
        <>
          <h3>{en ? 'Route finished' : 'Route afgerond'}</h3>
          <Feedback locale={locale} context="route" entityId={to.id} />
          <button className="secondary-button" onClick={onStop}>
            {en ? 'View location' : 'Bekijk locatie'}
          </button>
        </>
      )}
    </section>
  );
}
