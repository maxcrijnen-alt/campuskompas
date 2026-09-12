import type { AdminTable } from '@/lib/campus/validation';

const verifiedTables = new Set<AdminTable>([
  'source_records',
  'floors',
  'locations',
  'route_nodes',
  'route_edges',
]);

const accessibilityTables = new Set<AdminTable>(['route_nodes', 'route_edges']);

export function confirmAdminRecord(
  table: AdminTable,
  record: Record<string, unknown>,
  verifiedAt = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Amsterdam',
  }),
) {
  if (!verifiedTables.has(table)) return record;

  return {
    ...record,
    verification_status: 'verified',
    ...(accessibilityTables.has(table)
      ? { accessibility_status: 'verified' }
      : {}),
    ...(table === 'source_records' ? { verified_at: verifiedAt } : {}),
  };
}
