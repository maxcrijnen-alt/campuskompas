import { requireAdmin } from '@/lib/server/supabase';
import { failure, json } from '@/lib/server/http';
import { allRows, loadRoutingData } from '@/lib/server/routing-data';
import { auditRoutingData, type RoomRouteRecord } from '@/lib/routing/audit';
import { auditAccessibility } from '@/lib/routing/accessibility-audit';
import { createRouteEndpointResolver } from '@/lib/routing/endpoints';
import type { Gem } from '@/lib/campus/types';

export async function GET(request: Request) {
  try {
    const { db } = await requireAdmin(request);
    const [routing, rooms, gems] = await Promise.all([
      loadRoutingData(db),
      allRows<RoomRouteRecord>(db, 'rooms'),
      allRows<Gem>(db, 'hidden_gems'),
    ]);
    const resolver = createRouteEndpointResolver(routing);
    const invalidGemLinks = gems.filter(
      (gem) =>
        gem.location_id &&
        resolver.resolveLocation(gem.location_id).nodeId === null,
    ).length;
    return json({
      routing: auditRoutingData({ ...routing, rooms }),
      accessibility: auditAccessibility(routing),
      gems: {
        total: gems.length,
        proposed: gems.filter((gem) => !gem.location_id).length,
        needsReview: gems.filter(
          (gem) => gem.location_review_status === 'needs_review' || gem.location_review_status === 'proposed',
        ).length,
        invalidLinks: invalidGemLinks,
      },
    });
  } catch (error) {
    return failure(error);
  }
}
