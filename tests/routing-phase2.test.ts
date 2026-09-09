import { describe, expect, it } from 'vitest';
import { seed } from '../lib/campus/seed';
import { createRouteEndpointResolver } from '../lib/routing/endpoints';
import {
  checkRoutingRegressions,
  type CriticalRoutePair,
} from '../lib/routing/regression';

const removedLegacyEntries = [
  'R8-1-entry',
  'R8-2-entry',
  'R8-3-entry',
  'R10-1-entry',
  'R10-2-entry',
  'R10-3-entry',
];

const seedCriticalPairs: CriticalRoutePair[] = [
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
    id: 'inter-building-reverse',
    from: 'F3025',
    to: 'library',
    expectsOutdoor: true,
    minimumTransitions: 3,
  },
  { id: 'same-floor', from: 'ishop', to: 'library' },
  {
    id: 'r10-entrance-to-high-floor',
    from: 'R10_MAIN',
    to: 'F3025',
    minimumTransitions: 3,
  },
];

describe('Phase 2 routing regression coverage', () => {
  it('keeps every approved seed location directly mapped in the main component', () => {
    const report = checkRoutingRegressions(seed, seedCriticalPairs);
    expect(report.allLocationChecks).toBe(seed.locations.length);
    expect(report.endpointCoveragePercent).toBe(100);
    expect(report.allLocationFailures).toEqual([]);
    expect(report.sampledRouteFailures).toEqual([]);
  });

  it('routes every critical normal pair and keeps wheelchair candidates stair-free', () => {
    const report = checkRoutingRegressions(seed, seedCriticalPairs);
    expect(report.criticalPairFailures).toEqual([]);
    expect(report.criticalPairResults).toHaveLength(seedCriticalPairs.length);
    expect(
      report.criticalPairResults.every(
        (result) =>
          result.normal === 'available' &&
          result.accessible === 'available-with-unknowns',
      ),
    ).toBe(true);
  });

  it('preserves the old iShop node deep link without inferred routing', () => {
    const resolver = createRouteEndpointResolver(seed);
    expect(resolver.resolveReference('loc-ishop')).toMatchObject({
      nodeId: 'loc-ishop',
      resolutionType: 'direct',
      failure: null,
    });
    expect(resolver.resolveLocation('ishop')).toMatchObject({
      nodeId: 'loc-ishop',
      resolutionType: 'direct',
      failure: null,
    });
  });

  it('does not regenerate isolated entry nodes above the ground floor', () => {
    expect(
      seed.nodes.filter((node) => removedLegacyEntries.includes(node.id)),
    ).toEqual([]);
  });
});
