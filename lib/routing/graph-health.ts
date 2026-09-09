import type { RouteEdge, RouteNode } from '../campus/types';

export type GraphComponent = {
  id: string;
  nodeIds: string[];
  size: number;
};

export type RouteGraphHealth = {
  componentByNode: Map<string, string>;
  components: GraphComponent[];
  invalidEdgeIds: string[];
  mainComponentId: string | null;
  mainComponentSize: number;
  usableNodeIds: Set<string>;
  unreachableWithinMainNodeIds: string[];
};

function reachableFrom(start: string, adjacency: Map<string, Set<string>>) {
  const visited = new Set<string>([start]);
  const pending = [start];
  while (pending.length) {
    const current = pending.pop()!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      pending.push(neighbor);
    }
  }
  return visited;
}

/**
 * Builds the weakly connected components of the walking graph. Direction is
 * still respected by shortestPath; weak connectivity answers whether an
 * endpoint belongs to the same physical graph at all.
 */
export function analyzeRouteGraph(
  nodes: RouteNode[],
  edges: RouteEdge[],
): RouteGraphHealth {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  const forward = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  const reverse = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  const invalidEdgeIds: string[] = [];

  for (const edge of edges) {
    if (
      !nodeIds.has(edge.from_node_id) ||
      !nodeIds.has(edge.to_node_id) ||
      !Number.isFinite(edge.weight) ||
      edge.weight <= 0
    ) {
      invalidEdgeIds.push(edge.id);
      continue;
    }
    adjacency.get(edge.from_node_id)!.add(edge.to_node_id);
    adjacency.get(edge.to_node_id)!.add(edge.from_node_id);
    forward.get(edge.from_node_id)!.add(edge.to_node_id);
    reverse.get(edge.to_node_id)!.add(edge.from_node_id);
    if (edge.bidirectional) {
      forward.get(edge.to_node_id)!.add(edge.from_node_id);
      reverse.get(edge.from_node_id)!.add(edge.to_node_id);
    }
  }

  const visited = new Set<string>();
  const components: GraphComponent[] = [];
  const componentByNode = new Map<string, string>();

  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const pending = [node.id];
    const members: string[] = [];
    visited.add(node.id);
    while (pending.length) {
      const current = pending.pop()!;
      members.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        pending.push(neighbor);
      }
    }
    members.sort();
    const id = members[0];
    for (const member of members) componentByNode.set(member, id);
    components.push({ id, nodeIds: members, size: members.length });
  }

  components.sort((a, b) => b.size - a.size || a.id.localeCompare(b.id));
  const mainComponentId = components[0]?.id ?? null;
  const mainNodeIds = new Set(components[0]?.nodeIds ?? []);
  const reachableForward = mainComponentId
    ? reachableFrom(mainComponentId, forward)
    : new Set<string>();
  const reachableReverse = mainComponentId
    ? reachableFrom(mainComponentId, reverse)
    : new Set<string>();
  const usableNodeIds = new Set(
    [...mainNodeIds].filter(
      (nodeId) => reachableForward.has(nodeId) && reachableReverse.has(nodeId),
    ),
  );
  return {
    componentByNode,
    components,
    invalidEdgeIds: invalidEdgeIds.sort(),
    mainComponentId,
    mainComponentSize: components[0]?.size ?? 0,
    usableNodeIds,
    unreachableWithinMainNodeIds: [...mainNodeIds]
      .filter((nodeId) => !usableNodeIds.has(nodeId))
      .sort(),
  };
}
