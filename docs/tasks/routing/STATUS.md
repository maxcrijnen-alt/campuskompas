# CampusKompas routing status

Last updated: 2026-09-10

## Completed phases

**Phase 1 — Audit & routing architecture**, **Phase 2 — Endpoint coverage & graph repair**, **Phase 3 — Search normalization & destination resolution**, **Phase 4 — Route experience**, **Phase 5 — Accessibility, admin & Hidden Gems / BRÛZE**, and **Phase 5.5 — Visual polish, operational data & opening hours** are complete.

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
- Accessibility now has explicit `accessible`, `inaccessible`, and `unknown` semantics. Wheelchair routing always excludes stairs and confirmed inaccessible records, may use unknown records, and never describes an unknown route as confirmed.
- Hidden Gem submissions can select the central routeable location universe or propose a place without creating a location or route endpoint. Only a valid canonical link enables map and route actions.
- Admin now exposes stored routing status, endpoint source, same-floor endpoint selection, location verification controls, gem-location linking, and a live routing/accessibility health summary.
- The visual system now uses shared color, spacing, radius, shadow, focus, button, card, badge, route, and accessibility tokens. From/To, route stages, details, Hidden Gems, empty states, and the changed admin screens use the same hierarchy on mobile and desktop.
- Opening hours use one Europe/Amsterdam-aware engine for regular schedules, date-specific exceptions, multiple periods, closed days, next opening, and conservative verification labels.

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

## Phase 5 accessibility and moderation metrics

- Accessibility data state: 514/514 nodes unknown; 535/535 edges unknown; 0 confirmed accessible and 0 confirmed inaccessible. Unknown values are verification work and do not count as audit errors.
- Edge inventory: 515 corridors, 9 elevators, 9 stairs, and 2 outdoor edges. All are currently unverified; stairs are nevertheless always excluded from wheelchair routing.
- Stair-free candidate graph: 514 nodes, 526 non-stair edges, 4 components, largest component 237 nodes.
- 305/606 approved locations are connected to the main stair-free candidate component; 301/606 are outside it. Confirmed accessible locations: 0/606. Physical verification required: 305 candidate locations plus the 301 locations lacking a connected candidate path.
- R8_MAIN → R8-301 and R8-002 → R8-301 work as stair-free candidates with unknown-data warnings. R10_MAIN → F3.025 and iShop → F3.025 correctly return no wheelchair route because the stored graph has no non-stair connection from the relevant R10 plan corridors to the existing lift chain.
- Normal routing remains 606/606 direct endpoints, one 514-node component, and 100% endpoint coverage.
- The approved Bruze gem remains published, but its inaccurate `R10_MAIN` link was removed. Current official information places Café BRÛZE at Rengerslaan 1; no canonical location was created because its exact plan position, entrance, floor context, endpoint, and accessibility are not verified. The gem is now a `needs_review` location proposal and exposes no false map or route action.
- The Phase 5 migration added constrained location routing metadata, nullable canonical gem links, structured proposal fields, foreign keys and indexes. Existing RLS remains enforced; public clients still see approved content only and cannot moderate it.

## Phase 5.5 opening-hours and operational-data audit

- 14 named facilities were researched: Rengerslaan 8, Rengerslaan 10, Bibliotheek, Campus Store / legacy iShop, Student Info, Service Desk, Central Brew, Café IF, Canteen, Café Brandstof, Espresso Bar, Food Court, Document Centre, and BRÛZE.
- The approved location universe contains 13 hours-relevant facilities. Four locations have verified records: Bibliotheek has physical opening hours; R8 and R10 have building-access hours; Student Info has service/contact hours. BRÛZE has a separate `needs_review` record linked to its Hidden Gem. Nine approved facilities have no sufficiently current, unambiguous schedule and therefore make no open/closed claim.
- Verified schedules: R8 Monday–Friday 07:30–18:00; R10 Monday–Thursday 07:30–22:00 and Friday 07:30–18:00; Bibliotheek Monday–Friday 08:30–17:00; Student Info phone Monday–Friday 08:30–16:30, with its source-backed WhatsApp window 09:30–16:30 stated only as a note. Weekends are closed for R8, R10, Bibliotheek, and the Student Info contact schedule.
- Bibliotheek has five date-specific exceptions for 12–16 October 2026, each 09:00–13:00. The exception wins over the regular week and is labelled as an adjusted opening time.
- The current catering page confirms which campus venues exist but no longer publishes unambiguous exact schedules for Central Brew, Brandstof, Café IF, Canteen, Espresso Bar, or Food Court. Their `hours_id` stays null. Older schedules were not promoted to current facts.
- The same page states 09:00–18:00 for BRÛZE without naming weekdays. This is preserved as source-backed context with `needs_review`, an empty weekly schedule, and no Open/Closed claim. Its route/location remains independently unverified.
- Student Info phone and WhatsApp availability is explicitly `service_contact`; the UI does not present either as confirmed physical desk opening.
- Recent official information describes a Campus Store on R10 and confirms that the former shop and Document Center were merged. `ishop` and `document-centre` now identify former/legacy points with `needs_review`. The existing iShop endpoint and deep links remain compatible, but no current Campus Store endpoint is invented until its exact R10 desk position is verified.
- Primary sources checked on 2026-09-10: the [Leeuwarden campus page](https://www.nhlstenden.com/locaties/leeuwarden), [Library opening-hours page](https://www.nhlstenden.com/bibliotheek/over-de-bibliotheek/openingstijden), [Library autumn-break notice](https://www.nhlstenden.com/bibliotheek/nieuws/aangepaste-openingstijden-nhl-stenden-bibliotheken), [campus catering page](https://www.nhlstenden.com/locaties/leeuwarden/catering), [Student Info contact page](https://www.nhlstenden.com/werken-en-studeren/kom-in-contact), and [NHL Stenden annual report 2025](https://publicaties.nhlstenden.com/jaarverslag-2025/de-leer--en-werkomgeving).
- `hours:audit`: 606 approved locations; 13 hours-relevant facilities; 4 linked location records; 4 verified schedules; 1 needs-review schedule; 0 unverified schedules; 2 physical schedule records (one verified, one needs review); 2 building schedules; 1 service/contact schedule; 1 exception record covering 5 dates; 0 missing source URLs, 0 stale verification dates, 0 suspicious links, 0 orphan hours records, and 0 critical issues. 593 ordinary rooms/toilets/stairs and other non-hours locations are correctly ignored.
- Migration `20260910012005_phase55_operational_hours.sql` was applied to production with exactly the same timestamp and identity. It adds hours relevance, constrained scope, bilingual notes, Europe/Amsterdam timezone, the Hidden Gem hours foreign key/index, current records, and legacy facility corrections. Older local/remote migration-history drift remains an explicit Phase 6 follow-up; Phase 5.5 introduced no new drift.
- The location-details hierarchy puts relevant hours before secondary description without displacing route/map actions. The compact card shows current state first, expands the week on demand, highlights today and exceptions, and keeps source/provenance secondary. Hours cards are omitted data-driven for rooms, toilets, stairs, lifts, and other irrelevant categories.
- Visual browser checks passed at 320, 375, and 390 px plus desktop: no horizontal overflow, usable touch controls and floor selector, a readable map and route instruction, distinct start/route/transition/destination states, compact From/To, and scan-friendly details/Hidden Gems. Accessibility status remains textual as well as colored, and no unknown route is described as confirmed accessible.
- Admin now edits hours as structured fields: scope, status, weekdays, multiple periods, closed days/exceptions, source, verification dates, reviewed-through date, bilingual notes, and linked locations/gems. Invalid times, overlaps, dates, days, sources, and verified records without provenance are rejected.

## Verification

- Phase 5.5 hours, UI rendering, accessibility, normalization, routing, validation, and experience unit/integration suite: pass, 101/101, including fixed-clock Europe/Amsterdam and exception coverage.
- Phase 4 required-pair experience audit: pass, 9/9 routes and 0 critical issues.
- pnpm search:audit: pass, 606/606 From and To, 0 critical issues.
- pnpm routing:audit: pass, 0 critical issues.
- pnpm routing:regression: pass, 606/606 endpoints, 48/48 sampled routes, 7/7 critical pairs.
- pnpm routing:audit-accessibility: pass, 0 graph/data contradictions; unknown verification reported separately.
- Route browser acceptance: pass, 5/5 targeted checks on desktop and mobile.
- Official-plan browser verification: pass, 8/8 floor images load at 1489 × 1489 and fit at 320 px.
- pnpm seed:check: pass, 183 records validated.
- pnpm test:e2e: pass, 21/21 against the real Supabase project, including admin, Storage, moderation, deduplicated likes, proposal-to-canonical linking, wrong-floor endpoint rejection, structured hours editing, BRÛZE, 320/375/390 px mobile layouts, official maps, opening-hour exceptions, and wheelchair behavior.
- pnpm lint: pass.
- pnpm typecheck: pass.
- pnpm build: pass.
- Supabase migration and post-migration queries: pass. Security advisor found no Phase 5 schema error; existing informational no-policy findings protect intentionally private/deny-all tables. Leaked-password protection remains a project setting to enable separately.

## Next active phase

**Phase 6 — not started**

No code blocker has been identified. Physical on-campus validation is required before any route or location can be marked confirmed accessible. Priority checks are the R10 lift-to-plan connections, the current Campus Store desk/entrance, whether Document Centre still has any separate public counter, the BRÛZE map point/entrance, and current service/hospitality hours where official pages are silent. Phase 6 must also reconcile the pre-existing migration-history timestamp drift and review the existing Supabase advisor items, including leaked-password protection and unused/permissive-policy notices.
