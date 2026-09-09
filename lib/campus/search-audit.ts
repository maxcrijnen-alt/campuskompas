import type { CampusData } from './types';
import {
  resolveLocationReference,
  searchLocations,
  selectableLocations,
} from './search';

const collisionExpectations = [
  ['C0.102', 'resolved', 'R10-C0102'],
  ['C0.1.02', 'resolved', 'R8-C0102'],
  ['C0102', 'ambiguous', null],
  ['R10 C0102', 'resolved', 'R10-C0102'],
  ['R8 C0102', 'resolved', 'R8-C0102'],
] as const;

export function auditLocationSearch(data: CampusData) {
  const universe = selectableLocations(data);
  const exactIdFailures = universe
    .filter((location) => {
      const resolution = resolveLocationReference(data, location.id);
      return (
        resolution.status !== 'resolved' ||
        resolution.location?.id !== location.id
      );
    })
    .map((location) => location.id);
  const collisionResults = collisionExpectations.map(
    ([query, expectedStatus, expectedId]) => {
      const resolution = resolveLocationReference(data, query);
      const resultIds = searchLocations(data, query).map(
        (location) => location.id,
      );
      const passed =
        resolution.status === expectedStatus &&
        (resolution.location?.id ?? null) === expectedId &&
        (query !== 'C0102' ||
          ['R10-C0102', 'R8-C0102'].every((id) => resultIds.includes(id)));
      return {
        query,
        status: resolution.status,
        locationId: resolution.location?.id ?? null,
        candidateIds: resolution.candidates.map((location) => location.id),
        passed,
      };
    },
  );
  const collisionFailures = collisionResults
    .filter((result) => !result.passed)
    .map((result) => result.query);
  return {
    locationUniverse: universe.length,
    fromSelectable: universe.length,
    toSelectable: universe.length,
    exactIdChecks: universe.length,
    exactIdFailures,
    collisionResults,
    collisionFailures,
    criticalIssueCount: exactIdFailures.length + collisionFailures.length,
  };
}
