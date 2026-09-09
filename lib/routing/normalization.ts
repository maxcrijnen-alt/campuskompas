export function normalizeRoomCode(value: string): string {
  return value
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\s.\-_]/g, '');
}

export type RoomCodeIdentity = {
  buildingId: 'R8' | 'R10' | null;
  compact: string;
  structured: string | null;
  isRoomLike: boolean;
};

/**
 * Keeps meaningful room-code separators for exact matching while also
 * providing a compact token for punctuation-tolerant, ambiguity-aware search.
 */
export function roomCodeIdentity(value: string): RoomCodeIdentity {
  let input = value.normalize('NFKC').trim().toUpperCase();
  const building = /^(R8|R10)(?:\s+|\s*[:/,-]\s*)/.exec(input);
  const buildingId = (building?.[1] as RoomCodeIdentity['buildingId']) ?? null;
  if (building) input = input.slice(building[0].length);

  const rawParts = input.split(/[\s.\-_/]+/).filter(Boolean);
  const parts = rawParts.map((part) => part.replace(/[^A-Z0-9]/g, ''));
  if (parts.length >= 2 && /^[A-Z]$/.test(parts[0]) && /^\d$/.test(parts[1]))
    parts.splice(0, 2, parts[0] + parts[1]);
  const compact = parts.join('');
  const isRoomLike = /\d/.test(compact) && /^[A-Z0-9]+$/.test(compact);
  return {
    buildingId,
    compact,
    structured:
      isRoomLike && rawParts.length > 1 && parts.length > 1
        ? parts.join(':')
        : null,
    isRoomLike,
  };
}
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
export function parseRoomCode(value: string): {
  canonical: string;
  zone: string | null;
  floor: number;
  room: string;
} | null {
  const code = normalizeRoomCode(value);
  const m = /^([A-Z])([0-9])([0-9]{3})$/.exec(code);
  if (m)
    return { canonical: code, zone: m[1], floor: Number(m[2]), room: m[3] };
  const r = /^([0-9])([0-9]{2,3})$/.exec(code);
  return r
    ? { canonical: code, zone: null, floor: Number(r[1]), room: r[2] }
    : null;
}
