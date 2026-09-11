import { describe, it, expect } from 'vitest';
import {
  normalizeRoomCode,
  normalizeSearch,
  parseRoomCode,
} from '../lib/routing/normalization';
import { shortestPath, routeStages } from '../lib/routing/graph';
import { instructions } from '../lib/routing/instructions';
import { seed } from '../lib/campus/seed';
import { searchLocations } from '../lib/campus/search';
import { openingStatus } from '../lib/campus/hours';
import { gemSchema, imageType, adminSchemas } from '../lib/campus/validation';
describe('room codes', () => {
  it.each([
    'F3.025',
    'F3025',
    'f 3 025',
    ' f 3.025 ',
    'Ｆ３．０２５',
    'F3-025',
    'f3_025',
  ])('normalizes %s', (s) => expect(normalizeRoomCode(s)).toBe('F3025'));
  it.each(['0.25', '025', '0 25'])('normalizes R8 %s', (s) =>
    expect(normalizeRoomCode(s)).toBe('025'),
  );
  it('parses independent of buildings', () => {
    expect(parseRoomCode('F3.025')).toEqual({
      canonical: 'F3025',
      zone: 'F',
      floor: 3,
      room: '025',
    });
    expect(parseRoomCode('0.25')?.floor).toBe(0);
    expect(parseRoomCode('hello')).toBeNull();
    expect(parseRoomCode('')).toBeNull();
  });
});
describe('search', () => {
  it.each(['F3.025', 'F3025', 'f 3 025'])('finds %s', (q) =>
    expect(searchLocations(seed, q)[0].id).toBe('F3025'),
  );
  it.each(['bieb', 'library', 'biblioteek', 'bibliotheek'])(
    'library alias/typo %s',
    (q) =>
      expect(searchLocations(seed, q).some((l) => l.id === 'library')).toBe(
        true,
      ),
  );
  it('normalizes accents', () =>
    expect(normalizeSearch('Café IF')).toBe('cafeif'));
  it('empty and absent', () => {
    expect(searchLocations(seed, '')).toEqual([]);
    expect(searchLocations(seed, 'ZZZ9.999')).toEqual([]);
  });
});
describe('routing', () => {
  it('shortest path uses minimum weight and direction', () => {
    const nodes = seed.nodes.slice(0, 3),
      [a, b, c] = nodes.map((n) => n.id);
    const base = seed.edges[0];
    const edges = [
      {
        ...base,
        id: 'ac',
        from_node_id: a,
        to_node_id: c,
        weight: 100,
        bidirectional: false,
      },
      {
        ...base,
        id: 'ab',
        from_node_id: a,
        to_node_id: b,
        weight: 1,
        bidirectional: false,
      },
      {
        ...base,
        id: 'bc',
        from_node_id: b,
        to_node_id: c,
        weight: 1,
        bidirectional: false,
      },
    ];
    expect(shortestPath(nodes, edges, a, c)?.weight).toBe(2);
    expect(shortestPath(nodes, edges, c, a)).toBeNull();
  });
  it('routes between buildings and floors', () => {
    const r = shortestPath(seed.nodes, seed.edges, 'loc-library', 'loc-F3025')!;
    expect(r.nodes.at(-1)?.id).toBe('loc-F3025');
    expect(r.edges.some((e) => e.edge_type === 'outdoor')).toBe(true);
    expect(routeStages(r).length).toBeGreaterThan(2);
    expect(r.verified).toBe(false);
    expect(instructions(r, 'en').some((s) => s.includes('Outside'))).toBe(true);
    expect(instructions(r, 'nl').some((s) => s.includes('Buiten'))).toBe(true);
  });
  it('allows unknown step-free segments without claiming confirmation', () => {
    const route = shortestPath(
      seed.nodes,
      seed.edges,
      'R10-0-entry',
      'loc-F3025',
      true,
    );
    expect(route?.accessibility).toBe('partially_unknown');
    expect(route?.edges.some((edge) => edge.edge_type === 'stairs')).toBe(
      false,
    );
  });
  it('uses lifts and avoids all stairs for verified accessible graph', () => {
    const nodes = seed.nodes.map((n) => ({
        ...n,
        accessibility_status: 'verified' as const,
      })),
      edges = seed.edges.map((e) => ({
        ...e,
        accessibility_status: 'verified' as const,
      }));
    const r = shortestPath(nodes, edges, 'R10-0-entry', 'loc-F3025', true)!;
    expect(r.edges.some((e) => e.edge_type === 'elevator')).toBe(true);
    expect(r.edges.some((e) => e.edge_type === 'stairs')).toBe(false);
    expect(r.accessibility).toBe('confirmed');
  });
  it('disconnected graph and missing endpoints', () => {
    expect(shortestPath(seed.nodes, [], 'R8-0-entry', 'loc-F3025')).toBeNull();
    expect(shortestPath([], [], 'a', 'b')).toBeNull();
  });
  it('same location', () =>
    expect(
      shortestPath(seed.nodes, seed.edges, 'loc-library', 'loc-library')?.edges,
    ).toHaveLength(0));
  it('route edges remain inside the schematic corridors or at entrances', () => {
    for (const e of seed.edges.filter((e) => e.edge_type === 'corridor')) {
      const a = seed.nodes.find((n) => n.id === e.from_node_id)!,
        b = seed.nodes.find((n) => n.id === e.to_node_id)!;
      expect(a.floor_id).toBe(b.floor_id);
      expect(a.x === b.x || a.y === b.y).toBe(true);
      for (let t = 0; t <= 1; t += 0.1) {
        const x = a.x + (b.x - a.x) * t,
          y = a.y + (b.y - a.y) * t;
        const rooms = seed.floors
          .find((f) => f.id === a.floor_id)!
          .geometry.filter((s) => s.kind === 'room');
        expect(
          rooms.some(
            (s) =>
              x > s.x && x < s.x + s.width && y > s.y && y < s.y + s.height,
          ),
        ).toBe(false);
      }
    }
  });
});
describe('opening hours and Amsterdam DST', () => {
  const h = {
    ...seed.hours[2],
    verified_at: '2026-09-08',
    exceptions_reviewed_through: '2026-09-30',
  };
  it('does not claim open without reviewed exceptions', () =>
    expect(
      openingStatus(
        { ...seed.hours[2], exceptions_reviewed_through: null },
        new Date('2026-09-08T10:00:00Z'),
      ),
    ).toBeNull());
  it('uses Amsterdam time and close boundary', () => {
    expect(openingStatus(h, new Date('2026-09-08T14:59:00Z'), 'en')).toBe(
      'Open · closes at 17:00',
    );
    expect(openingStatus(h, new Date('2026-09-08T15:00:00Z'), 'en')).toBe(
      'Closed · opens tomorrow at 08:30',
    );
  });
  it('supports holiday closure and unknown day', () => {
    expect(
      openingStatus(
        { ...h, exceptions: { '2026-09-08': [] } },
        new Date('2026-09-08T10:00:00Z'),
      ),
    ).toBe('Gesloten · opent morgen om 08:30');
    expect(openingStatus(h, new Date('2026-09-12T10:00:00Z'))).toBe(
      'Gesloten · opent maandag 08:30',
    );
  });
  it('hides stale and unverified data', () => {
    expect(openingStatus(h, new Date('2026-12-10T10:00:00Z'))).toBeNull();
    expect(
      openingStatus(
        { ...h, verification_status: 'unverified' },
        new Date('2026-09-08T10:00:00Z'),
      ),
    ).toBeNull();
  });
  it('winter time', () =>
    expect(
      openingStatus(
        {
          ...h,
          verified_at: '2026-12-01',
          exceptions_reviewed_through: '2026-12-30',
        },
        new Date('2026-12-01T16:00:00Z'),
        'en',
      ),
    ).toBe('Closed · opens tomorrow at 08:30'));
});
describe('public input validation', () => {
  const g = {
    title: 'Een leuke plek',
    description: 'Een rustige plek om even te studeren.',
    category: 'study',
    location_id: 'library',
    website: '',
    started_at: Date.now(),
  };
  it('valid input', () => expect(gemSchema.safeParse(g).success).toBe(true));
  it('rejects escalation and honeypots', () => {
    expect(gemSchema.safeParse({ ...g, status: 'approved' }).success).toBe(
      false,
    );
    expect(gemSchema.safeParse({ ...g, website: 'spam' }).success).toBe(false);
    expect(gemSchema.safeParse({ ...g, title: 'x'.repeat(91) }).success).toBe(
      false,
    );
  });
  it('checks actual file signatures', () => {
    expect(
      imageType(new TextEncoder().encode('<svg onload="alert(1)">')),
    ).toBeNull();
    expect(
      imageType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])),
    ).toBe('image/png');
  });
  it('accepts a proposed place without a routing endpoint', () =>
    expect(
      gemSchema.safeParse({
        ...g,
        location_mode: 'proposed',
        location_id: '',
        proposed_location_name: 'Nieuwe studienis',
        proposed_location_context: 'r8',
        proposed_building_id: 'R8',
        proposed_location_description:
          'Naast de grote trap op de begane grond.',
      }).success,
    ).toBe(true));
  it('does not accept accessible stairs', () =>
    expect(
      adminSchemas.route_edges.safeParse({
        ...seed.edges[0],
        edge_type: 'stairs',
        accessible: true,
      }).success,
    ).toBe(false));
});
