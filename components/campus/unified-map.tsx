'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import { Plus, Minus, Maximize, Info, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { CampusData, Floor, Locale, Location } from '@/lib/campus/types';
import type { Route } from '@/lib/routing/graph';
import { createRouteExperience } from '@/lib/routing/experience';

function MapControls({
  en,
  selected,
  focusIds,
}: {
  en: boolean;
  selected?: string;
  focusIds: string[];
}) {
  const { zoomIn, zoomOut, resetTransform, zoomToElement } = useControls();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (focusIds.length)
        void zoomToElement(focusIds, {
          minScale: 1.15,
          maxScale: focusIds.length === 1 ? 2.2 : 1.85,
          animationTime: 350,
          offsetY: 8,
        });
      else if (selected)
        void zoomToElement('original-marker-' + selected, 2.2, 250);
    }, 40);
    return () => window.clearTimeout(timer);
  }, [focusIds, selected, zoomToElement]);
  return (
    <div className="map-controls">
      <button aria-label={en ? 'Zoom in' : 'Inzoomen'} onClick={() => zoomIn()}>
        <Plus />
      </button>
      <button
        aria-label={en ? 'Zoom out' : 'Uitzoomen'}
        onClick={() => zoomOut()}
      >
        <Minus />
      </button>
      <button
        aria-label={en ? 'Reset map' : 'Kaart herstellen'}
        onClick={() => resetTransform()}
      >
        <Maximize />
      </button>
    </div>
  );
}

export function MapInformation({
  data,
  locale,
}: {
  data: CampusData;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const en = locale === 'en';
  return (
    <>
      <button className="text-link map-info" onClick={() => setOpen(true)}>
        <Info size={15} />
        {en ? 'Map information' : 'Kaartinformatie'}{' '}
        <span className="badge">Beta</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>
            {en ? 'About this campus map' : 'Over deze campuskaart'}
          </DialogTitle>
          <DialogDescription>
            {en
              ? 'Original NHL Stenden floor plans with a searchable room index.'
              : 'Originele NHL Stenden-plattegronden met een doorzoekbare lokalenlijst.'}
          </DialogDescription>
          <p>
            {en
              ? 'Plans: NHL Stenden guide, pages 18–25, public copy hosted by ETEN (2024). The current edition is on the university intranet. Markers identify printed labels, not surveyed doors.'
              : 'Plattegronden: NHL Stenden-gids, pagina 18–25, openbare kopie bij ETEN (2024). De actuele editie staat op het hogeschoolintranet. Markers wijzen het gedrukte label aan, geen ingemeten deur.'}
          </p>
          <p>
            {en
              ? 'Routes use traced corridors from the published plans. Floor changes and the outdoor link are separate steps. Missing corridor geometry is never replaced with a straight line.'
              : 'Routes gebruiken overgenomen gangen uit de gepubliceerde plattegronden. Verdiepingwissels en de buitenverbinding zijn aparte stappen. Ontbrekende ganggeometrie wordt nooit vervangen door een rechte lijn.'}
          </p>
          <div className="source-list">
            {data.sources.map((source) => (
              <div key={source.id}>
                <a
                  className="text-link"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title} ↗
                </a>
                <small>
                  {en ? 'Checked' : 'Gecontroleerd'}: {source.verified_at} ·{' '}
                  {source.verification_status === 'verified'
                    ? en
                      ? 'Source checked'
                      : 'Bron gecontroleerd'
                    : en
                      ? 'Needs review'
                      : 'Controle nodig'}
                </small>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const markerLabel = (
  kind: 'start' | 'destination' | 'continue' | 'transition',
  locale: Locale,
) =>
  kind === 'destination'
    ? locale === 'nl'
      ? 'BESTEMMING'
      : 'DESTINATION'
    : kind === 'transition'
      ? locale === 'nl'
        ? 'VOLGENDE STAP'
        : 'NEXT STEP'
      : kind === 'continue'
        ? locale === 'nl'
          ? 'VERDER'
          : 'CONTINUE'
        : 'START';

export function UnifiedMap({
  floor,
  locale,
  selected,
  data,
  onSelect,
  route = null,
  from = '',
  origin = null,
  activeStage = 0,
}: {
  floor: Floor;
  locale: Locale;
  selected: Location | null;
  data: CampusData;
  onSelect: (location: Location) => void;
  route?: Route | null;
  from?: string;
  origin?: Location | null;
  activeStage?: number;
}) {
  const en = locale === 'en';
  const available =
    ['R8', 'R10'].includes(floor.building_id) &&
    floor.level >= 0 &&
    floor.level <= 3;
  const [rooms, setRooms] = useState(false);
  const experience = useMemo(
    () =>
      route && origin && selected
        ? createRouteExperience(route, data, origin, selected, locale)
        : null,
    [route, origin, selected, data, locale],
  );
  const leg =
    experience?.legs[Math.min(activeStage, experience.legs.length - 1)];
  const routeActive = Boolean(route && leg?.floorId === floor.id);
  const places = data.locations.filter(
    (location) =>
      location.floor_id === floor.id &&
      location.map_x != null &&
      location.map_y != null &&
      !routeActive &&
      (location.category_id !== 'room' ||
        rooms ||
        selected?.id === location.id),
  );
  const start = data.nodes.find(
    (node) => node.id === from && node.floor_id === floor.id,
  );
  const firstNode = leg?.nodes[0];
  const lastNode = leg?.nodes.at(-1);
  const destinationOnFloor =
    routeActive &&
    leg?.index === experience!.legs.length - 1 &&
    selected?.floor_id === floor.id
      ? selected
      : null;
  const arrowId = `route-arrow-${floor.id.replace(/[^a-z0-9]/gi, '-')}`;
  const focusPoints = routeActive
    ? [
        ...(leg?.mapSegments.flatMap((segment) => segment.points) ?? []),
        ...(firstNode?.map_x != null && firstNode.map_y != null
          ? [[firstNode.map_x, firstNode.map_y] as [number, number]]
          : []),
        ...(leg?.index === 0 && origin?.map_x != null && origin.map_y != null
          ? [[origin.map_x, origin.map_y] as [number, number]]
          : []),
        ...(destinationOnFloor?.map_x != null &&
        destinationOnFloor.map_y != null
          ? [
              [destinationOnFloor.map_x, destinationOnFloor.map_y] as [
                number,
                number,
              ],
            ]
          : []),
      ]
    : [];
  const focusIds = focusPoints.map(
    (_, index) => `route-focus-${floor.id}-${activeStage}-${index}`,
  );

  if (!available)
    return (
      <p className="notice">
        {en
          ? 'No published floor plan available.'
          : 'Geen gepubliceerde plattegrond beschikbaar.'}
      </p>
    );

  return (
    <section
      className={'official-map' + (routeActive ? ' route-map-active' : '')}
      aria-label={en ? 'NHL Stenden floor plan' : 'Plattegrond NHL Stenden'}
    >
      <div className="official-map-heading">
        <strong>
          {floor.building_id} ·{' '}
          {floor.level === 0
            ? en
              ? 'Ground floor'
              : 'Begane grond'
            : (en ? 'Floor ' : 'Verdieping ') + floor.level}
        </strong>
        {routeActive ? (
          <span className="route-floor-status">
            {en ? 'Route segment' : 'Routedeel'} {leg!.index + 1}/
            {experience!.legs.length}
          </span>
        ) : (
          <button
            className="text-link"
            aria-pressed={rooms}
            onClick={() => setRooms(!rooms)}
          >
            {rooms
              ? en
                ? 'Hide room markers'
                : 'Lokaalmarkers verbergen'
              : en
                ? 'Show room markers'
                : 'Lokaalmarkers tonen'}
          </button>
        )}
      </div>
      <div className="map-canvas official-canvas">
        <TransformWrapper
          key={floor.id}
          minScale={0.7}
          maxScale={8}
          initialScale={1}
          centerOnInit
          limitToBounds={false}
          panning={{ excluded: ['button'] }}
        >
          <TransformComponent
            wrapperClass="map-transform"
            contentClass="official-map-content"
          >
            <div className="original-page">
              <Image
                src={
                  '/maps/' +
                  floor.building_id.toLowerCase() +
                  '-' +
                  floor.level +
                  '.webp'
                }
                width={1489}
                height={1489}
                unoptimized
                priority
                alt={`${en ? 'NHL Stenden floor plan' : 'NHL Stenden-plattegrond'}, ${floor.building_id}, ${en ? 'floor' : 'verdieping'} ${floor.level}`}
                draggable={false}
              />
              {routeActive && (
                <svg
                  className="original-route-overlay"
                  viewBox="0 0 100 100"
                  aria-label={
                    en ? 'Route on this floor' : 'Route op deze verdieping'
                  }
                >
                  <defs>
                    <marker
                      id={arrowId}
                      markerWidth="4"
                      markerHeight="4"
                      refX="3"
                      refY="2"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,4 L4,2 z" className="route-arrow" />
                    </marker>
                  </defs>
                  {leg!.mapSegments.map((segment) => {
                    const points = segment.points
                      .map((point) => point.join(','))
                      .join(' ');
                    return (
                      <g key={segment.edgeId}>
                        <polyline
                          points={points}
                          className="route-path-casing"
                        />
                        <polyline
                          points={points}
                          className="route-path-active"
                          markerEnd={`url(#${arrowId})`}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
              {places.map((location) => (
                <button
                  key={location.id}
                  id={'original-marker-' + location.id}
                  className={`official-hotspot ${selected?.id === location.id ? 'selected ' : ''}${location.category_id === 'room' ? 'room-pin' : ''}`}
                  style={{
                    left: location.map_x + '%',
                    top: location.map_y + '%',
                  }}
                  aria-label={
                    (en ? 'Select ' : 'Selecteer ') + location.name[locale]
                  }
                  aria-pressed={selected?.id === location.id}
                  title={location.name[locale]}
                  onClick={() => onSelect(location)}
                >
                  {selected?.id === location.id ? (
                    <MapPin size={20} />
                  ) : location.category_id === 'room' ? (
                    '·'
                  ) : (
                    'i'
                  )}
                  {selected?.id === location.id && (
                    <span className="selected-map-label">
                      {location.room_code || location.name[locale]}
                    </span>
                  )}
                </button>
              ))}
              {routeActive &&
                focusPoints.map(([x, y], index) => (
                  <i
                    key={focusIds[index]}
                    id={focusIds[index]}
                    className="route-focus-point"
                    style={{ left: x + '%', top: y + '%' }}
                  />
                ))}
              {routeActive &&
                leg!.index === 0 &&
                origin?.map_x != null &&
                origin.map_y != null && (
                  <div
                    className="route-map-marker route-start"
                    style={{
                      left: origin.map_x + '%',
                      top: origin.map_y + '%',
                    }}
                    aria-label={`START · ${origin.room_code || origin.name[locale]}`}
                  >
                    <span>S</span>
                    <b>START · {origin.room_code || origin.name[locale]}</b>
                  </div>
                )}
              {routeActive &&
                leg!.index > 0 &&
                firstNode?.map_x != null &&
                firstNode.map_y != null && (
                  <div
                    className="route-map-marker route-continue"
                    style={{
                      left: firstNode.map_x + '%',
                      top: firstNode.map_y + '%',
                    }}
                    aria-label={markerLabel('continue', locale)}
                  >
                    <span>→</span>
                    <b>{markerLabel('continue', locale)}</b>
                  </div>
                )}
              {routeActive &&
                leg!.index === 0 &&
                (experience?.originGap ?? 0) > 1.5 &&
                firstNode?.map_x != null &&
                firstNode.map_y != null && (
                  <div
                    className="route-corridor-start"
                    style={{
                      left: firstNode.map_x + '%',
                      top: firstNode.map_y + '%',
                    }}
                    aria-label={
                      en
                        ? 'Route starts in corridor'
                        : 'Route begint in de gang'
                    }
                  >
                    <span />
                    ROUTE
                  </div>
                )}
              {routeActive &&
                leg!.outgoingTransition &&
                lastNode?.map_x != null &&
                lastNode.map_y != null && (
                  <div
                    className="route-map-marker route-transition"
                    style={{
                      left: lastNode.map_x + '%',
                      top: lastNode.map_y + '%',
                    }}
                    aria-label={markerLabel('transition', locale)}
                  >
                    <span>↗</span>
                    <b>{markerLabel('transition', locale)}</b>
                  </div>
                )}
              {destinationOnFloor?.map_x != null &&
                destinationOnFloor.map_y != null && (
                  <div
                    className="route-map-marker route-destination"
                    style={{
                      left: destinationOnFloor.map_x + '%',
                      top: destinationOnFloor.map_y + '%',
                    }}
                    aria-label={`${markerLabel('destination', locale)} · ${destinationOnFloor.room_code || destinationOnFloor.name[locale]}`}
                  >
                    <span>B</span>
                    <b>
                      {markerLabel('destination', locale)} ·{' '}
                      {destinationOnFloor.room_code ||
                        destinationOnFloor.name[locale]}
                    </b>
                  </div>
                )}
              {!routeActive && start?.map_x != null && start.map_y != null && (
                <div
                  className="origin-pin"
                  style={{ left: start.map_x + '%', top: start.map_y + '%' }}
                  aria-label={en ? 'Starting point' : 'Startpunt'}
                >
                  <span>S</span>
                </div>
              )}
            </div>
          </TransformComponent>
          <MapControls
            en={en}
            selected={
              !routeActive && selected?.floor_id === floor.id
                ? selected.id
                : undefined
            }
            focusIds={focusIds}
          />
        </TransformWrapper>
      </div>
      <div className="map-caption">
        <span>
          {routeActive && origin && selected ? (
            <>
              <b>START</b> {origin.room_code || origin.name[locale]} →{' '}
              <b>{en ? 'DESTINATION' : 'BESTEMMING'}</b>{' '}
              {selected.room_code || selected.name[locale]}
            </>
          ) : (
            <>
              <MapPin size={14} />
              {selected?.floor_id === floor.id
                ? selected.name[locale]
                : en
                  ? 'Tap a place for more information'
                  : 'Tik op een plek voor meer informatie'}
            </>
          )}
        </span>
        <MapInformation data={data} locale={locale} />
      </div>
    </section>
  );
}
