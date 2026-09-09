# CampusKompas routing status

Last updated: 2026-09-09

## Current state

- Existing CampusKompas codebase is on `main` in `maxcrijnen-alt/campuskompas`.
- GitHub → Vercel production deployment is connected and working.
- Vercel build-context issue caused by `.vercelignore` has been fixed in commit `f528b40b7517a125e001c2216d2f62f9d6fed339`.
- Existing Supabase project `campuskompas` is active.
- Universal routing implementation has **not yet started under this phased workflow**.

## Active phase

**Phase 1 — Audit & routing architecture**

Read `INDEX.md`, then MASTER sections 1–5, 10–13 and 38–39.

## Known baseline from the supplied audit

Treat these as starting assumptions to verify against the live code/data before changing behavior:
- ~606 locations;
- 576 rooms;
- ~217 locations without `node_id`;
- ~7 locations with nodes outside the main component;
- main route component ~460 nodes;
- another component ~54 nodes plus some isolated nodes;
- iShop 0.26 currently lacks an explicit `node_id` while F3.025 has one.

## Handoff rule

After each phase, replace this section with:
- completed work;
- verified metrics that future phases actually need;
- migrations/scripts added;
- tests/checks run and their status;
- unresolved blockers or `needs_review` items;
- next active phase.

Keep this file concise. Detailed requirements belong in `MASTER.md`; implementation details belong in code/docs/tests.
