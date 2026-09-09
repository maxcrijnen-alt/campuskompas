<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CampusKompas working rules

Work in the existing CampusKompas codebase. Never rebuild the application from scratch.

## Workflow

- Inspect the relevant existing implementation before modifying it.
- Follow existing architecture, naming, abstractions and conventions.
- Use Supabase migrations for schema changes and reproducible scripts for data fixes.
- Do not make ad-hoc production database changes.
- Do not introduce mock data to hide production/data problems.
- Preserve backwards compatibility where practical.
- Prefer the smallest robust implementation that satisfies the active phase.

## Routing task specifications

The universal routing project lives in `docs/tasks/routing/`.

For routing work:
1. Read `docs/tasks/routing/INDEX.md`.
2. Read `docs/tasks/routing/STATUS.md`.
3. Read only the sections of `docs/tasks/routing/MASTER.md` required for the active phase.
4. Expand context only when the implementation or evidence requires it.

`MASTER.md` is the authoritative detailed specification when requirements are unclear.

## Context efficiency

Minimize unnecessary context and tool cycles without reducing correctness.

- Do not dump or read the entire repository.
- Find relevant files with targeted search first.
- Do not reread unchanged files unless new evidence requires it.
- Prefer filtered command output, counts and summaries over large raw dumps.
- For large datasets, inspect aggregates and relevant samples first.
- Batch independent read-only inspections where practical.
- Do not repeatedly poll running commands.
- Do not repeat completed checks.
- Avoid subagents unless independent parallel work clearly benefits from them.
- Do not read unrelated documentation.

## Validation

Validate proportionally during implementation:
1. targeted tests first;
2. relevant lint/type checks next;
3. full required verification at the end of the phase/project.

Do not repeatedly run the entire suite after every small edit.

Before declaring the full routing project complete, run every verification required by the Definition of Done in `MASTER.md`.

## Delivery

Do not stop after producing a plan when implementation is possible.

For each completed routing phase:
- implement it;
- verify it;
- update `docs/tasks/routing/STATUS.md` concisely;
- record only decisions and blockers needed by future phases.

Keep `STATUS.md` short. It is a handoff, not a transcript or build log.
