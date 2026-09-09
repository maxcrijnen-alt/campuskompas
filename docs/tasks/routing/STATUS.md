# CampusKompas routing status

Last updated: 2026-09-09

## Completed phase

**Phase 1 — Audit & routing architecture** is complete.

- Production data was audited directly against Supabase project `campuskompas`.
- Routing now uses one central endpoint resolver for start and destination locations.
- Direct mappings are accepted only when the node exists, matches the location floor/building, belongs to the main component, and can reach and be reached from that component.
- A reusable `pnpm routing:audit` command reports graph and endpoint health and exits non-zero for critical endpoint or graph errors.
- No database migration was needed: Phase 1 introduced no structural database change and the required foreign keys and indexes already exist.

## Verified production baseline

- 606 locations; all 606 approved.
- 576 rooms; all 576 public and linked to a location.
- 520 route nodes and 535 route edges.
- 606 direct endpoint mappings; 0 inferred; 0 `needs_review`; 0 unavailable.
- 100% routing endpoint coverage for approved locations and public rooms.
- 0 invalid node references, floor/building mismatches, invalid edges, or public locations outside the main component.
- 7 weakly connected components: `[514, 1, 1, 1, 1, 1, 1]`.
- The six isolated nodes are unused legacy seed entries: `R8-1-entry`, `R8-2-entry`, `R8-3-entry`, `R10-1-entry`, `R10-2-entry`, and `R10-3-entry`.
- All 535 edges are bidirectional, so all 514 nodes in the main component have two-way reachability.
- iShop (`0.26`) resolves directly to `loc-ishop`; F3.025 resolves directly to `plan-R10-3-29_96-47_066`.
- One canonical room-code collision remains for Phase 3: R10 `C0.102` and R8 `C0.1.02` both normalize to `C0102`.

## Verification

- `pnpm routing:audit`: pass, 0 critical issues.
- Targeted endpoint/graph tests: pass, 9 passed.
- `pnpm test`: pass, 48 passed and 1 live test skipped without test-account variables.
- `pnpm lint`: pass.
- `pnpm typecheck`: pass.
- `pnpm build`: pass.

## Next active phase

**Phase 2 — Endpoint coverage & graph repair**

No blocking dependency. Phase 2 should classify and remove or archive the six unused isolated entry nodes through a migration, then add the required all-location and critical-pair regression checks without changing the verified 100% endpoint coverage.
