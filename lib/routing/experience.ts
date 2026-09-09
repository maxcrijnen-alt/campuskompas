import type {
  CampusData,
  Locale,
  Location,
  RouteEdge,
  RouteNode,
} from '../campus/types';
import type { Route } from './graph';

export const WALKING_TIME_ASSUMPTIONS = {
  metresPerGraphUnit: 0.125,
  walkingMetresPerMinute: 75,
  stairsMinutes: 0.6,
  elevatorMinutes: 0.75,
  outdoorTransitionMinutes: 0.25,
} as const;

export type RouteMapSegment = {
  edgeId: string;
  points: [number, number][];
  verified: boolean;
};

export type RouteExperienceLeg = {
  index: number;
  floorId: string;
  buildingId: string;
  level: number;
  nodes: RouteNode[];
  edgeIndexes: number[];
  incomingTransition: RouteEdge | null;
  outgoingTransition: RouteEdge | null;
  mapSegments: RouteMapSegment[];
  instructions: string[];
};

export type RouteOverviewItem = {
  kind: 'floor' | RouteEdge['edge_type'];
  label: string;
  legIndex: number;
};

export type RouteExperience = {
  legs: RouteExperienceLeg[];
  overview: RouteOverviewItem[];
  walkingMinutes: number;
  visuallyComplete: boolean;
  missingMapEdgeIds: string[];
  originGap: number | null;
  destinationGap: number | null;
};

export function routingDebugEnabled(environment: string, search: string) {
  return (
    environment !== 'production' &&
    new URLSearchParams(search).get('debugRouting') === '1'
  );
}

type LegBase = Omit<RouteExperienceLeg, 'instructions'>;

function floorName(level: number, locale: Locale) {
  if (level === 0) return locale === 'nl' ? 'begane grond' : 'ground floor';
  return `${locale === 'nl' ? 'verdieping' : 'floor'} ${level}`;
}

function locationName(location: Location, locale: Locale) {
  return location.room_code || location.name[locale];
}

function pointDistance(location: Location, node: RouteNode) {
  if (
    location.map_x == null ||
    location.map_y == null ||
    node.map_x == null ||
    node.map_y == null
  )
    return null;
  return Math.hypot(location.map_x - node.map_x, location.map_y - node.map_y);
}

function transitionInstruction(
  edge: RouteEdge,
  current: LegBase,
  next: LegBase,
  locale: Locale,
) {
  const en = locale === 'en';
  if (edge.edge_type === 'outdoor')
    return en
      ? `Leave ${current.buildingId} at the marked exit. Follow the outdoor connection to ${next.buildingId}.`
      : `Verlaat ${current.buildingId} bij de gemarkeerde uitgang. Volg de buitenverbinding naar ${next.buildingId}.`;
  if (edge.edge_type === 'stairs' || edge.edge_type === 'elevator') {
    const transport =
      edge.edge_type === 'stairs'
        ? en
          ? 'stairs'
          : 'trap'
        : en
          ? 'lift'
          : 'lift';
    return en
      ? `Take the ${transport} to ${floorName(next.level, locale)}.`
      : `Neem de ${transport} naar ${floorName(next.level, locale)}.`;
  }
  return en
    ? `Continue to ${next.buildingId}, ${floorName(next.level, locale)}.`
    : `Ga verder naar ${next.buildingId}, ${floorName(next.level, locale)}.`;
}

function arrivalInstruction(incoming: RouteEdge, leg: LegBase, locale: Locale) {
  const en = locale === 'en';
  if (incoming.edge_type === 'outdoor')
    return en
      ? `Enter ${leg.buildingId}. The route continues from the marked entrance.`
      : `Ga ${leg.buildingId} binnen. De route gaat verder vanaf de gemarkeerde ingang.`;
  if (incoming.edge_type === 'stairs' || incoming.edge_type === 'elevator')
    return en
      ? `You are now on ${floorName(leg.level, locale)}.`
      : `Je bent nu op ${floorName(leg.level, locale)}.`;
  return null;
}

function legInstructions(
  leg: LegBase,
  legs: LegBase[],
  from: Location,
  to: Location,
  locale: Locale,
  originGap: number | null,
  destinationGap: number | null,
) {
  const en = locale === 'en';
  const result: string[] = [];
  if (leg.index === 0) {
    result.push(
      originGap !== null && originGap > 1.5
        ? en
          ? `Start at ${locationName(from, locale)} and walk to the marked corridor starting point.`
          : `Start bij ${locationName(from, locale)} en loop naar het gemarkeerde startpunt in de gang.`
        : en
          ? `Start at ${locationName(from, locale)}.`
          : `Start bij ${locationName(from, locale)}.`,
    );
  } else if (leg.incomingTransition) {
    const arrival = arrivalInstruction(leg.incomingTransition, leg, locale);
    if (arrival) result.push(arrival);
  }

  if (leg.edgeIndexes.length > 0)
    result.push(
      en
        ? 'Follow the highlighted route across this floor.'
        : 'Volg de gemarkeerde route over deze verdieping.',
    );

  const next = legs[leg.index + 1];
  if (leg.outgoingTransition && next)
    result.push(
      transitionInstruction(leg.outgoingTransition, leg, next, locale),
    );
  else if (leg.index === legs.length - 1)
    result.push(
      destinationGap !== null && destinationGap > 1.5
        ? en
          ? `The drawn route ends at the corridor position nearest ${locationName(to, locale)}. The destination marker shows the room label; the exact door has not been surveyed.`
          : `De ingetekende route eindigt bij de gangpositie het dichtst bij ${locationName(to, locale)}. De bestemmingsmarker toont het lokaalnummer; de exacte deur is niet ingemeten.`
        : en
          ? `Your destination ${locationName(to, locale)} is marked as DESTINATION.`
          : `Je bestemming ${locationName(to, locale)} is gemarkeerd als BESTEMMING.`,
    );
  return result;
}

function orientedMapPath(route: Route, edgeIndex: number) {
  const edge = route.edges[edgeIndex];
  if (!edge.map_path || edge.map_path.length < 2) return null;
  const points = edge.map_path.map(([x, y]) => [x, y] as [number, number]);
  return edge.from_node_id === route.nodes[edgeIndex].id
    ? points
    : points.reverse();
}

function routeLegs(route: Route, data: CampusData): LegBase[] {
  if (route.nodes.length === 0) return [];
  const result: LegBase[] = [];
  let startNodeIndex = 0;
  for (let nodeIndex = 1; nodeIndex <= route.nodes.length; nodeIndex += 1) {
    const floorChanged =
      nodeIndex === route.nodes.length ||
      route.nodes[nodeIndex].floor_id !== route.nodes[startNodeIndex].floor_id;
    if (!floorChanged) continue;
    const endNodeIndex = nodeIndex - 1;
    const nodes = route.nodes.slice(startNodeIndex, nodeIndex);
    const edgeIndexes = Array.from(
      { length: Math.max(0, endNodeIndex - startNodeIndex) },
      (_, index) => startNodeIndex + index,
    );
    const floor = data.floors.find(
      (candidate) => candidate.id === nodes[0].floor_id,
    );
    result.push({
      index: result.length,
      floorId: nodes[0].floor_id,
      buildingId: nodes[0].building_id,
      level: floor?.level ?? (Number(nodes[0].floor_id.split('-').at(-1)) || 0),
      nodes,
      edgeIndexes,
      incomingTransition:
        startNodeIndex > 0 ? route.edges[startNodeIndex - 1] : null,
      outgoingTransition:
        endNodeIndex < route.edges.length ? route.edges[endNodeIndex] : null,
      mapSegments: edgeIndexes.flatMap((edgeIndex) => {
        const points = orientedMapPath(route, edgeIndex);
        return points
          ? [
              {
                edgeId: route.edges[edgeIndex].id,
                points,
                verified:
                  route.edges[edgeIndex].verification_status === 'verified',
              },
            ]
          : [];
      }),
    });
    startNodeIndex = nodeIndex;
  }
  return result;
}

export function estimateWalkingMinutes(route: Route) {
  const horizontalWeight = route.edges
    .filter(
      (edge) => edge.edge_type === 'corridor' || edge.edge_type === 'outdoor',
    )
    .reduce((sum, edge) => sum + edge.weight, 0);
  const baseMinutes =
    (horizontalWeight * WALKING_TIME_ASSUMPTIONS.metresPerGraphUnit) /
    WALKING_TIME_ASSUMPTIONS.walkingMetresPerMinute;
  const transitionMinutes = route.edges.reduce((sum, edge) => {
    if (edge.edge_type === 'stairs')
      return sum + WALKING_TIME_ASSUMPTIONS.stairsMinutes;
    if (edge.edge_type === 'elevator')
      return sum + WALKING_TIME_ASSUMPTIONS.elevatorMinutes;
    if (edge.edge_type === 'outdoor')
      return sum + WALKING_TIME_ASSUMPTIONS.outdoorTransitionMinutes;
    return sum;
  }, 0);
  return Math.max(1, Math.ceil(baseMinutes + transitionMinutes));
}

export function createRouteExperience(
  route: Route,
  data: CampusData,
  from: Location,
  to: Location,
  locale: Locale,
): RouteExperience {
  const baseLegs = routeLegs(route, data);
  const originGap = pointDistance(from, route.nodes[0]);
  const destinationGap = pointDistance(to, route.nodes.at(-1)!);
  const legs: RouteExperienceLeg[] = baseLegs.map((leg) => ({
    ...leg,
    instructions: legInstructions(
      leg,
      baseLegs,
      from,
      to,
      locale,
      originGap,
      destinationGap,
    ),
  }));
  const overview = legs.flatMap((leg, index): RouteOverviewItem[] => {
    const items: RouteOverviewItem[] = [
      {
        kind: 'floor',
        label: `${leg.buildingId} · ${floorName(leg.level, locale)}`,
        legIndex: index,
      },
    ];
    const next = legs[index + 1];
    if (leg.outgoingTransition && next) {
      const edge = leg.outgoingTransition;
      items.push({
        kind: edge.edge_type,
        label:
          edge.edge_type === 'outdoor'
            ? locale === 'nl'
              ? `Buiten naar ${next.buildingId}`
              : `Outside to ${next.buildingId}`
            : edge.edge_type === 'stairs'
              ? `${locale === 'nl' ? 'Trap' : 'Stairs'} → ${floorName(next.level, locale)}`
              : edge.edge_type === 'elevator'
                ? `${locale === 'nl' ? 'Lift' : 'Lift'} → ${floorName(next.level, locale)}`
                : `${locale === 'nl' ? 'Verder' : 'Continue'} → ${next.buildingId}`,
        legIndex: index,
      });
    }
    return items;
  });
  const missingMapEdgeIds = route.edges
    .filter(
      (edge) =>
        edge.edge_type === 'corridor' &&
        (!edge.map_path || edge.map_path.length < 2),
    )
    .map((edge) => edge.id);
  return {
    legs,
    overview,
    walkingMinutes: estimateWalkingMinutes(route),
    visuallyComplete: missingMapEdgeIds.length === 0,
    missingMapEdgeIds,
    originGap,
    destinationGap,
  };
}
