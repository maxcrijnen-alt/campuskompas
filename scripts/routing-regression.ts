import { existsSync, readFileSync } from 'node:fs';
import type { Location, RouteEdge, RouteNode } from '../lib/campus/types';
import { checkRoutingRegressions } from '../lib/routing/regression';
import { serviceDb } from '../lib/server/supabase';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    if (match && process.env[match[1]] === undefined)
      process.env[match[1]] = match[2];
  }
}

async function allRows<T>(table: string): Promise<T[]> {
  const database = serviceDb();
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await database
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
const report = checkRoutingRegressions({ locations, nodes, edges });

console.log(JSON.stringify(report, null, 2));
if (report.criticalIssueCount > 0) process.exitCode = 1;
