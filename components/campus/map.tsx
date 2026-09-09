'use client';
import { UnifiedMap } from './unified-map';
import type { Floor } from '@/lib/campus/types';
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
export function CampusMap(props: Parameters<typeof UnifiedMap>[0]) {
  return <UnifiedMap {...props} />;
}
