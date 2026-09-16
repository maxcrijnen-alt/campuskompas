import { describe, expect, it } from 'vitest';
import { preserveAdminVerification } from '@/lib/server/admin-verification';

describe('administrator verification', () => {
  it.each(['source_records', 'floors', 'locations'] as const)(
    'preserves explicit verification for %s',
    (table) => {
      expect(
        preserveAdminVerification(table, {
          verification_status: 'unverified',
        }),
      ).toMatchObject({ verification_status: 'unverified' });
    },
  );

  it.each(['route_nodes', 'route_edges'] as const)(
    'does not silently verify physical or accessibility data for %s',
    (table) => {
      expect(
        preserveAdminVerification(table, {
          accessible: false,
          accessibility_status: 'unverified',
          verification_status: 'needs_review',
        }),
      ).toMatchObject({
        accessible: false,
        accessibility_status: 'unverified',
        verification_status: 'needs_review',
      });
    },
  );

  it('does not refresh a source verification date without explicit confirmation', () => {
    expect(
      preserveAdminVerification('source_records', {
        verified_at: '2020-01-01',
        verification_status: 'unverified',
      }),
    ).toMatchObject({
      verified_at: '2020-01-01',
      verification_status: 'unverified',
    });
  });

  it('does not add verification fields to unrelated admin records', () => {
    expect(preserveAdminVerification('rooms', { id: 'room' })).toEqual({
      id: 'room',
    });
  });
});
