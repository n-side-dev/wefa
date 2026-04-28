# N-SIDE WeFa – Agent Guide

## Product

**WeFa** (Web Factory) is N-SIDE's internal toolkit for assembling full-stack product experiences quickly. It gives product teams batteries-included building blocks — auth, legal consent, locale, audit, request-scoped helpers, and a Vue/PrimeVue component library — so a new app starts at "wired and tested", not at a blank repo.

## Project Snapshot
- WeFa ships three artifacts on a shared version: `django/` (the `nside-wefa` Django toolkit, published to PyPI), `vue/` (the `@nside/wefa` Vue 3 component library, published to npm), and `bff/` (a Flask backend-for-frontend, published as a Docker image to GHCR).
- Primary technologies: Python 3.12+, Django 5.2 + Django REST Framework, Flask 3 (BFF), Vue 3 + PrimeVue + Tailwind 4, Vitest + Playwright.

## Repository Layout & Key Docs
- `README.md` – top-level overview; defer to per-workspace `README.md` for specifics.
- `django/` – reusable apps (`nside_wefa.common`, `.utils`, `.authentication`, `.legal_consent`, `.locale`, `.audit`) plus `demo/` project and pytest setup. See `django/AGENTS.md`.
- `vue/` – component library, demo playground, Storybook, `wefa-install` script. See `vue/AGENTS.md` plus the repo-local skills under `.agents/skills/`.
- `bff/` – Flask BFF handling OAuth/session/cookie + Django proxy. See `bff/AGENTS.md`.
- `.agents/skills/` – repo-local Codex skills. Codex can auto-discover these; other agents should read the referenced `SKILL.md` files directly.
- `docs/agent-roadmap.md` – checked-in replacement for older machine-local roadmap references used for cross-cutting infrastructure planning.
- `code_review.md` – review checklist for agent-led PR and patch review.
- `PLANS.md` – template for multi-step or cross-workspace execution plans.
- Contribution guides: `django/CONTRIBUTE.md` & `vue/CONTRIBUTE.md` cover human onboarding; the agent guides cover conventions and the quality gate.

## Instruction Routing
- For frontend work inside `vue/` (components, containers, stories/docs, translations, tests), use the repo-local skills `wefa-vue-frontend` and `wefa-tanstack-query` from `.agents/skills/`. Codex can auto-discover them; agents that do not auto-load skills should read `.agents/skills/wefa-vue-frontend/SKILL.md`, `.agents/skills/wefa-tanstack-query/SKILL.md`, and `vue/AGENTS.md`.
- For backend work inside `django/`, see `django/AGENTS.md` for app conventions, the quality gate, the new-app checklist, and known gotchas.
- For BFF work inside `bff/`, see `bff/AGENTS.md` for blueprint layout, OAuth/cookie conventions, OpenAPI flow, and the quality gate.
- For cross-cutting work (Django ↔ BFF ↔ Vue), follow this file for shared expectations plus the relevant workspace AGENTS / SKILL files.
- Before designing cross-cutting infrastructure (auth modes, observability, retention, RBAC, tenancy, …), check `docs/agent-roadmap.md` first. If the intended shape is not recorded there, surface the design question early instead of relying on machine-local notes.

## Core Engineering Principles
- **Convention over configuration**: align with provided settings helpers (`NSIDE_WEFA` for Django and documented Vue defaults) before introducing bespoke wiring.
- **Type safety & documentation**: keep Python and TypeScript hints accurate; add comments only for non-obvious logic; update relevant docs whenever behaviour changes.
- **Tests as gatekeepers**: extend existing suites when behaviour changes; no feature lands without matching tests unless explicitly justified.
- **Mirror an existing app/component**: when in doubt about layout, settings shape, signal pattern, or test structure, copy the closest analogue rather than inventing a new pattern.
- **Test under non-default settings too**: any feature gated by an opt-in flag (tamper-evidence, `INCLUDE_ALL_MODELS`, `RAISE_ON_FAILURE`, …) needs a test that exercises the flag turned on. Code paths that work only in the default config are how silent regressions ship.

## Shared Workflow Expectations
- Stay within the workspace toolchain: `uv` + Hatchling builds for Django and BFF, npm scripts + Vite for Vue.
- Keep lockfiles consistent with the package manager in use (`uv.lock`, `package-lock.json`).
- Maintain documentation parity: adjust relevant READMEs, MDX docs, or changelog entries whenever behaviour changes.
- For cross-cutting features, coordinate backend API shape first, then wire the frontend through the generated clients/composables; the BFF sits at the boundary and should not absorb logic that belongs in Django or Vue.

## Cross-Workspace Verification
- If only `django/` changes, run the Django quality gate from `django/AGENTS.md`.
- If only `bff/` changes, run the BFF quality gate from `bff/AGENTS.md`.
- If only `vue/` changes, run the Vue quality gate from `vue/AGENTS.md`.
- If Django API shape, BFF proxy/auth behavior, cookie names, redirect targets, or error-code contracts change, run the relevant backend gate and, in `vue/`, run `npm run type-check`, `npm run build`, and `npm run test:package-types`. If routed demo flows or browser-visible auth UX changed, also run `npm run test:e2e -- --reporter=dot`.

### Quality Gate Cheat Sheet

Minimum entry commands per workspace. See each workspace's `AGENTS.md` for the full gate.

```bash
# django/  (cwd: django/)
uv sync --all-extras && uv run pytest && uv run ruff check nside_wefa demo \
  && uv run ruff format --check nside_wefa demo && uv run mypy nside_wefa/ \
  && uv run python manage.py check

# bff/  (cwd: bff/)
uv sync --dev && uv run pytest \
  && uv run python -m bff_app.openapi.generate --check --output bff_app/openapi/openapi.yaml

# vue/  (cwd: vue/)
npm install && npm run lint-check && npm run type-check && npm run format-check \
  && npm run test:unit -- --reporter=dot --silent && npm run build
# Add: npm run test:e2e -- --reporter=dot     when routing/demo/browser flows changed
# Add: npm run test:package-types             when exports or packaging changed
```

## Domain Invariants

Cross-workspace contracts that don't live in any single file. Honor these when planning changes that span workspaces.

- **Single shared version.** All three artifacts (`django/`, `vue/`, `bff/`) ship on one version, bumped from the repo root via `python3 scripts/wefa_version.py {bump|set} ...`. Do not edit `pyproject.toml` / `package.json` versions by hand.
- **BFF ↔ Vue auth contract.** The `bff/` cookie names (`<SESSION_COOKIE_NAME>_at|_rt|_it|_meta`, see `TOKEN_COOKIE_SUFFIXES` in `bff/bff_app/services/token_cookies.py`) and the `FRONTEND_REDIRECT?error=<code>` failure codes (`auth_state_missing`, `auth_state_mismatch`, `auth_provider_error`, `auth_callback_incomplete`, `auth_token_exchange_failed`, `auth_invalid_token`, `auth_cookie_too_large`) are part of the public contract with `vue/`. Renames or additions are coordinated changes — update `bff/README.md`, `bff/AGENTS.md`, and the consuming Vue flows in the same PR.
- **Django app load order.** `nside_wefa.common` must be installed before any other `nside_wefa.*` app (it owns shared settings access and `get_section` / `get_value`). Beyond that, `audit/checks.py::wefa_apps_dependencies_check` enforces the rest of the dependency order at boot — failing `manage.py check` is the signal, not a runtime crash.
- **Generated artifacts stay in sync.** The BFF OpenAPI spec at `bff/bff_app/openapi/openapi.yaml` is regression-checked in CI (`--check` flag); the Vue typed OpenAPI client under `vue/src/demo/openapi/` is regenerated through the existing script, never hand-edited. If a route schema or Django API shape changes, regenerate before opening the PR.
- **Opt-in flags need their own tests.** Every feature gated by an opt-in (`tamper_evident`, `INCLUDE_ALL_MODELS`, `RAISE_ON_FAILURE`, future toggles) must ship with a regression test that exercises the flag turned on. "Worked in default config, broke under the opt-in" is the documented bug shape.

## Review And Planning
- For review requests, follow `code_review.md` so findings stay ordered and consistent across workspaces.
- For ambiguous or multi-step cross-workspace work, start from `PLANS.md` or ask the agent to plan before editing.

## Decision Checklists
- **Before opening a PR**:
  - [ ] Tests added/updated for changed behaviour, edge cases, and any opt-in flags.
  - [ ] Workspace-specific quality gate run green (see the workspace's `AGENTS.md`).
  - [ ] Per-app / per-feature README + top-level workspace README updated alongside behaviour changes.
  - [ ] Breaking changes and version impacts called out in the PR body.

## When in Doubt
- Workspace AGENTS / SKILL files first, then `README.md` / `CONTRIBUTE.md`, then mirror the closest existing implementation.
- Surface open questions early (new auth modes, new top-level apps, schema-breaking changes, BFF surface expansion) so design/system owners can confirm direction.

Following this guide keeps contributions aligned with the existing architecture, ensures compliance with the WeFa component hierarchy, and preserves release quality across both Django and Vue packages.
