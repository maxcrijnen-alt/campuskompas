# CampusKompas routing status

Last updated: 2026-09-09

## Completed phases

**Phase 1 — Audit & routing architecture**, **Phase 2 — Endpoint coverage & graph repair**, **Phase 3 — Search normalization & destination resolution**, and **Phase 4 — Route experience** are complete.

- Routing uses one central endpoint resolver for start and destination locations.
- From and To now use the same endpoint-validated location universe and the same search/result component.
- Stable location IDs remain canonical for shared URLs; legacy loc-* links, QR links, and valid room-code links remain compatible.
- Room search now keeps meaningful code structure, supports punctuation/spacing variants and building context, and never fuzzy-matches room-like input to a different code.
- The From/To swap action updates both state and canonical URL parameters.
- The primary map now renders routes per floor on the official plans with a solid corridor line, direction arrows, START/CONTINUE/TRANSITION/DESTINATION markers, automatic segment framing, human instructions, a complete route overview, and a conservative whole-minute walking-time estimate.
- Multi-floor and inter-building routes are split into explicit floor and transition stages. Same-floor routes remain one stage.
- Routes are drawn only from stored `map_path` geometry. A route with missing corridor geometry gets an actionable no-route state instead of a straight-line shortcut.
- `?debugRouting=1` exposes endpoint, component, node, edge, floor, and segment details in development only.
- All eight official R8/R10 floor-plan assets were regenerated as valid, unaltered WebP page renders from the documented NHL Stenden guide. The four existing assets had invalid image data and four floors were missing.
- The `route_visual_endpoints` migration directly maps iShop and Bibliotheek to their nearest traced R8 corridor endpoints. No nodes or edges were added, removed, or edited, and accessibility semantics remain unchanged.

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

## Phase 4 route-experience metrics

- Required experience routes: 9/9 available and visually complete; 0 critical issues.
- iShop → F3.025: 5 floor legs, 24 visible corridor segments, 4 transitions including the outdoor connection, ±4 minutes.
- F3.025 → iShop: 5 legs, 24 visible segments, 4 transitions, ±4 minutes.
- Bibliotheek → F3.025: 5 legs, 27 visible segments, 4 transitions, ±4 minutes.
- R8-002 → Bibliotheek: 1 leg, 6 visible segments, 0 transitions, ±1 minute.
- R8-002 → R8-301: 4 legs, 14 visible segments, 3 transitions, ±3 minutes.
- R8_MAIN ↔ R10_MAIN: 2 floor legs and 1 explicit outdoor transition; no invented outdoor polyline.
- Browser acceptance passed for iShop → F3.025 on desktop and 320 px mobile, same-floor routing, stage/floor coupling, destination state, canonical stage URLs, development debug output, and the missing-geometry no-route state.

## Verification

- Phase 4 experience plus Phase 2–3 targeted regressions: pass, 32 passed.
- Phase 4 required-pair experience audit: pass, 9/9 routes and 0 critical issues.
- pnpm search:audit: pass, 606/606 From and To, 0 critical issues.
- pnpm routing:audit: pass, 0 critical issues.
- pnpm routing:regression: pass, 606/606 endpoints, 48/48 sampled routes, 7/7 critical pairs.
- Route browser acceptance: pass, 5/5 targeted checks on desktop and mobile.
- Official-plan browser verification: pass, 8/8 floor images load at 1489 × 1489 and fit at 320 px.
- pnpm seed:check: pass, 181 records validated.
- pnpm test: pass, 80 passed and 1 live admin-write test skipped without test-account variables.
- pnpm test:e2e: pass, 10 passed and 2 admin-only tests skipped without test-account variables.
- pnpm lint: pass.
- pnpm typecheck: pass.
- pnpm build: pass.

## Next active phase

**Phase 5 — Accessibility routing**

No code blocker has been identified. Physical on-campus validation of entrances, transitions, corridor traces, destination doors, and walking-time assumptions remains operational follow-up. Accessibility routing and verified step-free connections remain reserved for Phase 5.
