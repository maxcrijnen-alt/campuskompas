# CampusKompas routing status

Last updated: 2026-09-12

## Completed phases

**Phase 1 — Audit & routing architecture**, **Phase 2 — Endpoint coverage & graph repair**, **Phase 3 — Search normalization & destination resolution**, **Phase 4 — Route experience**, **Phase 5 — Accessibility, admin & Hidden Gems / BRÛZE**, **Phase 5.5 — Visual polish, operational data & opening hours**, **Phase 5.6 — User feedback, accessibility routing & final visual polish**, and **Phase 6 — Final verification, production readiness & handover** are complete.

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

## Phase 5.6 owner-feedback result

- A neutral visit now selects canonical building `R8` and floor `R8-0` explicitly, independent of database ordering. Valid location, route-stage, QR and R10 deep links still select their own floor.
- Relevant location details show the compact current opening-hours state directly below building/floor and before the route CTA on mobile and desktop. The weekly schedule and provenance remain expandable. Rooms and other non-hours categories do not get an hours card.
- Wheelchair routing now permits a floor transition only through an explicit elevator edge, and a building transition only through an explicit outdoor edge. Stairs and verified-inaccessible records remain excluded; unknown data remains a candidate with an unverified warning and is never called inaccessible.
- All 9 stored elevator edges are bidirectional, structurally vertical, have map coordinates, connect to corridors at both ends, and remain accessibility `unknown`. The current R8 plan lift chain supports R8-002/R8_MAIN → R8-301 with 3 elevator transitions and explicit “Neem de lift naar verdieping …” instructions. The R10 lift chain is not connected to the current endpoint component by a complete non-stair path, so R10_MAIN → F3.025 remains honestly unavailable for wheelchair routing.
- Hidden Gem proposals now distinguish `r8`, `r10`, `campus_outdoor`, and `other`. External proposals require no building or floor, cannot claim indoor coordinates or route data, and show a clear public no-route message. Admin can inspect, edit, approve/reject, and later replace the proposal with one validated canonical location.
- The interface uses a restrained purple primary, strong blue route/information color and pink Hidden Gem accent, with consistent focus, contrast, cards, buttons, chips and mobile states. Browser checks at 320, 375, 390 and 1280 px found no horizontal overflow.
- `/admin` now includes a controlled email field and neutral “Wachtwoord vergeten?” action. Reset requests are rate-limited, only send for a provisioned admin, do not enumerate accounts, and lead to a dedicated password form. Recovery tokens stay in memory and are removed from the URL; the new password requires 12–72 characters with upper/lowercase, number and symbol. A root recovery redirect handles the configured Supabase Site URL as a safe fallback. Public registration remains disabled.
- Opening-hours writes now use one target-aware atomic RPC. It rejects unsupported locations, incompatible schedule kinds, unapproved Gems, orphan schedules and generic-table writes while preserving edits to valid linked records.
- Production contains 5 hours records: 4 verified and 1 needs-review, with 0 invalid provenance, suspicious links or orphan records. Of 13 hours-relevant locations, 4 have verified records; the 9 remaining facilities make no unsupported open/closed claim.
- Migrations `20260911102132_phase56_external_gems_and_hours_integrity.sql` and `20260911193959_phase56_proposal_presence_constraints.sql` add the constrained external-proposal context, require an explicit proposal name/context at database level, and enforce final hours-link integrity. The already-applied additive provenance/link migrations `20260911045007_phase6_hours_provenance.sql` and `20260911070822_admin_hours_link.sql` were retained to keep production and local migration history aligned; retaining those deployed changes does not mark Phase 6 complete.

## Phase 6 final verification and handover

- The production baseline was measured again on 2026-09-12: 606 approved locations, 576 public rooms, 514 nodes, 535 edges, 606 direct endpoints, 0 inferred, 0 needs-review, 0 unavailable, one 514-node normal-routing component, and 0 locations outside it.
- From, To, and exact-ID coverage are each 606/606. All-location endpoint regression is 606/606, deterministic route sampling is 48/48, critical pairs are 7/7, and visual route-experience pairs are 9/9.
- Local and production migration histories contain the same 15 versions and names from `20260908133055_campus_schema` through `20260912075646_admin_verified_opening_hours`. Unexpected drift is 0.
- Database integrity is clean across locations/buildings/floors/nodes, rooms/locations, edges/nodes, Hidden Gems/locations/hours, locations/hours, and floors/buildings. Duplicate canonical IDs, orphan records, dangling references, invalid floor/building pairs, invalid endpoints, invalid hours links, invalid proposals, invalid statuses, and critical failures are all 0.
- The provenance model remains singular and enforced: `official_web` requires a URL; signage, staff confirmation, and manual administration retain source description and verification date. Hours Admin saves are verified by the provisioned administrator while `manual_admin` remains visibly distinct from an official web source.
- Search, aliases, legacy IDs, facilities, QR/deep links, structured room-code variants, and building context use the central resolver. `C0.102` and `C0.1.02` remain distinct while compact `C0102` remains explicitly ambiguous.
- Normal routing is fully connected and uses stored graph geometry only. Required same-floor, multi-floor, reverse, inter-building, iShop ↔ F3.025, and R8 ↔ R10 routes pass without a straight-line fallback.
- Accessibility remains truthful: 514/514 nodes and 535/535 edges are unknown, 0 are confirmed accessible, and 0 are confirmed inaccessible. Wheelchair routing excludes all stairs and confirmed-inaccessible data and permits floor changes only through explicit elevator edges. The R8 candidate route uses three elevator transitions and no stairs; the R10 candidate remains unavailable pending physical/topology verification.
- Hidden Gem canonical, proposed R8/R10, campus-outdoor, and other-external modes pass submission and moderation checks. External proposals receive no fabricated route endpoint. BRÛZE remains an approved generic Gem with a `needs_review` external location proposal and no route action.
- Opening-hours production now contains 6 records: 5 verified location schedules and 1 needs-review BRÛZE context. Five use `official_web` provenance; the administrator-managed Central Brew schedule uses `manual_admin`, is verified by the owner, and remains visibly attributed to the administrator.
- Hours Admin now treats every saved schedule change as verified by the provisioned administrator, refreshes the verification date, and shows `manual_admin` publicly as “Bevestigd door beheerder” rather than as an official web source.
- Generic admin saves now force general verification for sources, floors, locations, route nodes, and route edges. Route-node and route-edge saves also confirm the selected accessibility state because the provisioned administrator is the designated expert; Hidden Gems retain their separate moderation statuses.
- The owner email remains provisioned as an administrator. Public registration and direct public mutations remain blocked. Forgot-password responses stay neutral and rate-limited; invalid tokens and weak passwords fail; a valid admin token can update the password and log in. The test restores the original test credential.
- Supabase advisors were reviewed rather than optimized by count. Three no-policy findings are intentional deny-all/server-only tables. Thirteen overlapping authenticated SELECT-policy notices preserve public-read plus admin behavior and use cached admin checks. Nine unused-index notices are retained because the database is young and the indexes cover foreign keys or expected operational queries.
- Leaked Password Protection remains disabled and cannot be changed through the available integration. Manual project setting required: Auth → Email provider → Password security → Prevent use of leaked passwords (available on eligible Supabase plans).
- Production data access uses parallel, paginated snapshot reads with no route/search N+1 pattern. The current payload and route computation are acceptable for 606 locations; snapshot size should be monitored as the campus dataset grows.
- Runtime requirements are explicit: Node 24 via `package.json` and `.node-version`, and pnpm 11.19.0 via `packageManager` plus the frozen-lockfile Vercel install command.
- Architecture, security, data-source, setup, deployment, migration, admin, recovery, hours, Hidden Gem, accessibility, and remaining-physical-work documentation is current in `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATA_SOURCES.md`, and `docs/PRODUCTION_READINESS.md`.
- MASTER Definition of Done: endpoint/search/routing/integrity/auth/hours/Hidden Gem/deployment-readiness software requirements pass. Accessibility confirmation and exact unverified real-world positions/hours pass with a verified limitation because the UI reports them as unverified and makes no route or schedule claim.

## Verification

- Phase 5.6 hours, UI rendering, accessibility, normalization, routing, validation, reset, and experience unit/integration suite: pass, 108/108, including fixed-clock Europe/Amsterdam, exception coverage, and rejection of invalid cross-building lift edges.
- Phase 4 required-pair experience audit: pass, 9/9 routes and 0 critical issues.
- pnpm search:audit: pass, 606/606 From and To, 0 critical issues.
- pnpm routing:audit: pass, 0 critical issues.
- pnpm routing:regression: pass, 606/606 endpoints, 48/48 sampled routes, 7/7 critical pairs.
- pnpm routing:audit-accessibility: pass, 0 graph/data contradictions; unknown verification reported separately.
- Route browser acceptance: pass, 5/5 targeted checks on desktop and mobile.
- Official-plan browser verification: pass, 8/8 floor images load at 1489 × 1489 and fit at 320 px.
- pnpm seed:check: pass, 183 records validated.
- pnpm database:audit: pass, 0 integrity failures across 2 buildings, 8 floors, 24 categories, 4 sources, 5 hours records, 514 nodes, 535 edges, 606 locations, 576 rooms, and the approved Hidden Gem.
- pnpm hours:audit: pass, 13 relevant facilities, 5 verified linked locations, 1 needs-review Gem schedule, and 0 critical issues.
- pnpm test:e2e: pass, 25/25 against the real Supabase project, including admin, a valid-token password update/login/restore, the full Central Brew no-SQL hours workflow, Storage, moderation, deduplicated likes, proposed indoor and outdoor Gems, proposal-to-canonical linking, wrong-floor endpoint rejection, structured hours editing, BRÛZE, 320/375/390 px mobile layouts, desktop, official maps, opening-hour exceptions, and wheelchair behavior. Post-run QA cleanup counts are 0.
- pnpm lint: pass.
- pnpm typecheck: pass.
- pnpm build: pass.
- Supabase migration and post-migration queries: pass. Security advisor found no Phase 5 schema error; existing informational no-policy findings protect intentionally private/deny-all tables. Leaked-password protection remains a project setting to enable separately.

## Remaining physical / operational verification

- Verify the R10 lift-to-corridor topology on site before enabling a wheelchair route to F3.025 or calling any R10 route confirmed accessible.
- Survey wheelchair suitability for the 305 possible candidate locations and connect or classify the 301 locations outside the largest stair-free candidate component.
- Confirm the exact current Campus Store desk/entrance, whether Document Centre still has a separate public counter, and the exact BRÛZE map point/entrance before creating route endpoints.
- Obtain current authoritative schedules for Service Desk, Central Brew, Café IF, Canteen, Brandstof, Espresso Bar, Food Court, legacy iShop/Document Centre context, and weekday semantics for BRÛZE.
- Enable Supabase Leaked Password Protection manually when the project plan exposes the setting.

## Program state

Phase 6 is complete. No Phase 7 is planned. Direct push to `main` remains the owner's deliberate low-friction workflow; no required PR, approval, branch-protection, or blocking status-check policy is introduced.
