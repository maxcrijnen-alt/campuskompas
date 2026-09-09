import type { CampusData, Location, RouteNode } from '../campus/types';
import { analyzeRouteGraph, type RouteGraphHealth } from './graph-health';

export type RouteEndpointResolutionType =
  | 'direct'
  | 'nearest-corridor'
  | 'room-entrance'
  | 'fallback'
  | 'unavailable';

export type RouteEndpointFailure =
  | 'location-not-found'
  | 'node-not-found'
  | 'missing-node'
  | 'floor-mismatch'
  | 'building-mismatch'
  | 'disconnected-node';

export type RouteEndpoint = {
  locationId: string | null;
  nodeId: string | null;
  resolutionType: RouteEndpointResolutionType;
  confidence: number;
  distanceToNode: number | null;
  floorId: string | null;
  buildingId: string | null;
  failure: RouteEndpointFailure | null;
};

export type RouteEndpointResolver = {
  graph: RouteGraphHealth;
  resolveLocation(location: Location | string): RouteEndpoint;
  resolveNode(nodeId: string): RouteEndpoint;
  resolveReference(reference: string): RouteEndpoint;
};

const unavailable = (
  failure: RouteEndpointFailure,
  location?: Location,
): RouteEndpoint => ({
  locationId: location?.id ?? null,
  nodeId: null,
  resolutionType: 'unavailable',
  confidence: 0,
  distanceToNode: null,
  floorId: location?.floor_id ?? null,
  buildingId: location?.building_id ?? null,
  failure,
});

function validNodeEndpoint(
  node: RouteNode | undefined,
  graph: RouteGraphHealth,
  location?: Location,
): RouteEndpoint {
  if (!node) return unavailable('node-not-found', location);
  if (location?.floor_id !== undefined && node.floor_id !== location.floor_id)
    return unavailable('floor-mismatch', location);
  if (
    location?.building_id !== undefined &&
    node.building_id !== location.building_id
  )
    return unavailable('building-mismatch', location);
  if (!graph.usableNodeIds.has(node.id))
    return unavailable('disconnected-node', location);
  return {
    locationId: location?.id ?? null,
    nodeId: node.id,
    resolutionType: 'direct',
    confidence: 1,
    distanceToNode: 0,
    floorId: node.floor_id,
    buildingId: node.building_id,
    failure: null,
  };
}

export function createRouteEndpointResolver(
  data: Pick<CampusData, 'locations' | 'nodes' | 'edges'>,
): RouteEndpointResolver {
  const locations = new Map(
    data.locations.map((location) => [location.id, location]),
  );
  const nodes = new Map(data.nodes.map((node) => [node.id, node]));
  const graph = analyzeRouteGraph(data.nodes, data.edges);

  const resolveLocation = (locationOrId: Location | string) => {
    const location =
      typeof locationOrId === 'string'
        ? locations.get(locationOrId)
        : locationOrId;
    if (!location) return unavailable('location-not-found');
    if (!location.node_id) return unavailable('missing-node', location);
    return validNodeEndpoint(nodes.get(location.node_id), graph, location);
  };

  const resolveNode = (nodeId: string) =>
    validNodeEndpoint(nodes.get(nodeId), graph);

  return {
    graph,
    resolveLocation,
    resolveNode,
    resolveReference(reference: string) {
      return locations.has(reference)
        ? resolveLocation(reference)
        : resolveNode(reference);
    },
  };
}
