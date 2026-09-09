import { describe, expect, it } from 'vitest';
import { seed } from '../lib/campus/seed';
import { accessibilityState } from '../lib/routing/accessibility';
import { auditAccessibility } from '../lib/routing/accessibility-audit';
import { shortestPath } from '../lib/routing/graph';

describe('Phase 5 accessibility semantics', () => {
  it('derives three states only from verified evidence', () => {
    expect(accessibilityState({ accessible: true, accessibility_status: 'verified' })).toBe('accessible');
    expect(accessibilityState({ accessible: false, accessibility_status: 'verified' })).toBe('inaccessible');
    expect(accessibilityState({ accessible: false, accessibility_status: 'unverified' })).toBe('unknown');
    expect(accessibilityState({ accessible: true, accessibility_status: 'needs_review' })).toBe('unknown');
  });

  it('keeps normal routes unchanged and unknown wheelchair routes honest', () => {
    const normal = shortestPath(seed.nodes, seed.edges, 'loc-ishop', 'loc-F3025');
    const wheelchair = shortestPath(seed.nodes, seed.edges, 'loc-ishop', 'loc-F3025', true);
    expect(normal).not.toBeNull();
    expect(wheelchair?.accessibility).toBe('partially_unknown');
    expect(wheelchair?.edges.some((edge) => edge.edge_type === 'stairs')).toBe(false);
    expect(wheelchair?.edges.some((edge) => edge.edge_type === 'elevator')).toBe(true);
  });

  it('blocks confirmed inaccessible segments', () => {
    const blockedEdge = seed.edges.find((edge) => edge.edge_type === 'elevator')!;
    const edges = seed.edges.map((edge) =>
      edge.id === blockedEdge.id
        ? { ...edge, accessible: false, accessibility_status: 'verified' as const }
        : edge,
    );
    const route = shortestPath(seed.nodes, edges, blockedEdge.from_node_id, blockedEdge.to_node_id, true);
    expect(route?.edges.some((edge) => edge.id === blockedEdge.id) ?? false).toBe(false);
  });

  it('reports unknown verification separately from graph errors', () => {
    const report = auditAccessibility(seed);
    expect(report.verificationUnknownCount).toBeGreaterThan(0);
    expect(report.errorCount).toBe(0);
    expect(report.publicLocationsWithPossibleWheelchairRoute).toBe(seed.locations.length);
    expect(report.publicLocationsConfirmedAccessible).toBe(0);
    expect(report.criticalPairs.every((pair) => pair.stairs === 0)).toBe(true);
  });
});
