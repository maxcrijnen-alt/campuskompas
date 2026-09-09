import type { CampusData, Location } from './types';
import { normalizeSearch } from '../routing/normalization';
function editDistance(a: string, b: string) {
  if(Math.abs(a.length-b.length)>2)return 99;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = old;
    }
  }
  return row[b.length];
}
const indexes=new WeakMap<CampusData,{l:Location;candidates:string[]}[]>();
export function searchLocations(data: CampusData, query: string): Location[] {
  const q = normalizeSearch(query.slice(0,100));
  if (!q) return [];
  let index=indexes.get(data);
  if(!index){index=data.locations.map((l) => {
      const category = data.categories.find((c) => c.id === l.category_id);
      const candidates = [
        l.id,
        l.name.nl,
        l.name.en,
        l.room_code ?? '',
        ...l.aliases,
        ...(category?.aliases ?? []),
        category?.name.nl??'',category?.name.en??'',
      ]
        .map(normalizeSearch)
        .filter(Boolean);
      return {l,candidates};
    });indexes.set(data,index);}
  return index.map(({l,candidates})=>({l,
        score: Math.min(
          ...candidates.map((c) =>
            c === q
              ? 0
              : c.includes(q)
                ? 1
                : q.length >= 4 && editDistance(c, q) <= 2
                  ? 2
                  : 99,
          ),
        ),
      }))
    .filter((r) => r.score < 99)
    .sort((a, b) => a.score - b.score)
    .map((r) => r.l);
}
