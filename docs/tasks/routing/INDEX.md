# CampusKompas universal routing — phase index

Authoritative detailed specification: `./MASTER.md`

Use this file to keep Codex context small. Read only the active phase plus `STATUS.md`, and open other MASTER sections only when a dependency requires it.

## Phase 1 — Audit & routing architecture

Read MASTER sections: **1–5, 10–13, 38–39**.

Goals:
- verify the real production/database baseline;
- inspect the existing search, routing engine, map layers and Supabase schema;
- introduce one central location → route-endpoint resolver architecture;
- validate direct node mappings rather than trusting `node_id` blindly;
- analyze connected components and establish graph health metrics;
- keep routing/search data-driven and efficient.

Expected outcome: a verified baseline and central resolver foundation, without spreading endpoint logic through React components.

## Phase 2 — Endpoint coverage & graph repair

Read MASTER sections: **6–13, 21, 28–30, 35, 40–42, 49–50**.

Goals:
- safe same-floor endpoint fallback for locations without a direct node;
- room-entrance support where reliable;
- reproducible migration/data-fix for existing locations;
- repair or classify disconnected graph components;
- eliminate normal public locations pointing at legacy/disconnected nodes;
- ensure R8 ↔ R10 and multi-floor routing work;
- add graph/routing audit tooling and all-location endpoint checks;
- add critical regression pairs, especially iShop ↔ F3.025.

## Phase 3 — Universal search & endpoint UX

Read MASTER sections: **3, 14–20, 31, 38, 43–46**.

Goals:
- From and To use the same central location universe;
- preserve semantic room letters/zones during normalization;
- tolerant canonical room-code search without merging distinct rooms;
- full start-location search for rooms, facilities and POIs;
- swap button and correct URL state;
- stable canonical deep links with legacy compatibility;
- QR remains a shortcut, not the only usable start flow;
- map-picked/current-location wording must not imply fake indoor GPS precision.

## Phase 4 — Route experience

Read MASTER sections: **20–24, 28–31, 43–48**.

Goals:
- calculate routes only from validated endpoints;
- never visualize routing through walls;
- clear start/destination markers and per-floor route segments;
- understandable instructions generated from graph metadata;
- sensible approximate walking time;
- clean no-route state;
- development-only routing debug mode;
- verify same-floor, multi-floor and inter-building flows.

## Phase 5 — Accessibility, admin & BRÛZE

Read MASTER sections: **25–27, 32–37**.

Goals:
- separate accessible / inaccessible / unknown semantics;
- ensure wheelchair routing does not treat unverified corridors as proven inaccessible;
- accessibility audit tooling;
- create/link a specific Café BRÛZE location only when supported by reliable current information;
- make BRÛZE searchable and route Hidden Gem actions to the actual location;
- expose routing status and manual endpoint control in admin;
- add routing health summary to admin.

## Phase 6 — Full verification & documentation

Read MASTER sections: **40–42, 49–55** and revisit any earlier section whose Definition of Done is not satisfied.

Goals:
- all public approved locations pass endpoint validation or are explicitly flagged for review;
- representative and deterministic routing tests cover the graph;
- integrity constraints and migrations are reproducible;
- routing architecture documentation is current;
- full test, lint, typecheck and production build pass;
- produce the exact final metrics/report required by MASTER section 55.

## Execution rule

Complete one phase before moving to the next unless a tightly coupled dependency makes a small cross-phase change necessary. Update `STATUS.md` after each phase so a fresh Codex thread can continue without reconstructing prior reasoning.
