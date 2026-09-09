import type { CampusData } from '../campus/types';
import { createRouteEndpointResolver } from './endpoints';
import { shortestPath } from './graph';
import { accessibilityState } from './accessibility';

export type CriticalRoutePair = {
  id: string;
  from: string;
  to: string;
  expectsOutdoor?: boolean;
  minimumTransitions?: number;
};

export const phase2CriticalPairs: CriticalRoutePair[] = [
  {
    id: 'ishop-to-f3025',
    from: 'ishop',
    to: 'F3025',
    expectsOutdoor: true,
    minimumTransitions: 3,
  },
  {
    id: 'library-to-f3025',
    from: 'library',
    to: 'F3025',
    expectsOutdoor: true,
    minimumTransitions: 3,
  },
  {
    id: 'r8-entrance-to-high-floor',
    from: 'R8_MAIN',
    to: 'R8-301',
    minimumTransitions: 3,
  },
  {
    id: 'r10-entrance-to-high-floor',
    from: 'R10_MAIN',
    to: 'F3025',
    minimumTransitions: 3,
  },
  {
    id: 'inter-building-reverse',
    from: 'F3025',
    to: 'library',
    expectsOutdoor: true,
    minimumTransitions: 3,
  },
  {
    id: 'same-floor',
    from: 'ishop',
    to: 'library',
  },
  {
    id: 'same-building-multi-floor',
    from: 'R8-002',
    to: 'R8-301',
    minimumTransitions: 3,
  },
];

type RoutingData = Pick<CampusData, 'locations' | 'nodes' | 'edges'>;

export function checkRoutingRegressions(
  data: RoutingData,
  pairs: CriticalRoutePair[] = phase2CriticalPairs,
  sampleSize = 48,
) {
  const resolver = createRouteEndpointResolver(data);
  const approved = data.locations
    .filter((location) => location.status === 'approved')
    .sort((a, b) => a.id.localeCompare(b.id));
  const allLocationFailures: string[] = [];

  for (const location of approved) {
    const endpoint = resolver.resolveLocation(location);
    if (
      endpoint.resolutionType !== 'direct' ||
      endpoint.nodeId === null ||
      endpoint.floorId !== location.floor_id ||
      endpoint.buildingId !== location.building_id ||
      resolver.graph.componentByNode.get(endpoint.nodeId) !==
        resolver.graph.mainComponentId
    ) {
      allLocationFailures.push(
        `${location.id}:${endpoint.failure ?? endpoint.resolutionType}`,
      );
    }
  }

  const criticalPairResults = pairs.map((pair) => {
    const from = resolver.resolveReference(pair.from);
    const to = resolver.resolveReference(pair.to);
    const route =
      from.nodeId && to.nodeId
        ? shortestPath(data.nodes, data.edges, from.nodeId, to.nodeId)
        : null;
    const accessibleRoute =
      from.nodeId && to.nodeId
        ? shortestPath(data.nodes, data.edges, from.nodeId, to.nodeId, true)
        : null;
    const failures: string[] = [];
    if (!from.nodeId) failures.push(`from:${from.failure}`);
    if (!to.nodeId) failures.push(`to:${to.failure}`);
    if (!route) failures.push('normal-route-unavailable');
    if (
      route &&
      pair.expectsOutdoor &&
      !route.edges.some((edge) => edge.edge_type === 'outdoor')
    )
      failures.push('outdoor-transition-missing');
    if (
      route &&
      pair.minimumTransitions !== undefined &&
      route.transitions < pair.minimumTransitions
    )
      failures.push('floor-transitions-missing');
    if (
      accessibleRoute &&
      (accessibleRoute.edges.some((edge) => edge.edge_type === 'stairs') ||
        accessibleRoute.nodes.some(
          (node) => accessibilityState(node) === 'inaccessible',
        ) ||
        accessibleRoute.edges.some(
          (edge) => accessibilityState(edge) === 'inaccessible',
        ))
    )
      failures.push('unsafe-accessible-route');
    return {
      id: pair.id,
      from: pair.from,
      to: pair.to,
      normal: route ? 'available' : 'unavailable',
      accessible: accessibleRoute
        ? accessibleRoute.accessibility === 'confirmed'
          ? 'confirmed'
          : 'available-with-unknowns'
        : 'unavailable',
      transitions: route?.transitions ?? null,
      outdoor:
        route?.edges.some((edge) => edge.edge_type === 'outdoor') ?? false,
      failures,
    };
  });

  const sampledRouteFailures: string[] = [];
  const sampled = approved.slice(0, Math.min(sampleSize, approved.length));
  for (let index = 0; index < sampled.length; index += 1) {
    const fromLocation = sampled[index];
    const toLocation = approved[(index * 37 + 193) % approved.length];
    const from = resolver.resolveLocation(fromLocation);
    const to = resolver.resolveLocation(toLocation);
    if (
      !from.nodeId ||
      !to.nodeId ||
      !shortestPath(data.nodes, data.edges, from.nodeId, to.nodeId)
    )
      sampledRouteFailures.push(`${fromLocation.id}->${toLocation.id}`);
  }

  const criticalPairFailures = criticalPairResults.flatMap((result) =>
    result.failures.map((failure) => `${result.id}:${failure}`),
  );
  return {
    approvedLocations: approved.length,
    allLocationChecks: approved.length,
    allLocationFailures,
    endpointCoveragePercent:
      approved.length === 0
        ? 100
        : Number(
            (
              ((approved.length - allLocationFailures.length) /
                approved.length) *
              100
            ).toFixed(2),
          ),
    sampledRouteChecks: sampled.length,
    sampledRouteFailures,
    criticalPairResults,
    criticalPairFailures,
    criticalIssueCount:
      allLocationFailures.length +
      sampledRouteFailures.length +
      criticalPairFailures.length,
  };
}
