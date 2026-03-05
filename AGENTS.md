# N-SIDE WeFa – Agent Guide

## Project Snapshot
- WeFa (Web Factory) ships two publishable packages: `django/` contains the `nside-wefa` Django toolkit, `vue/` contains the `@nside/wefa` Vue 3 component library.
- Goal: provide production-ready auth, legal-consent, other backend packages, and UI building blocks so product teams can assemble full-stack experiences quickly.
- Primary technologies: Python 3.12+, Django 5.2 + Django REST Framework, Vitest + Playwright, Vue 3 + PrimeVue + Tailwind 4.

## Repository Layout & Key Docs
- `README.md` – top-level overview; defer to `django/README.md` and `vue/README.md` for workspace specifics.
- `django/` – reusable apps (`nside_wefa.common`, `.authentication`, `.legal_consent`, etc) plus `demo/` project and pytest setup.
- `vue/` – component library, demo playground, Storybook, scripts (e.g. `wefa-install`), and AI guidance (`scripts/files/copilot-instructions.md`).
- Contribution guides: `django/CONTRIBUTE.md` & `vue/CONTRIBUTE.md` define environment setup, quality gates, and release discipline.

## Instruction Routing
- For work inside `vue/`, apply `vue/AGENTS.md` as the frontend source of truth.
- For work inside `django/`, use the backend guidance in this file until a dedicated `django/AGENTS.md` is introduced.
- For cross-cutting work (API + UI), follow this file for shared expectations and `vue/AGENTS.md` for frontend implementation details.

## Core Engineering Principles
- **Convention over configuration**: align with provided settings helpers (`NSIDE_WEFA` for Django and documented Vue defaults) before introducing bespoke wiring.
- **Type safety & documentation**: keep Python and TypeScript hints accurate; add comments only for non-obvious logic; update relevant docs whenever behaviour changes.
- **Tests as gatekeepers**: extend existing suites when behaviour changes; no feature lands without matching tests unless explicitly justified.

## Backend Playbook (`django/`)
- **App structure**: extend existing apps (`nside_wefa.authentication`, `.legal_consent`, `.common`, etc) unless a new domain warrants a standalone package. Mirror current layout: `apps.py`, `checks.py`, `models/`, `serializers.py`, `urls.py`, `views/`, `tests/`, `README.md`.
- **Settings contract**: all configuration flows through the `NSIDE_WEFA` dict. When adding options, document in `django/README.md`, add system checks in `checks.py`, and ensure defaults keep migrations optional.
- **APIs & serializers**: follow DRF patterns already present; keep authentication utilities DRY by placing shared logic under `utils/`. Expose URLs through `include('nside_wefa.<app>.urls')` and cover them in tests.
- **Testing & quality**: use pytest with Django (`pytest` or `python manage.py test`) plus coverage when needed. Run `ruff format .`, `ruff check .`, and `mypy nside_wefa/` before submission. Demo project (`django/demo`) is available for manual validation.

## Shared Workflow Expectations
- Stay within the workspace toolchain: `uv`/pip + Hatchling builds for Django, npm scripts + Vite for Vue.
- Keep lockfiles consistent with the package manager in use (`uv.lock`, `package-lock.json`).
- Maintain documentation parity: adjust relevant READMEs, MDX docs, or changelog entries (once introduced) whenever behaviour changes.
- For cross-cutting features, coordinate backend API shape first, then wire the frontend through the generated clients/composables.

## Decision Checklists
- **Before shipping backend change**:
  - [ ] Update/extend system checks and settings docs.
  - [ ] Provide migrations only when required and reversible.
  - [ ] Add pytest coverage for new branches/edge cases.
- **Before opening a PR**:
  - [ ] Run required backend lint/format/test commands.
  - [ ] Update backend docs/demo snippets as needed.
  - [ ] Document breaking changes and version impacts.

## Quick Command Reference
- Backend install: `cd django && pip install -e .[dev]` (or `uv sync --all-extras`)
- Backend tests: `cd django && pytest`
- Backend lint/type: `cd django && ruff check . && ruff format --check && mypy nside_wefa/`

## When in Doubt
- Re-read the relevant `README.md` and `CONTRIBUTE.md` before altering flows.
- Trace existing backend implementations (e.g., `nside_wefa/legal_consent`) to mirror patterns.
- Surface open questions early (e.g., new authentication modes) so design/system owners can confirm direction.

Following this guide keeps contributions aligned with the existing architecture, ensures compliance with the WeFa component hierarchy, and preserves release quality across both Django and Vue packages.
