import { describe, expect, it } from 'vitest';
import { defaultCampusFloorId } from '../lib/campus/default-view';
import { seed } from '../lib/campus/seed';
import type {
  CampusData,
  Location,
  RouteEdge,
  RouteNode,
} from '../lib/campus/types';
import { gemSchema } from '../lib/campus/validation';
import { shortestPath } from '../lib/routing/graph';
import { createRouteExperience } from '../lib/routing/experience';

const baseGem = {
  title: 'Rustige buitentafel',
  description: 'Een fijne plek buiten om rustig een pauze te nemen.',
  category: 'chill',
  location_mode: 'proposed' as const,
  location_id: '',
  proposed_location_name: 'Tafel naast het plein',
  proposed_location_description: 'Aan de rustige zijde van het campusplein.',
  website: '',
  started_at: Date.now(),
};

function node(id: string, floorId: string, buildingId = 'R8'): RouteNode {
  return {
    id,
    building_id: buildingId,
    floor_id: floorId,
    x: 10,
    y: 10,
    map_x: 10,
    map_y: 10,
    node_type: 'elevator',
    label: { nl: 'Lift', en: 'Lift' },
    accessible: false,
    accessibility_status: 'unverified',
    verification_status: 'needs_review',
  };
}

function edge(
  id: string,
  type: RouteEdge['edge_type'],
  weight: number,
): RouteEdge {
  return {
    id,
    from_node_id: 'ground',
    to_node_id: 'upper',
    weight,
    edge_type: type,
    accessible: false,
    accessibility_status: 'unverified',
    verification_status: 'needs_review',
    bidirectional: true,
    map_path: null,
  };
}

describe('Phase 5.6 owner feedback', () => {
  it('chooses R8 ground floor independently of database order', () => {
    expect(defaultCampusFloorId({ floors: [...seed.floors].reverse() })).toBe(
      'R8-0',
    );
  });

  it('models outdoor proposals without an indoor building, floor or endpoint', () => {
    expect(
      gemSchema.safeParse({
        ...baseGem,
        proposed_location_context: 'campus_outdoor',
      }).success,
    ).toBe(true);
    expect(
      gemSchema.safeParse({
        ...baseGem,
        proposed_location_context: 'campus_outdoor',
        proposed_building_id: 'R8',
      }).success,
    ).toBe(false);
    expect(
      gemSchema.safeParse({
        ...baseGem,
        proposed_location_context: 'r8',
      }).success,
    ).toBe(false);
  });

  it('uses only an elevator edge for a wheelchair floor transition', () => {
    const nodes = [node('ground', 'R8-0'), node('upper', 'R8-1')];
    const edges = [
      edge('shortcut', 'corridor', 1),
      edge('lift', 'elevator', 5),
    ];
    expect(shortestPath(nodes, edges, 'ground', 'upper')?.edges[0].id).toBe(
      'shortcut',
    );
    const wheelchair = shortestPath(nodes, edges, 'ground', 'upper', true);
    expect(wheelchair?.edges.map((candidate) => candidate.edge_type)).toEqual([
      'elevator',
    ]);
    expect(shortestPath(nodes, [edges[0]], 'ground', 'upper', true)).toBeNull();
  });

  it('requires an outdoor edge rather than a lift between buildings', () => {
    const nodes = [node('ground', 'R8-0'), node('upper', 'R10-0', 'R10')];
    expect(
      shortestPath(
        nodes,
        [edge('invalid-lift', 'elevator', 1)],
        'ground',
        'upper',
        true,
      ),
    ).toBeNull();
    expect(
      shortestPath(
        nodes,
        [edge('outdoor', 'outdoor', 5)],
        'ground',
        'upper',
        true,
      )?.edges[0].edge_type,
    ).toBe('outdoor');
  });

  it('names the lift in a multi-floor instruction', () => {
    const nodes = [node('ground', 'R8-0'), node('upper', 'R8-1')];
    const route = shortestPath(
      nodes,
      [edge('lift', 'elevator', 5)],
      'ground',
      'upper',
      true,
    )!;
    const from: Location = {
      ...seed.locations[0],
      id: 'from',
      floor_id: 'R8-0',
      building_id: 'R8',
      node_id: 'ground',
      x: 10,
      y: 10,
    };
    const to: Location = {
      ...from,
      id: 'to',
      floor_id: 'R8-1',
      node_id: 'upper',
    };
    const data: CampusData = {
      ...seed,
      floors: seed.floors.filter((floor) =>
        ['R8-0', 'R8-1'].includes(floor.id),
      ),
      nodes,
      edges: route.edges,
      locations: [from, to],
    };
    const instructions = createRouteExperience(route, data, from, to, 'nl')
      .legs.flatMap((leg) => leg.instructions)
      .join(' ');
    expect(instructions).toContain('Neem de lift naar verdieping 1.');
  });
});
