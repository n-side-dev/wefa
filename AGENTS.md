# N-SIDE WeFa - Agent Guide

## Product

**WeFa** (Web Factory) is N-SIDE's internal toolkit for assembling full-stack product experiences quickly. The monorepo ships three artifacts on one shared version:

- `django/` publishes the `nside-wefa` Django toolkit.
- `vue/` publishes the `@nside/wefa` Vue 3 component library.
- `bff/` publishes the Flask backend-for-frontend used for OAuth/session/cookie flows and backend proxying.

## Purpose

This file provides durable repository-wide guidance. Keep shared rules here, keep workspace-specific rules in nested `AGENTS.md` files, and keep reusable task workflows in `.agents/skills/`.

Codex loads AGENTS instructions from the repository root down to the current working directory. Later files are more specific.

## Repository Map

- `README.md` is the top-level overview; defer to per-workspace `README.md` files for package specifics.
- `django/` contains reusable Django apps plus the `demo/` validation project. See [django/AGENTS.md](django/AGENTS.md).
- `vue/` contains the library, demo app, Storybook docs, and package tooling. See [vue/AGENTS.md](vue/AGENTS.md).
- `bff/` contains the Flask BFF and its generated OpenAPI spec. See [bff/AGENTS.md](bff/AGENTS.md).
- `.agents/skills/` contains repo-local Codex skills.
- `docs/agent-roadmap.md` records cross-cutting infrastructure direction.
- `code_review.md` is the review checklist.
- `PLANS.md` is the plan template for larger multi-step work.

## Instruction Routing

- For Vue work in consuming projects that use `@nside/wefa`, use `wefa-vue-cookbook`.
- For frontend work inside this repository's `vue/` workspace, load `wefa-vue-cookbook` first and then `wefa-vue-frontend`.
- `wefa-vue-cookbook` is the shared base skill: it applies both to consuming apps and to shared Vue conventions inside this repo.
- `wefa-vue-frontend` adds only repo-specific maintainer guidance for this monorepo's `vue/` workspace: exports, docs, demo wiring, generated artifacts, tests, and quality-gate expectations.
- For TanStack Query work in `vue/`, also use `wefa-tanstack-query` when the task is specifically about query wiring, invalidation, mutation flows, or wrapper choice.
- For `django/` work, follow [django/AGENTS.md](django/AGENTS.md).
- For `bff/` work, follow [bff/AGENTS.md](bff/AGENTS.md).
- For cross-cutting changes, coordinate backend/API shape first, then update consumers and documentation in the affected workspaces.

## Shared Engineering Rules

- Explore first: inspect neighboring implementations, workspace docs, and CI scripts before designing changes.
- Prefer existing conventions and helpers over bespoke wiring.
- Keep Python and TypeScript types accurate.
- Keep user-facing frontend copy localized.
- Add or update tests when behavior changes.
- Do not hand-edit generated artifacts unless the workspace guide explicitly allows it.
- Keep lockfiles aligned with the package manager in use: `uv.lock` for Python workspaces and `package-lock.json` for `vue/`.
- Update relevant README, MDX, or changelog-style docs when behavior changes.

## Cross-Workspace Invariants

- All three workspaces share one version. Use `python3 scripts/wefa_version.py` from the repo root for version changes.
- `nside_wefa.common` must come before dependent `nside_wefa.*` apps in Django app-order examples and validation setups.
- BFF cookie names and frontend redirect error codes are part of the BFF ↔ Vue contract; coordinated changes must update both workspaces' docs and flows in the same change.
- Generated artifacts must stay in sync: regenerate the BFF OpenAPI spec and the Vue demo client through the existing generators instead of hand-editing them.
- Opt-in flags need dedicated tests with the flag enabled, not only default-path coverage.

## Validation Expectations

- Run the smallest relevant checks while iterating.
- Before handoff, run the workspace-specific gate from the relevant nested `AGENTS.md` when feasible.
- Documentation-only AGENTS or skill-routing changes do not require product test suites, but they should leave the repo without unresolved conflicts or conflict markers.
- For reviews, prioritize bugs, regressions, missing tests, security risks, and docs drift before style comments.

## When In Doubt

- Workspace `AGENTS.md` files and skills first, then workspace READMEs and contribution guides.
- Mirror the closest existing implementation before inventing a new pattern.
- Surface design questions early when a change would expand auth modes, backend contracts, public exports, or other cross-workspace infrastructure.
