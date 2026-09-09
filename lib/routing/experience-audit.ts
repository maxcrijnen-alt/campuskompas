import type { CampusData } from '../campus/types';
import { createRouteEndpointResolver } from './endpoints';
import { createRouteExperience } from './experience';
import { shortestPath } from './graph';

const requiredPairs = [
  ['ishop-to-f3025', 'ishop', 'F3025'],
  ['f3025-to-ishop', 'F3025', 'ishop'],
  ['library-to-f3025', 'library', 'F3025'],
  ['r8-main-to-high-room', 'R8_MAIN', 'R8-301'],
  ['r10-main-to-f3025', 'R10_MAIN', 'F3025'],
  ['same-floor-room-to-library', 'R8-002', 'library'],
  ['multi-floor-room-to-room', 'R8-002', 'R8-301'],
  ['r8-to-r10', 'R8_MAIN', 'R10_MAIN'],
  ['r10-to-r8', 'R10_MAIN', 'R8_MAIN'],
] as const;

export function auditRouteExperience(data: CampusData) {
  const resolver = createRouteEndpointResolver(data);
  const results = requiredPairs.map(([id, fromId, toId]) => {
    const from = data.locations.find((location) => location.id === fromId);
    const to = data.locations.find((location) => location.id === toId);
    const fromEndpoint = from ? resolver.resolveLocation(from) : null;
    const toEndpoint = to ? resolver.resolveLocation(to) : null;
    const route =
      from && to && fromEndpoint?.nodeId && toEndpoint?.nodeId
        ? shortestPath(
            data.nodes,
            data.edges,
            fromEndpoint.nodeId,
            toEndpoint.nodeId,
          )
        : null;
    const experience =
      route && from && to
        ? createRouteExperience(route, data, from, to, 'nl')
        : null;
    const failures: string[] = [];
    if (!from || !to) failures.push('missing-location');
    if (!fromEndpoint?.nodeId || !toEndpoint?.nodeId)
      failures.push('missing-endpoint');
    if (!route) failures.push('missing-route');
    if (experience && !experience.visuallyComplete)
      failures.push('incomplete-corridor-geometry');
    if (experience?.legs.some((leg) => leg.instructions.length === 0))
      failures.push('missing-instructions');
    if (experience && experience.walkingMinutes < 1)
      failures.push('invalid-walking-time');
    return {
      id,
      from: fromId,
      to: toId,
      fromNodeId: fromEndpoint?.nodeId ?? null,
      toNodeId: toEndpoint?.nodeId ?? null,
      routeAvailable: Boolean(route),
      visuallyComplete: experience?.visuallyComplete ?? false,
      legs: experience?.legs.length ?? 0,
      visibleSegments:
        experience?.legs.reduce(
          (sum, leg) => sum + leg.mapSegments.length,
          0,
        ) ?? 0,
      transitions:
        route?.edges.filter((edge) => edge.edge_type !== 'corridor').length ??
        0,
      outdoor:
        route?.edges.some((edge) => edge.edge_type === 'outdoor') ?? false,
      walkingMinutes: experience?.walkingMinutes ?? null,
      failures,
    };
  });
  const failedPairs = results
    .filter((result) => result.failures.length > 0)
    .map((result) => result.id);
  return {
    requiredPairChecks: results.length,
    passedPairChecks: results.length - failedPairs.length,
    failedPairs,
    results,
    criticalIssueCount: failedPairs.length,
  };
}
