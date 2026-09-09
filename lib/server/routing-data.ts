import type { SupabaseClient } from '@supabase/supabase-js';
import type { Location, RouteEdge, RouteNode } from '../campus/types';
import { createRouteEndpointResolver } from '../routing/endpoints';

export async function allRows<T>(db: SupabaseClient, table: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from(table).select('*').range(offset, offset + 499);
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if ((data?.length ?? 0) < 500) return rows;
  }
}

export async function loadRoutingData(db: SupabaseClient) {
  const [locations, nodes, edges] = await Promise.all([
    allRows<Location>(db, 'locations'),
    allRows<RouteNode>(db, 'route_nodes'),
    allRows<RouteEdge>(db, 'route_edges'),
  ]);
  return { locations, nodes, edges };
}

export async function validateCanonicalLocation(
  db: SupabaseClient,
  locationId: string,
) {
  const data = await loadRoutingData(db);
  const location = data.locations.find((entry) => entry.id === locationId);
  if (!location || location.status !== 'approved') return null;
  const endpoint = createRouteEndpointResolver(data).resolveLocation(location);
  return endpoint.nodeId ? { location, endpoint } : null;
}
