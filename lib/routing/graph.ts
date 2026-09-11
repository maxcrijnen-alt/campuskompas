import type { RouteNode, RouteEdge } from '../campus/types';
import {
  wheelchairConnectionAllowed,
  wheelchairNodeAllowed,
  wheelchairRouteConfidence,
  type WheelchairRouteConfidence,
} from './accessibility';
export type Route = {
  nodes: RouteNode[];
  edges: RouteEdge[];
  weight: number;
  verified: boolean;
  transitions: number;
  accessibility: WheelchairRouteConfidence | 'not-requested';
};
export function shortestPath(
  nodes: RouteNode[],
  edges: RouteEdge[],
  from: string,
  to: string,
  accessible = false,
): Route | null {
  const allowed = new Map(
    nodes
      .filter((n) => !accessible || wheelchairNodeAllowed(n))
      .map((n) => [n.id, n]),
  );
  if (!allowed.has(from) || !allowed.has(to)) return null;
  const adjacency = new Map<string, { to: string; edge: RouteEdge }[]>();
  for (const e of edges) {
    if (!Number.isFinite(e.weight) || e.weight < 0)
      throw new Error('Invalid graph weight');
    const fromNode = allowed.get(e.from_node_id),
      toNode = allowed.get(e.to_node_id);
    if (
      !fromNode ||
      !toNode ||
      (accessible && !wheelchairConnectionAllowed(e, fromNode, toNode))
    )
      continue;
    for (const [a, b] of [
      [e.from_node_id, e.to_node_id],
      ...(e.bidirectional ? [[e.to_node_id, e.from_node_id]] : []),
    ]) {
      const list = adjacency.get(a) ?? [];
      list.push({ to: b, edge: e });
      adjacency.set(a, list);
    }
  }
  const distance = new Map<string, number>([[from, 0]]),
    previous = new Map<string, { id: string; edge: RouteEdge }>(),
    pending = new Set(allowed.keys());
  while (pending.size) {
    let current: string | undefined,
      best = Infinity;
    for (const id of pending) {
      const d = distance.get(id) ?? Infinity;
      if (d < best) {
        current = id;
        best = d;
      }
    }
    if (!current) break;
    if (current === to) break;
    pending.delete(current);
    for (const next of adjacency.get(current) ?? []) {
      const d = best + next.edge.weight;
      if (d < (distance.get(next.to) ?? Infinity)) {
        distance.set(next.to, d);
        previous.set(next.to, { id: current, edge: next.edge });
      }
    }
  }
  if (!distance.has(to)) return null;
  const path = [allowed.get(to)!],
    routeEdges: RouteEdge[] = [];
  let cursor = to;
  while (cursor !== from) {
    const p = previous.get(cursor);
    if (!p) return null;
    routeEdges.unshift(p.edge);
    path.unshift(allowed.get(p.id)!);
    cursor = p.id;
  }
  return {
    nodes: path,
    edges: routeEdges,
    weight: distance.get(to)!,
    verified:
      path.every((n) => n.verification_status === 'verified') &&
      routeEdges.every((e) => e.verification_status === 'verified'),
    transitions: routeEdges.filter(
      (_, i) => path[i].floor_id !== path[i + 1].floor_id,
    ).length,
    accessibility: accessible
      ? wheelchairRouteConfidence(path, routeEdges)
      : 'not-requested',
  };
}
export function routeStages(route: Route) {
  return route.nodes.reduce<{ floor_id: string; nodes: RouteNode[] }[]>(
    (stages, node) => {
      const last = stages.at(-1);
      if (last?.floor_id === node.floor_id) last.nodes.push(node);
      else stages.push({ floor_id: node.floor_id, nodes: [node] });
      return stages;
    },
    [],
  );
}
