import { existsSync, readFileSync } from 'node:fs';
import type {
  Building,
  Category,
  Floor,
  Gem,
  Hours,
  Location,
  RouteEdge,
  RouteNode,
  Source,
  Verification,
} from '../lib/campus/types';
import { adminSchemas } from '../lib/campus/validation';
import { roomCodeIdentity } from '../lib/routing/normalization';
import { serviceDb } from '../lib/server/supabase';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match && process.env[match[1]] === undefined)
      process.env[match[1]] = match[2];
  }
}

type Room = { id: string; code: string; location_id: string; public: boolean };
type HoursException = {
  id: string;
  opening_hours_id: string;
  date: string;
};
const database = serviceDb();

async function allRows<T>(table: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await database
      .from(table)
      .select('*')
      .order('id')
      .range(offset, offset + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if ((data?.length ?? 0) < 500) return rows;
  }
}

function duplicateIds(rows: { id: string }[]) {
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    if (seen.has(row.id)) return [row.id];
    seen.add(row.id);
    return [];
  });
}

function isVerification(value: string): value is Verification {
  return ['verified', 'needs_review', 'unverified'].includes(value);
}

const buildings = await allRows<Building>('buildings');
const floors = await allRows<Floor>('floors');
const categories = await allRows<Category>('location_categories');
const sources = await allRows<Source>('source_records');
const hours = await allRows<Hours>('opening_hours');
const nodes = await allRows<RouteNode>('route_nodes');
const edges = await allRows<RouteEdge>('route_edges');
const locations = await allRows<Location>('locations');
const rooms = await allRows<Room>('rooms');
const gems = await allRows<Gem>('hidden_gems');
const exceptions = await allRows<HoursException>('opening_hour_exceptions');

const buildingIds = new Set(buildings.map((row) => row.id));
const floorById = new Map(floors.map((row) => [row.id, row]));
const categoryIds = new Set(categories.map((row) => row.id));
const sourceIds = new Set(sources.map((row) => row.id));
const hoursIds = new Set(hours.map((row) => row.id));
const nodeById = new Map(nodes.map((row) => [row.id, row]));
const locationIds = new Set(locations.map((row) => row.id));

const failures = {
  duplicateIds: [
    ...duplicateIds(buildings).map((id) => `buildings:${id}`),
    ...duplicateIds(floors).map((id) => `floors:${id}`),
    ...duplicateIds(categories).map((id) => `categories:${id}`),
    ...duplicateIds(sources).map((id) => `sources:${id}`),
    ...duplicateIds(hours).map((id) => `hours:${id}`),
    ...duplicateIds(nodes).map((id) => `nodes:${id}`),
    ...duplicateIds(edges).map((id) => `edges:${id}`),
    ...duplicateIds(locations).map((id) => `locations:${id}`),
    ...duplicateIds(rooms).map((id) => `rooms:${id}`),
    ...duplicateIds(gems).map((id) => `gems:${id}`),
    ...duplicateIds(exceptions).map((id) => `exceptions:${id}`),
  ],
  orphanFloors: floors
    .filter((row) => !buildingIds.has(row.building_id))
    .map((row) => row.id),
  invalidNodes: nodes
    .filter((row) => {
      const floor = floorById.get(row.floor_id);
      return (
        !floor ||
        !buildingIds.has(row.building_id) ||
        floor.building_id !== row.building_id ||
        row.x < 0 ||
        row.x > 800 ||
        row.y < 0 ||
        row.y > 600 ||
        !isVerification(row.verification_status) ||
        !isVerification(row.accessibility_status)
      );
    })
    .map((row) => row.id),
  invalidEdges: edges
    .filter((row) => {
      const from = nodeById.get(row.from_node_id);
      const to = nodeById.get(row.to_node_id);
      return (
        !from ||
        !to ||
        from.id === to.id ||
        !(row.weight > 0) ||
        !['corridor', 'stairs', 'elevator', 'outdoor'].includes(
          row.edge_type,
        ) ||
        (row.edge_type === 'stairs' && row.accessible) ||
        !isVerification(row.verification_status) ||
        !isVerification(row.accessibility_status)
      );
    })
    .map((row) => row.id),
  invalidLocations: locations
    .filter((row) => {
      const floor = floorById.get(row.floor_id);
      const node = row.node_id ? nodeById.get(row.node_id) : null;
      return (
        !buildingIds.has(row.building_id) ||
        !floor ||
        floor.building_id !== row.building_id ||
        !categoryIds.has(row.category_id) ||
        !sourceIds.has(row.source_id) ||
        (row.hours_id != null && !hoursIds.has(row.hours_id)) ||
        (row.node_id != null && !node) ||
        (node != null &&
          (node.floor_id !== row.floor_id ||
            node.building_id !== row.building_id)) ||
        !['pending', 'approved', 'archived'].includes(row.status) ||
        !isVerification(row.verification_status) ||
        !['direct', 'inferred', 'needs_review', 'unavailable'].includes(
          row.routing_status ?? '',
        ) ||
        (row.routing_status === 'direct' &&
          (!row.node_id ||
            !['existing_mapping', 'manual'].includes(
              row.endpoint_source ?? '',
            ))) ||
        row.x < 0 ||
        row.x > 800 ||
        row.y < 0 ||
        row.y > 600
      );
    })
    .map((row) => row.id),
  orphanRooms: rooms
    .filter((row) => !locationIds.has(row.location_id))
    .map((row) => row.id),
  invalidGems: gems
    .filter(
      (row) =>
        (row.location_id != null && !locationIds.has(row.location_id)) ||
        (row.hours_id != null && !hoursIds.has(row.hours_id)) ||
        (row.location_id == null && !row.proposed_location_name?.trim()) ||
        (row.location_id != null && Boolean(row.proposed_location_name)) ||
        !['pending', 'approved', 'rejected', 'archived'].includes(row.status) ||
        ![
          'linked',
          'proposed',
          'needs_review',
          'approved',
          'rejected',
        ].includes(row.location_review_status ?? ''),
    )
    .map((row) => row.id),
  invalidHours: hours
    .filter((row) => !adminSchemas.opening_hours.safeParse(row).success)
    .map((row) => row.id),
  orphanHourExceptions: exceptions
    .filter((row) => !hoursIds.has(row.opening_hours_id))
    .map((row) => row.id),
  duplicateRoomNamespaces: [] as string[],
};

const roomNamespaces = new Map<string, string>();
for (const location of locations.filter((row) => row.room_code)) {
  const identity = roomCodeIdentity(location.room_code!);
  const key = `${location.building_id}:${identity.structured ?? identity.compact}`;
  const existing = roomNamespaces.get(key);
  if (existing && existing !== location.id)
    failures.duplicateRoomNamespaces.push(`${key}:${existing},${location.id}`);
  else roomNamespaces.set(key, location.id);
}

const failureCount = Object.values(failures).reduce(
  (total, values) => total + values.length,
  0,
);
const report = {
  counts: {
    buildings: buildings.length,
    floors: floors.length,
    categories: categories.length,
    sources: sources.length,
    hours: hours.length,
    nodes: nodes.length,
    edges: edges.length,
    locations: locations.length,
    approvedLocations: locations.filter((row) => row.status === 'approved')
      .length,
    rooms: rooms.length,
    publicRooms: rooms.filter((row) => row.public).length,
    hiddenGems: gems.length,
    hourExceptions: exceptions.length,
  },
  failures,
  criticalIssueCount: failureCount,
};

console.log(JSON.stringify(report, null, 2));
if (failureCount > 0) process.exitCode = 1;
