# CampusKompas routing status

Last updated: 2026-09-09

## Completed phases

**Phase 1 — Audit & routing architecture** and **Phase 2 — Endpoint coverage & graph repair** are complete.

- Routing uses one central endpoint resolver for start and destination locations.
- All approved locations retain validated direct mappings; no inferred or fuzzy routing was introduced.
- The six unused upper-floor legacy entry nodes were confirmed to have no location, QR, or edge references and were removed through a guarded migration.
- The seed graph now creates entrance nodes only on the ground floor, so a later seed cannot recreate the removed nodes.
- `pnpm routing:audit` verifies endpoint and graph health against Supabase and exits non-zero on critical failures.
- `pnpm routing:regression` checks every approved endpoint, deterministic route samples, and the Phase 2 critical route pairs against Supabase.

## Verified production metrics

- 606 approved locations and 576 public rooms.
- 514 route nodes and 535 route edges.
- 606 direct endpoint mappings; 0 inferred; 0 `needs_review`; 0 unavailable.
- 100% endpoint coverage; 0 invalid node references, floor/building mismatches, invalid edges, or locations outside the main component.
- 1 connected component of 514 nodes; 0 isolated nodes and 0 nodes unreachable in either direction within the component.
- Migration `remove_isolated_legacy_entry_nodes` is applied in Supabase; local file: `20260909162718_remove_isolated_legacy_entry_nodes.sql`.

## Phase 2 regressions

- All-location check: 606/606 passed.
- Deterministic route sample: 48/48 passed.
- Critical normal routes: 7/7 passed, including iShop → F3.025, library → F3.025, both buildings, both directions, entrances to high floors, same-floor, and multi-floor routes.
- iShop → F3.025 uses the outdoor connection and has four floor/building transitions.
- Accessible mode was checked for all seven critical pairs. All seven correctly remain unavailable because the graph's accessibility evidence is unverified; no accessible route is claimed and no stair edge is accepted.
- The legacy `loc-ishop` node reference still resolves directly.

## Verification

- Targeted routing tests: pass, 49 passed.
- `pnpm routing:audit`: pass, 0 critical issues.
- `pnpm routing:regression`: pass, 0 critical issues.
- `pnpm seed:check`: pass, 181 records validated.
- `pnpm test`: pass, 52 passed and 1 live test skipped without test-account variables.
- `pnpm lint`: pass.
- `pnpm typecheck`: pass.
- `pnpm build`: pass.

## Next active phase

**Phase 3 — Search normalization & destination resolution**

No blocking dependency. Phase 3 still needs to resolve the known canonical room-code collision where R10 `C0.102` and R8 `C0.1.02` both normalize to `C0102`. Accessibility verification remains for its later dedicated phase.
