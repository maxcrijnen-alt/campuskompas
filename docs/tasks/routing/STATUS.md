# CampusKompas routing status

Last updated: 2026-09-09

## Completed phases

**Phase 1 — Audit & routing architecture**, **Phase 2 — Endpoint coverage & graph repair**, and **Phase 3 — Search normalization & destination resolution** are complete.

- Routing uses one central endpoint resolver for start and destination locations.
- From and To now use the same endpoint-validated location universe and the same search/result component.
- Stable location IDs remain canonical for shared URLs; legacy loc-* links, QR links, and valid room-code links remain compatible.
- Room search now keeps meaningful code structure, supports punctuation/spacing variants and building context, and never fuzzy-matches room-like input to a different code.
- The From/To swap action updates both state and canonical URL parameters.
- No routinggraph, accessibility, schema, or production-data changes were made in Phase 3.

## Verified production metrics

- 606 approved locations and 576 public rooms.
- From selectable: 606/606; To selectable: 606/606; exact-ID resolution: 606/606.
- 514 route nodes and 535 route edges in one connected component.
- 606 direct endpoint mappings; 0 inferred; 0 needs_review; 0 unavailable.
- 100% routing endpoint coverage; 0 graph or endpoint audit failures.

## Phase 3 resolution behavior

- C0.102 resolves uniquely to R10 location R10-C0102.
- C0.1.02 resolves uniquely to R8 location R8-C0102.
- Compact C0102 returns both real rooms and remains explicitly ambiguous.
- R10 C0102 and R8 C0102 resolve uniquely using building context.
- Natural-language aliases and tolerant typo search remain supported.
- Browser verification passed for full From search, result metadata, swapping, canonical URL state, structured deep links, and the ambiguous-code notice; no page or console errors were found.

## Verification

- Phase 3 targeted normalization/search plus Phase 1–2 routing tests: pass, 70 passed.
- pnpm search:audit: pass, 606/606 From and To, 0 critical issues.
- pnpm routing:audit: pass, 0 critical issues.
- pnpm routing:regression: pass, 606/606 endpoints, 48/48 sampled routes, 7/7 critical pairs.
- Targeted Phase 3 browser tests: pass, including full From/To selection and swap.
- pnpm seed:check: pass, 181 records validated.
- pnpm test: pass, 73 passed and 1 live test skipped without test-account variables.
- pnpm lint: pass.
- pnpm typecheck: pass.
- pnpm build: pass.

## Next active phase

**Phase 4 — Route experience**

No code blocker has been identified. Wait for the user's additional Phase 4 information before starting it. Accessibility behavior remains reserved for its later dedicated phase.
