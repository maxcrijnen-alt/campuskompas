import type { CampusData, Location } from './types';
import { createRouteEndpointResolver } from '../routing/endpoints';
import {
  normalizeSearch,
  roomCodeIdentity,
  type RoomCodeIdentity,
} from '../routing/normalization';

export type LocationSearchMatch = {
  location: Location;
  score: number;
  matchType:
    | 'exact'
    | 'room-structured'
    | 'room-compact'
    | 'contains'
    | 'fuzzy';
};

export type LocationReferenceResolution = {
  status: 'resolved' | 'ambiguous' | 'not-found';
  location: Location | null;
  candidates: Location[];
};

type IndexedLocation = {
  location: Location;
  room: RoomCodeIdentity | null;
  textCandidates: string[];
};

function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let index = 1; index <= a.length; index += 1) {
    let previous = row[0];
    row[0] = index;
    for (
      let candidateIndex = 1;
      candidateIndex <= b.length;
      candidateIndex += 1
    ) {
      const old = row[candidateIndex];
      row[candidateIndex] = Math.min(
        row[candidateIndex] + 1,
        row[candidateIndex - 1] + 1,
        previous + (a[index - 1] === b[candidateIndex - 1] ? 0 : 1),
      );
      previous = old;
    }
  }
  return row[b.length];
}

const universeCache = new WeakMap<CampusData, Location[]>();
const indexCache = new WeakMap<CampusData, IndexedLocation[]>();

export function selectableLocations(data: CampusData): Location[] {
  let universe = universeCache.get(data);
  if (!universe) {
    const resolver = createRouteEndpointResolver(data);
    universe = data.locations.filter(
      (location) =>
        location.status === 'approved' &&
        resolver.resolveLocation(location).nodeId !== null,
    );
    universeCache.set(data, universe);
  }
  return universe;
}

function searchIndex(data: CampusData) {
  let index = indexCache.get(data);
  if (index) return index;
  index = selectableLocations(data).map((location) => {
    const category = data.categories.find(
      (entry) => entry.id === location.category_id,
    );
    const nonRoomAliases = location.aliases.filter(
      (alias) => !roomCodeIdentity(alias).isRoomLike,
    );
    return {
      location,
      room: location.room_code ? roomCodeIdentity(location.room_code) : null,
      textCandidates: [
        location.id,
        location.name.nl,
        location.name.en,
        ...nonRoomAliases,
        ...(category?.aliases ?? []),
        category?.name.nl ?? '',
        category?.name.en ?? '',
      ]
        .map(normalizeSearch)
        .filter(Boolean),
    };
  });
  indexCache.set(data, index);
  return index;
}

function roomMatchScore(
  query: RoomCodeIdentity,
  indexed: IndexedLocation,
): Pick<LocationSearchMatch, 'score' | 'matchType'> | null {
  if (!query.isRoomLike || !indexed.room) return null;
  if (query.buildingId && indexed.location.building_id !== query.buildingId)
    return null;
  if (query.structured && indexed.room.structured === query.structured)
    return { score: 0, matchType: 'room-structured' };
  if (!query.structured && indexed.room.compact === query.compact)
    return { score: 1, matchType: 'room-compact' };
  return null;
}

export function searchLocationMatches(
  data: CampusData,
  query: string,
): LocationSearchMatch[] {
  const boundedQuery = query.slice(0, 100);
  const normalizedQuery = normalizeSearch(boundedQuery);
  if (!normalizedQuery) return [];
  const roomQuery = roomCodeIdentity(boundedQuery);

  return searchIndex(data)
    .map((indexed): LocationSearchMatch | null => {
      const roomMatch = roomMatchScore(roomQuery, indexed);
      const textScore = Math.min(
        ...indexed.textCandidates.map((candidate) =>
          candidate === normalizedQuery
            ? 0
            : candidate.includes(normalizedQuery)
              ? 2
              : !roomQuery.isRoomLike &&
                  normalizedQuery.length >= 4 &&
                  editDistance(candidate, normalizedQuery) <= 2
                ? 3
                : 99,
        ),
      );
      if (roomQuery.isRoomLike && indexed.room && !roomMatch && textScore !== 0)
        return null;
      if (roomMatch && roomMatch.score <= textScore)
        return { location: indexed.location, ...roomMatch };
      if (textScore === 99) return null;
      return {
        location: indexed.location,
        score: textScore,
        matchType:
          textScore === 0 ? 'exact' : textScore === 2 ? 'contains' : 'fuzzy',
      };
    })
    .filter((match): match is LocationSearchMatch => match !== null)
    .sort(
      (left, right) =>
        left.score - right.score ||
        left.location.building_id.localeCompare(right.location.building_id) ||
        (left.location.room_code ?? left.location.name.nl).localeCompare(
          right.location.room_code ?? right.location.name.nl,
          undefined,
          { numeric: true },
        ) ||
        left.location.id.localeCompare(right.location.id),
    );
}

export function searchLocations(data: CampusData, query: string): Location[] {
  return searchLocationMatches(data, query).map((match) => match.location);
}

export function resolveLocationReference(
  data: CampusData,
  reference: string,
): LocationReferenceResolution {
  const universe = selectableLocations(data);
  const normalizedReference = normalizeSearch(reference);
  const exactId = universe.filter(
    (location) => normalizeSearch(location.id) === normalizedReference,
  );
  if (exactId.length === 1)
    return { status: 'resolved', location: exactId[0], candidates: exactId };

  const legacyReference = reference.replace(/^loc-/i, '');
  if (legacyReference !== reference) {
    const legacy = universe.filter(
      (location) =>
        normalizeSearch(location.id) === normalizeSearch(legacyReference),
    );
    if (legacy.length === 1)
      return { status: 'resolved', location: legacy[0], candidates: legacy };
  }

  const matches = searchLocationMatches(data, reference).filter(
    (match) => match.score <= 1,
  );
  const candidates = matches.map((match) => match.location);
  if (candidates.length === 1)
    return { status: 'resolved', location: candidates[0], candidates };
  if (candidates.length > 1)
    return { status: 'ambiguous', location: null, candidates };
  return { status: 'not-found', location: null, candidates: [] };
}
