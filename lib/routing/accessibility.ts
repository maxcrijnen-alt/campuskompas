import type { RouteEdge, RouteNode, Verification } from '../campus/types';

export type AccessibilityState = 'accessible' | 'inaccessible' | 'unknown';
export type WheelchairRouteConfidence = 'confirmed' | 'partially_unknown';

export function accessibilityState(value: {
  accessible: boolean;
  accessibility_status: Verification;
}): AccessibilityState {
  if (value.accessibility_status !== 'verified') return 'unknown';
  return value.accessible ? 'accessible' : 'inaccessible';
}

export function wheelchairNodeAllowed(node: RouteNode) {
  return accessibilityState(node) !== 'inaccessible';
}

export function wheelchairEdgeAllowed(edge: RouteEdge) {
  return (
    edge.edge_type !== 'stairs' &&
    accessibilityState(edge) !== 'inaccessible'
  );
}

export function wheelchairRouteConfidence(
  nodes: RouteNode[],
  edges: RouteEdge[],
): WheelchairRouteConfidence {
  return nodes.every((node) => accessibilityState(node) === 'accessible') &&
    edges.every((edge) => accessibilityState(edge) === 'accessible')
    ? 'confirmed'
    : 'partially_unknown';
}
