export function normalizeRoomCode(value: string): string {
  return value
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\s.\-_]/g, '');
}
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
export function parseRoomCode(
  value: string,
): {
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
