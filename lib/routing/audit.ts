import type { Location, RouteEdge, RouteNode } from '../campus/types';
import { createRouteEndpointResolver } from './endpoints';

export type RoomRouteRecord = {
  location_id: string;
  public: boolean;
};

export type RoutingAuditData = {
  locations: Location[];
  nodes: RouteNode[];
  edges: RouteEdge[];
  rooms: RoomRouteRecord[];
};

export function auditRoutingData(data: RoutingAuditData) {
  const resolver = createRouteEndpointResolver(data);
  const approved = data.locations.filter(
    (location) => location.status === 'approved',
  );
  const publicRoomIds = new Set(
    data.rooms.filter((room) => room.public).map((room) => room.location_id),
  );
  const resolutions = approved.map((location) => ({
    location,
    endpoint: resolver.resolveLocation(location),
  }));
  const direct = resolutions.filter(
    ({ endpoint }) => endpoint.resolutionType === 'direct',
  );
  const inferred = resolutions.filter(({ endpoint }) =>
    ['nearest-corridor', 'room-entrance', 'fallback'].includes(
      endpoint.resolutionType,
    ),
  );
  const needsReview = resolutions.filter(({ endpoint }) =>
    [
      'node-not-found',
      'floor-mismatch',
      'building-mismatch',
      'disconnected-node',
    ].includes(endpoint.failure ?? ''),
  );
  const unavailable = resolutions.filter(
    ({ endpoint }) => endpoint.failure === 'missing-node',
  );
  const publicRoomsWithoutEndpoint = resolutions.filter(
    ({ location, endpoint }) =>
      publicRoomIds.has(location.id) && endpoint.nodeId === null,
  );
  const locationsOutsideMainComponent = resolutions.filter(({ location }) => {
    if (!location.node_id) return false;
    return (
      resolver.graph.componentByNode.get(location.node_id) !==
      resolver.graph.mainComponentId
    );
  });
  const mappedNodeIds = new Set(
    data.locations.flatMap((location) =>
      location.node_id ? [location.node_id] : [],
    ),
  );
  const isolatedUnmappedNodeIds = resolver.graph.components
    .filter((component) => component.size === 1)
    .flatMap((component) => component.nodeIds)
    .filter((nodeId) => !mappedNodeIds.has(nodeId));
  const criticalIssueCount =
    resolver.graph.invalidEdgeIds.length +
    publicRoomsWithoutEndpoint.length +
    needsReview.length +
    unavailable.length;

  return {
    locationsTotal: data.locations.length,
    approvedLocations: approved.length,
    roomsTotal: data.rooms.length,
    publicRooms: data.rooms.filter((room) => room.public).length,
    nodesTotal: data.nodes.length,
    edgesTotal: data.edges.length,
    directMappings: direct.length,
    inferredMappings: inferred.length,
    needsReview: needsReview.length,
    unavailable: unavailable.length,
    componentCount: resolver.graph.components.length,
    componentSizes: resolver.graph.components.map(
      (component) => component.size,
    ),
    mainComponentSize: resolver.graph.mainComponentSize,
    locationsOutsideMainComponent: locationsOutsideMainComponent.length,
    publicRoomsWithoutEndpoint: publicRoomsWithoutEndpoint.length,
    invalidNodeReferences: resolutions.filter(
      ({ endpoint }) => endpoint.failure === 'node-not-found',
    ).length,
    invalidEdgeIds: resolver.graph.invalidEdgeIds,
    unreachableWithinMainNodeIds: resolver.graph.unreachableWithinMainNodeIds,
    isolatedUnmappedNodeIds,
    routingCoveragePercent:
      approved.length === 0
        ? 100
        : Number(
            (
              ((direct.length + inferred.length) / approved.length) *
              100
            ).toFixed(2),
          ),
    criticalIssueCount,
  };
}
