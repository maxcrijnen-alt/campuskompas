import type { Location, RouteEdge, RouteNode } from '../campus/types';
import { accessibilityState, wheelchairEdgeAllowed, wheelchairNodeAllowed } from './accessibility';
import { createRouteEndpointResolver } from './endpoints';
import { analyzeRouteGraph } from './graph-health';
import { shortestPath } from './graph';

export type AccessibilityAuditData = {
  locations: Location[];
  nodes: RouteNode[];
  edges: RouteEdge[];
};

function states<T extends { accessible: boolean; accessibility_status: RouteNode['accessibility_status'] }>(rows: T[]) {
  return {
    accessible: rows.filter((row) => accessibilityState(row) === 'accessible').length,
    unknown: rows.filter((row) => accessibilityState(row) === 'unknown').length,
    inaccessible: rows.filter((row) => accessibilityState(row) === 'inaccessible').length,
  };
}

export function auditAccessibility(data: AccessibilityAuditData) {
  const approved = data.locations.filter((location) => location.status === 'approved');
  const resolver = createRouteEndpointResolver(data);
  const candidateNodes = data.nodes.filter(wheelchairNodeAllowed);
  const candidateIds = new Set(candidateNodes.map((node) => node.id));
  const candidateEdges = data.edges.filter(
    (edge) =>
      wheelchairEdgeAllowed(edge) &&
      candidateIds.has(edge.from_node_id) &&
      candidateIds.has(edge.to_node_id),
  );
  const candidateGraph = analyzeRouteGraph(candidateNodes, candidateEdges);
  const candidateEndpointIds = new Set(candidateGraph.usableNodeIds);
  const possibleLocations = approved.filter((location) => {
    const endpoint = resolver.resolveLocation(location);
    return endpoint.nodeId !== null && candidateEndpointIds.has(endpoint.nodeId);
  });
  const confirmedNodes = data.nodes.filter(
    (node) => accessibilityState(node) === 'accessible',
  );
  const confirmedIds = new Set(confirmedNodes.map((node) => node.id));
  const confirmedEdges = data.edges.filter(
    (edge) =>
      accessibilityState(edge) === 'accessible' &&
      edge.edge_type !== 'stairs' &&
      confirmedIds.has(edge.from_node_id) &&
      confirmedIds.has(edge.to_node_id),
  );
  const confirmedGraph = analyzeRouteGraph(confirmedNodes, confirmedEdges);
  const confirmedEndpointIds = new Set(confirmedGraph.usableNodeIds);
  const confirmedLocations = approved.filter((location) => {
    const endpoint = resolver.resolveLocation(location);
    return endpoint.nodeId !== null && confirmedEndpointIds.has(endpoint.nodeId);
  });
  const contradictions = data.edges
    .filter((edge) => edge.edge_type === 'stairs' && edge.accessible)
    .map((edge) => edge.id);
  const criticalPairs = [
    ['R8_MAIN', 'R8-301'],
    ['R10_MAIN', 'F3025'],
    ['ishop', 'F3025'],
  ].map(([fromId, toId]) => {
    const from = resolver.resolveReference(fromId);
    const to = resolver.resolveReference(toId);
    const route =
      from.nodeId && to.nodeId
        ? shortestPath(data.nodes, data.edges, from.nodeId, to.nodeId, true)
        : null;
    return {
      from: fromId,
      to: toId,
      available: route !== null,
      confidence: route?.accessibility ?? null,
      stairs: route?.edges.filter((edge) => edge.edge_type === 'stairs').length ?? 0,
    };
  });

  return {
    nodes: { total: data.nodes.length, ...states(data.nodes) },
    edges: { total: data.edges.length, ...states(data.edges) },
    corridors: states(data.edges.filter((edge) => edge.edge_type === 'corridor')),
    elevators: states(data.edges.filter((edge) => edge.edge_type === 'elevator')),
    stairs: states(data.edges.filter((edge) => edge.edge_type === 'stairs')),
    candidateGraph: {
      nodes: candidateNodes.length,
      edges: candidateEdges.length,
      components: candidateGraph.components.length,
      mainComponentSize: candidateGraph.mainComponentSize,
    },
    confirmedGraph: {
      nodes: confirmedNodes.length,
      edges: confirmedEdges.length,
      components: confirmedGraph.components.length,
      mainComponentSize: confirmedGraph.mainComponentSize,
    },
    approvedLocations: approved.length,
    publicLocationsWithPossibleWheelchairRoute: possibleLocations.length,
    publicLocationsWithoutPossibleWheelchairRoute:
      approved.length - possibleLocations.length,
    publicLocationsConfirmedAccessible: confirmedLocations.length,
    publicLocationsNeedingPhysicalVerification:
      possibleLocations.length - confirmedLocations.length,
    verificationUnknownCount:
      states(data.nodes).unknown + states(data.edges).unknown,
    errorCount: contradictions.length + candidateGraph.invalidEdgeIds.length,
    contradictions,
    invalidEdgeIds: candidateGraph.invalidEdgeIds,
    criticalPairs,
  };
}
