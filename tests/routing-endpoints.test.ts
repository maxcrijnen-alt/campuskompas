import { describe, expect, it } from 'vitest';
import type { Location, RouteEdge, RouteNode } from '../lib/campus/types';
import { seed } from '../lib/campus/seed';
import { auditRoutingData } from '../lib/routing/audit';
import { createRouteEndpointResolver } from '../lib/routing/endpoints';
import { analyzeRouteGraph } from '../lib/routing/graph-health';

const node = (id: string, floor = 'R8-0'): RouteNode => ({
  id,
  building_id: floor.split('-')[0],
  floor_id: floor,
  x: 0,
  y: 0,
  node_type: 'corridor',
  label: { nl: id, en: id },
  accessible: false,
  accessibility_status: 'unverified',
  verification_status: 'unverified',
});
const edge = (id: string, from: string, to: string): RouteEdge => ({
  id,
  from_node_id: from,
  to_node_id: to,
  weight: 1,
  edge_type: 'corridor',
  accessible: false,
  accessibility_status: 'unverified',
  verification_status: 'unverified',
  bidirectional: true,
});
const location = (
  id: string,
  nodeId: string | null,
  floor = 'R8-0',
): Location => ({
  id,
  name: { nl: id, en: id },
  description: { nl: '', en: '' },
  building_id: floor.split('-')[0],
  floor_id: floor,
  category_id: 'room',
  aliases: [],
  node_id: nodeId,
  x: 0,
  y: 0,
  status: 'approved',
  verification_status: 'unverified',
  source_id: 'test',
});

describe('route graph health', () => {
  it('finds the deterministic main component and isolated nodes', () => {
    const graph = analyzeRouteGraph(
      [node('a'), node('b'), node('c'), node('isolated')],
      [edge('ab', 'a', 'b'), edge('bc', 'b', 'c')],
    );
    expect(graph.components.map((component) => component.size)).toEqual([3, 1]);
    expect(graph.mainComponentId).toBe('a');
    expect(graph.componentByNode.get('c')).toBe('a');
  });

  it('reports missing endpoints and malformed graph edges', () => {
    const graph = analyzeRouteGraph(
      [node('a')],
      [edge('broken', 'a', 'missing')],
    );
    expect(graph.invalidEdgeIds).toEqual(['broken']);
  });

  it('does not mark a one-way-only branch as a usable endpoint', () => {
    const oneWay = { ...edge('ab', 'a', 'b'), bidirectional: false };
    const graph = analyzeRouteGraph([node('a'), node('b')], [oneWay]);
    expect(graph.mainComponentSize).toBe(2);
    expect(graph.usableNodeIds.has('b')).toBe(false);
    expect(graph.unreachableWithinMainNodeIds).toEqual(['b']);
  });
});

describe('central endpoint resolver', () => {
  const nodes = [
    node('a'),
    node('b'),
    node('isolated'),
    node('other-floor', 'R8-1'),
  ];
  const edges = [edge('ab', 'a', 'b')];
  const locations = [
    location('valid', 'a'),
    location('missing', null),
    location('disconnected', 'isolated'),
    location('wrong-floor', 'other-floor'),
  ];
  const resolver = createRouteEndpointResolver({ locations, nodes, edges });

  it('uses a validated direct mapping', () => {
    expect(resolver.resolveLocation('valid')).toMatchObject({
      nodeId: 'a',
      resolutionType: 'direct',
      confidence: 1,
      failure: null,
    });
  });

  it.each([
    ['missing', 'missing-node'],
    ['disconnected', 'disconnected-node'],
    ['wrong-floor', 'floor-mismatch'],
  ])('rejects %s with %s', (id, failure) => {
    expect(resolver.resolveLocation(id)).toMatchObject({
      nodeId: null,
      resolutionType: 'unavailable',
      failure,
    });
  });

  it('uses the same resolver for location and raw node references', () => {
    expect(resolver.resolveReference('valid').nodeId).toBe('a');
    expect(resolver.resolveReference('b').nodeId).toBe('b');
  });
});

describe('routing audit', () => {
  it('keeps every approved seed location on the usable graph', () => {
    const report = auditRoutingData({
      locations: seed.locations,
      nodes: seed.nodes,
      edges: seed.edges,
      rooms: seed.locations
        .filter((entry) => entry.category_id === 'room')
        .map((entry) => ({ location_id: entry.id, public: true })),
    });
    expect(report.routingCoveragePercent).toBe(100);
    expect(report.locationsOutsideMainComponent).toBe(0);
    expect(report.publicRoomsWithoutEndpoint).toBe(0);
    expect(report.criticalIssueCount).toBe(0);
  });
});
