import { existsSync, readFileSync } from 'node:fs';
import type { Location, RouteEdge, RouteNode } from '../lib/campus/types';
import { auditAccessibility } from '../lib/routing/accessibility-audit';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match && process.env[match[1]] === undefined)
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const { serviceDb } = await import('../lib/server/supabase');

async function allRows<T>(table: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await serviceDb()
      .from(table)
      .select('*')
      .range(offset, offset + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if ((data?.length ?? 0) < 500) return rows;
  }
}

const [locations, nodes, edges] = await Promise.all([
  allRows<Location>('locations'),
  allRows<RouteNode>('route_nodes'),
  allRows<RouteEdge>('route_edges'),
]);
const report = auditAccessibility({ locations, nodes, edges });
console.log(JSON.stringify(report, null, 2));
if (report.errorCount > 0) process.exitCode = 1;
