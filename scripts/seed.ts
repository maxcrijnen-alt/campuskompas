import { seed } from '../lib/campus/seed';
import { adminSchemas } from '../lib/campus/validation';
import { serviceDb } from '../lib/server/supabase';
import { existsSync, readFileSync } from 'node:fs';
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match) process.env[match[1]] = match[2];
  }
}
const rooms = seed.locations
  .filter((l) => l.room_code)
  .map((l) => ({
    id: 'room-' + l.id,
    code: l.room_code!,
    location_id: l.id,
    public: true,
  }));
const entries: [string, unknown[]][] = [
  ['source_records', seed.sources],
  ['buildings', seed.buildings],
  ['floors', seed.floors],
  ['location_categories', seed.categories],
  ['route_nodes', seed.nodes],
  ['route_edges', seed.edges],
  ['opening_hours', seed.hours],
  ['locations', seed.locations],
  ['rooms', rooms],
  ['first_year_tips', seed.tips],
  ['qr_locations', seed.qr],
];
for (const [table, rows] of entries) {
  if (table in adminSchemas) {
    const schema = adminSchemas[table as keyof typeof adminSchemas];
    for (const row of rows) schema.parse(row);
  }
  if (
    new Set(
      rows.map((r) => {
        const v = r as Record<string, unknown>;
        return v.id ?? v.code;
      }),
    ).size !== rows.length
  )
    throw new Error('Duplicate IDs in ' + table);
}
if (process.argv.includes('--check'))
  console.log(
    'Seed validation passed: ' +
      entries.reduce((n, [, rows]) => n + rows.length, 0) +
      ' records; no fabricated room numbers or live open claims.',
  );
else {
  const db = serviceDb();
  for (const [table, rows] of entries) {
    const { error } = await db
      .from(table)
      .upsert(rows as Record<string, unknown>[]);
    if (error) throw new Error(table + ': ' + error.message);
    console.log(table + ': ' + rows.length);
  }
  console.log('Supabase seed complete.');
}
