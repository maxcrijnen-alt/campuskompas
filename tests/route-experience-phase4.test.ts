import { describe, expect, it } from 'vitest';
import type {
  CampusData,
  Location,
  RouteEdge,
  RouteNode,
} from '../lib/campus/types';
import { seed } from '../lib/campus/seed';
import { shortestPath } from '../lib/routing/graph';
import {
  createRouteExperience,
  estimateWalkingMinutes,
  routingDebugEnabled,
} from '../lib/routing/experience';

const node = (
  id: string,
  buildingId: string,
  floorId: string,
  mapX: number,
  mapY: number,
): RouteNode => ({
  id,
  building_id: buildingId,
  floor_id: floorId,
  x: mapX * 8,
  y: mapY * 6,
  map_x: mapX,
  map_y: mapY,
  node_type: 'corridor',
  label: { nl: 'Gang', en: 'Corridor' },
  accessible: false,
  accessibility_status: 'unverified',
  verification_status: 'needs_review',
});

const edge = (
  id: string,
  from: RouteNode,
  to: RouteNode,
  type: RouteEdge['edge_type'] = 'corridor',
  withPath = type === 'corridor',
  weight = 100,
): RouteEdge => ({
  id,
  from_node_id: from.id,
  to_node_id: to.id,
  weight,
  edge_type: type,
  accessible: false,
  accessibility_status: 'unverified',
  verification_status: 'needs_review',
  bidirectional: true,
  map_path: withPath
    ? [
        [from.map_x!, from.map_y!],
        [to.map_x!, to.map_y!],
      ]
    : null,
});

const location = (
  id: string,
  roomCode: string,
  routeNode: RouteNode,
): Location => ({
  ...seed.locations[0],
  id,
  name: { nl: roomCode, en: roomCode },
  room_code: roomCode,
  building_id: routeNode.building_id,
  floor_id: routeNode.floor_id,
  node_id: routeNode.id,
  map_x: routeNode.map_x,
  map_y: routeNode.map_y,
});

const campus = (
  nodes: RouteNode[],
  edges: RouteEdge[],
  locations: Location[],
): CampusData => ({
  ...seed,
  nodes,
  edges,
  locations,
});

describe('Phase 4 route experience', () => {
  it('keeps a same-floor route simple and tied to one visible map segment', () => {
    const start = node('a', 'R8', 'R8-0', 10, 40);
    const finish = node('b', 'R8', 'R8-0', 25, 40);
    const from = location('from', '0.01', start);
    const to = location('to', '0.02', finish);
    const data = campus(
      [start, finish],
      [edge('ab', start, finish)],
      [from, to],
    );
    const route = shortestPath(data.nodes, data.edges, start.id, finish.id)!;
    const experience = createRouteExperience(route, data, from, to, 'nl');

    expect(experience.visuallyComplete).toBe(true);
    expect(experience.legs).toHaveLength(1);
    expect(experience.legs[0].mapSegments).toHaveLength(1);
    expect(experience.overview.map((item) => item.label)).toEqual([
      'R8 · begane grond',
    ]);
    expect(experience.legs[0].instructions.join(' ')).toContain(
      'Je bestemming 0.02',
    );
  });

  it('creates coupled floor and stair instructions for a multi-floor route', () => {
    const ground = node('ground', 'R10', 'R10-0', 20, 80);
    const stairs0 = node('stairs-0', 'R10', 'R10-0', 35, 80);
    const stairs3 = node('stairs-3', 'R10', 'R10-3', 35, 45);
    const finish = node('finish', 'R10', 'R10-3', 55, 45);
    const edges = [
      edge('ground-corridor', ground, stairs0),
      edge('stairs', stairs0, stairs3, 'stairs', false, 35),
      edge('top-corridor', stairs3, finish),
    ];
    const from = location('from', 'E0.001', ground);
    const to = location('to', 'F3.025', finish);
    const data = campus([ground, stairs0, stairs3, finish], edges, [from, to]);
    const route = shortestPath(data.nodes, data.edges, ground.id, finish.id)!;
    const experience = createRouteExperience(route, data, from, to, 'nl');

    expect(experience.legs).toHaveLength(2);
    expect(experience.legs[0].instructions.join(' ')).toContain(
      'Neem de trap naar verdieping 3',
    );
    expect(experience.legs[1].instructions[0]).toBe(
      'Je bent nu op verdieping 3.',
    );
    expect(experience.overview.map((item) => item.kind)).toEqual([
      'floor',
      'stairs',
      'floor',
    ]);
  });

  it('explains leaving and entering buildings around an outdoor transition', () => {
    const r8 = node('r8', 'R8', 'R8-0', 10, 55);
    const r8Exit = node('r8-exit', 'R8', 'R8-0', 24, 55);
    const r10Entry = node('r10-entry', 'R10', 'R10-0', 39, 87);
    const r10 = node('r10', 'R10', 'R10-0', 50, 87);
    const edges = [
      edge('r8-corridor', r8, r8Exit),
      edge('outside', r8Exit, r10Entry, 'outdoor', false, 200),
      edge('r10-corridor', r10Entry, r10),
    ];
    const from = location('from', '0.26', r8);
    const to = location('to', 'E0.006', r10);
    const data = campus([r8, r8Exit, r10Entry, r10], edges, [from, to]);
    const route = shortestPath(data.nodes, data.edges, r8.id, r10.id)!;
    const experience = createRouteExperience(route, data, from, to, 'nl');

    expect(experience.visuallyComplete).toBe(true);
    expect(experience.legs[0].instructions.join(' ')).toContain('Verlaat R8');
    expect(experience.legs[1].instructions[0]).toContain('Ga R10 binnen');
    expect(experience.overview.map((item) => item.label)).toContain(
      'Buiten naar R10',
    );
  });

  it('never invents a straight line for a corridor without map geometry', () => {
    const start = node('a', 'R8', 'R8-0', 10, 40);
    const finish = node('b', 'R8', 'R8-0', 25, 40);
    const from = location('from', '0.01', start);
    const to = location('to', '0.02', finish);
    const data = campus(
      [start, finish],
      [edge('missing', start, finish, 'corridor', false)],
      [from, to],
    );
    const route = shortestPath(data.nodes, data.edges, start.id, finish.id)!;
    const experience = createRouteExperience(route, data, from, to, 'nl');

    expect(experience.visuallyComplete).toBe(false);
    expect(experience.missingMapEdgeIds).toEqual(['missing']);
    expect(experience.legs[0].mapSegments).toEqual([]);
  });

  it('orients stored bidirectional geometry in the walking direction', () => {
    const start = node('a', 'R8', 'R8-0', 10, 40);
    const finish = node('b', 'R8', 'R8-0', 25, 40);
    const storedReverse = edge('ba', finish, start);
    const from = location('from', '0.01', start);
    const to = location('to', '0.02', finish);
    const data = campus([start, finish], [storedReverse], [from, to]);
    const route = shortestPath(data.nodes, data.edges, start.id, finish.id)!;
    const segment = createRouteExperience(route, data, from, to, 'nl').legs[0]
      .mapSegments[0];

    expect(segment.points).toEqual([
      [10, 40],
      [25, 40],
    ]);
  });

  it('rounds walking time to whole minutes with transition allowances', () => {
    const a = node('a', 'R8', 'R8-0', 0, 0);
    const b = node('b', 'R8', 'R8-0', 10, 0);
    const c = node('c', 'R8', 'R8-1', 10, 0);
    const route = shortestPath(
      [a, b, c],
      [
        edge('long', a, b, 'corridor', true, 600),
        edge('up', b, c, 'stairs', false, 35),
      ],
      a.id,
      c.id,
    )!;
    expect(estimateWalkingMinutes(route)).toBe(2);
  });

  it('gates routing debug output to development URLs', () => {
    expect(routingDebugEnabled('development', '?debugRouting=1')).toBe(true);
    expect(routingDebugEnabled('development', '?debugRouting=0')).toBe(false);
    expect(routingDebugEnabled('production', '?debugRouting=1')).toBe(false);
  });
});
