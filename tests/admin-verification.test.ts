import { describe, expect, it } from 'vitest';
import { confirmAdminRecord } from '@/lib/server/admin-verification';

describe('administrator verification', () => {
  it.each(['source_records', 'floors', 'locations'] as const)(
    'confirms %s records saved by an administrator',
    (table) => {
      expect(
        confirmAdminRecord(table, { verification_status: 'unverified' }),
      ).toMatchObject({ verification_status: 'verified' });
    },
  );

  it.each(['route_nodes', 'route_edges'] as const)(
    'confirms general and accessibility data for %s',
    (table) => {
      expect(
        confirmAdminRecord(table, {
          accessible: false,
          accessibility_status: 'unverified',
          verification_status: 'needs_review',
        }),
      ).toMatchObject({
        accessible: false,
        accessibility_status: 'verified',
        verification_status: 'verified',
      });
    },
  );

  it('refreshes a source verification date in Amsterdam', () => {
    expect(
      confirmAdminRecord(
        'source_records',
        { verified_at: '2020-01-01', verification_status: 'unverified' },
        '2026-09-12',
      ),
    ).toMatchObject({
      verified_at: '2026-09-12',
      verification_status: 'verified',
    });
  });

  it('does not add verification fields to unrelated admin records', () => {
    expect(confirmAdminRecord('rooms', { id: 'room' })).toEqual({ id: 'room' });
  });
});
