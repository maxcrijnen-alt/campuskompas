import { describe, expect, it } from 'vitest';
import type { CampusData, Location } from '../lib/campus/types';
import { seed } from '../lib/campus/seed';
import {
  resolveLocationReference,
  searchLocations,
  selectableLocations,
} from '../lib/campus/search';
import { auditLocationSearch } from '../lib/campus/search-audit';
import { roomCodeIdentity } from '../lib/routing/normalization';

const room = (
  id: string,
  roomCode: string,
  buildingId: 'R8' | 'R10',
): Location => ({
  id,
  name: { nl: `Lokaal ${roomCode}`, en: `Room ${roomCode}` },
  description: { nl: '', en: '' },
  building_id: buildingId,
  floor_id: `${buildingId}-0`,
  category_id: 'room',
  room_code: roomCode,
  aliases: [roomCode.replaceAll('.', '')],
  node_id: `${buildingId}-0-centre`,
  x: 0,
  y: 0,
  status: 'approved',
  verification_status: 'needs_review',
  source_id: 'test',
});

const collisionData: CampusData = {
  ...seed,
  locations: [
    ...seed.locations,
    room('R10-C0102', 'C0.102', 'R10'),
    room('R8-C0102', 'C0.1.02', 'R8'),
  ],
};

describe('Phase 3 room-code normalization', () => {
  it.each([
    ['F3.025', 'F3:025'],
    ['F3 025', 'F3:025'],
    ['F 3 025', 'F3:025'],
    ['F3-025', 'F3:025'],
    ['0.26', '0:26'],
    ['0 26', '0:26'],
    ['C0.1.02', 'C0:1:02'],
  ])('preserves the structure of %s', (value, structured) => {
    expect(roomCodeIdentity(value).structured).toBe(structured);
  });

  it('keeps the two C0102 rooms structurally distinct', () => {
    expect(roomCodeIdentity('C0.102').structured).toBe('C0:102');
    expect(roomCodeIdentity('C0.1.02').structured).toBe('C0:1:02');
  });
});

describe('Phase 3 ambiguity-aware search and destination resolution', () => {
  it.each(['C0.102', 'C0 102', 'C0-102'])(
    'resolves the R10 spelling %s',
    (query) =>
      expect(resolveLocationReference(collisionData, query)).toMatchObject({
        status: 'resolved',
        location: { id: 'R10-C0102' },
      }),
  );

  it.each(['C0.1.02', 'C0 1 02', 'C0-1-02'])(
    'resolves the R8 spelling %s',
    (query) =>
      expect(resolveLocationReference(collisionData, query)).toMatchObject({
        status: 'resolved',
        location: { id: 'R8-C0102' },
      }),
  );

  it('returns both real rooms and refuses to resolve compact C0102 silently', () => {
    expect(
      searchLocations(collisionData, 'C0102').map((entry) => entry.id),
    ).toEqual(['R10-C0102', 'R8-C0102']);
    expect(resolveLocationReference(collisionData, 'C0102')).toMatchObject({
      status: 'ambiguous',
      location: null,
    });
  });

  it.each([
    ['R10 C0102', 'R10-C0102'],
    ['R8 C0102', 'R8-C0102'],
  ])('uses building context in %s', (query, id) => {
    expect(resolveLocationReference(collisionData, query)).toMatchObject({
      status: 'resolved',
      location: { id },
    });
  });

  it('does not fuzzy-match a different room code', () => {
    expect(searchLocations(collisionData, 'C0103')).toEqual([]);
  });

  it('retains useful natural-language aliases and typo matching', () => {
    expect(searchLocations(collisionData, 'biblioteek')[0].id).toBe('library');
    expect(searchLocations(collisionData, 'bieb')[0].id).toBe('library');
  });

  it('keeps canonical and legacy iShop links working', () => {
    expect(resolveLocationReference(collisionData, 'ishop').location?.id).toBe(
      'ishop',
    );
    expect(
      resolveLocationReference(collisionData, 'loc-ishop').location?.id,
    ).toBe('ishop');
  });
});

describe('Phase 3 From/To parity', () => {
  it('uses one endpoint-validated universe for both fields', () => {
    const universe = selectableLocations(collisionData);
    const report = auditLocationSearch(collisionData);
    expect(report.fromSelectable).toBe(universe.length);
    expect(report.toSelectable).toBe(universe.length);
    expect(report.exactIdFailures).toEqual([]);
    expect(report.collisionFailures).toEqual([]);
    expect(report.criticalIssueCount).toBe(0);
  });
});
