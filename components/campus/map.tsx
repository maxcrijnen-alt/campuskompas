'use client';
import { useEffect } from 'react';
import { UnifiedMap } from './unified-map';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import { Plus, Minus, Maximize, Navigation } from 'lucide-react';
import type { CampusData, Floor, Locale, Location } from '@/lib/campus/types';
import type { Route } from '@/lib/routing/graph';
function Controls({
  locale,
  selected,
}: {
  locale: Locale;
  selected: Location | null;
}) {
  const { zoomIn, zoomOut, resetTransform, zoomToElement } = useControls();
  useEffect(() => {
    if (selected) void zoomToElement('marker-' + selected.id, 1.2, 200);
  }, [selected, zoomToElement]);
  return (
    <div className="map-controls">
      <button
        aria-label={locale === 'nl' ? 'Inzoomen' : 'Zoom in'}
        onClick={() => zoomIn()}
      >
        <Plus />
      </button>
      <button
        aria-label={locale === 'nl' ? 'Uitzoomen' : 'Zoom out'}
        onClick={() => zoomOut()}
      >
        <Minus />
      </button>
      <button
        aria-label={locale === 'nl' ? 'Kaart herstellen' : 'Reset map'}
        onClick={() => resetTransform()}
      >
        <Maximize />
      </button>
    </div>
  );
}
export function FloorLayer({ floor }: { floor: Floor }) {
  return (
    <g>
      {floor.geometry.map((s, i) => (
        <g key={i}>
          <rect
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            rx={s.kind === 'hall' ? 8 : 3}
            className={'map-shape ' + s.kind}
          />
          {s.label && (
            <text
              x={s.x + s.width / 2}
              y={s.y + s.height / 2}
              textAnchor="middle"
            >
              {s.label}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}
export function RouteLayer({
  route,
  floor,
}: {
  route: Route | null;
  floor: Floor;
}) {
  return (
    route && (
      <g>
        {route.edges.map((e, i) => {
          const a = route.nodes[i],
            b = route.nodes[i + 1];
          return a.floor_id === floor.id && b.floor_id === floor.id ? (
            <path
              key={e.id}
              d={`M${a.x},${a.y} L${b.x},${b.y}`}
              fill="none"
              stroke="#176748"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={route.verified ? undefined : '12 8'}
            />
          ) : null;
        })}
      </g>
    )
  );
}
export function MarkerLayer({
  locations,
  selected,
  onSelect,
  locale,
}: {
  locations: Location[];
  selected: Location | null;
  onSelect: (l: Location) => void;
  locale: Locale;
}) {
  return (
    <g>
      {locations.map((l) => (
        <g
          key={l.id}
          id={'marker-' + l.id}
          role="button"
          tabIndex={0}
          aria-label={l.name[locale]}
          className={'map-marker ' + (selected?.id === l.id ? 'selected' : '')}
          onClick={() => onSelect(l)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(l);
            }
          }}
        >
          <circle cx={l.x} cy={l.y} r={selected?.id === l.id ? 24 : 21} />
          <text
            x={l.x}
            y={l.y + 6}
            textAnchor="middle"
            className="marker-symbol"
          >
            {l.category_id === 'coffee' || l.category_id === 'cafe'
              ? 'C'
              : l.category_id === 'library'
                ? 'B'
                : l.category_id === 'entrance'
                  ? '↗'
                  : l.category_id === 'room'
                    ? 'F'
                    : '•'}
          </text>
          <text
            x={l.x}
            y={l.y + (l.y < 280 ? -32 : 43)}
            textAnchor="middle"
            className="marker-label"
          >
            {l.name[locale]}
          </text>
        </g>
      ))}
    </g>
  );
}
function SchematicMap({
  data,
  floor,
  selected,
  route,
  from,
  onSelect,
  locale,
}: {
  data: CampusData;
  floor: Floor;
  selected: Location | null;
  route: Route | null;
  from: string;
  onSelect: (l: Location) => void;
  locale: Locale;
}) {
  const start = data.nodes.find(
    (n) => n.id === from && n.floor_id === floor.id,
  );
  return (
    <div className="map-canvas">
      <div className="map-caption">
        <span className="live-dot" />
        {floor.building_id}
        <span>/</span>
        {floor.level === 0
          ? locale === 'nl'
            ? 'Begane grond'
            : 'Ground floor'
          : (locale === 'nl' ? 'Verdieping ' : 'Floor ') + floor.level}
      </div>
      <div className="north">
        <Navigation size={20} />
        <small>N</small>
      </div>
      <TransformWrapper
        minScale={0.65}
        maxScale={4}
        centerOnInit
        limitToBounds={false}
        doubleClick={{ disabled: true }}
      >
        <TransformComponent
          wrapperClass="map-transform"
          contentClass="map-content"
        >
          <svg
            viewBox="0 0 800 600"
            width="800"
            height="600"
            role="group"
            aria-label={
              locale === 'nl'
                ? 'Schematische campuskaart'
                : 'Schematic campus map'
            }
          >
            <FloorLayer floor={floor} />
            <text x="375" y="70" textAnchor="middle" className="building-label">
              RENGERSLAAN {floor.building_id.slice(1)}
            </text>
            <text x="375" y="296" textAnchor="middle" className="hall-label">
              {locale === 'nl' ? 'CENTRALE VERBINDING' : 'CENTRAL CONNECTION'}
            </text>
            <RouteLayer route={route} floor={floor} />
            <MarkerLayer
              locations={data.locations.filter((l) => l.floor_id === floor.id)}
              selected={selected}
              onSelect={onSelect}
              locale={locale}
            />
            {start && (
              <g>
                <circle
                  cx={start.x}
                  cy={start.y}
                  r="11"
                  fill="#3159d1"
                  stroke="white"
                  strokeWidth="4"
                />
                <text x={start.x + 18} y={start.y + 5} className="you-label">
                  {locale === 'nl' ? 'Je bent hier' : 'You are here'}
                </text>
              </g>
            )}
          </svg>
        </TransformComponent>
        <Controls
          locale={locale}
          selected={selected?.floor_id === floor.id ? selected : null}
        />
      </TransformWrapper>
      <div className="map-legend">
        <span>
          <i className="legend-location" />
          {locale === 'nl' ? 'Voorziening' : 'Facility'}
        </span>
        <span>
          <i className="legend-route" />
          {locale === 'nl' ? 'Routevoorbeeld' : 'Route preview'}
        </span>
      </div>
      <div className="schematic-label">
        {locale === 'nl'
          ? 'Schematisch · niet op schaal'
          : 'Schematic · not to scale'}
      </div>
    </div>
  );
}
export function CampusMap(props: Parameters<typeof SchematicMap>[0]) {
  return <UnifiedMap {...props}/>;
}
