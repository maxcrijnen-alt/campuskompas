import type { AdminTable } from '@/lib/campus/validation';

/**
 * Generic saves preserve verification fields exactly as the administrator
 * submitted them. Physical, topological and accessibility facts may only be
 * marked verified through an explicit status change in the record editor.
 */
export function preserveAdminVerification(
  _table: AdminTable,
  record: Record<string, unknown>,
) {
  return record;
}
