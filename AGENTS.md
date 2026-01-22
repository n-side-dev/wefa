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

## Core Engineering Principles
- **Reuse-first UI rule (non-negotiable)**: 1) Prefer existing WeFa components exported from `@nside/wefa`. 2) If absent, compose PrimeVue building blocks. 3) Only fall back to native HTML with an inline comment explaining why higher tiers failed. Never ship custom `<style>` blocks or CSS, imports—Tailwind utility classes only.
- **Convention over configuration**: align with provided settings helpers (`NSIDE_WEFA` for Django, PrimeUI + Tailwind defaults for Vue) before introducing bespoke wiring.
- **Type safety & documentation**: keep TypeScript and Python type hints accurate, add docstrings or inline comments only when logic is non-obvious, and update README/MDX/Storybook alongside behavioural changes.
- **Tests as gatekeepers**: extend existing pytest/Vitest/Playwright suites when behaviour changes; no feature lands without matching tests unless explicitly justified.

## Frontend Playbook (`vue/`)
- **Component discovery**: inspect `src/components`, exported barrels (`src/components/**/index.ts`), and `@nside/wefa` type definitions before crafting new UI. Use `npm info @nside/wefa` or the local `dist/lib.d.ts` for quick lookup.
- **PrimeVue composition**: when WeFa lacks a widget, compose PrimeVue primitives with Tailwind classes. Imports follow `import Component from 'primevue/component'` and styling sticks to utility classes or theme tokens (`bg-primary-500`, `text-surface-900`, etc.).
- **State & data utilities**: rely on provided composables (`src/composables`), Pinia stores (`src/stores`), and network helpers (`src/network`). Prefer enhancing these layers rather than re-implementing ad-hoc logic inside components.
- **Props definition**: use `const { prop1 = prop1Default, ... } = defineProps<YourPropsType>()` with explicit interfaces/types. Avoid the usage of `withDefault()`.
- **Stories & docs**: every component lives with `.stories.ts`, `.mdx`, and spec files under its folder. Keep stories authoritative and update MDX docs when props/state change.
- **Quality gates**: run `npm run lint-check`, `npm run format-check`, `npm run test:unit`, `npm run test:e2e` (when flows/routing change), `npm run build`, and regenerate Storybook (`npm run storybook` or `npm run build-storybook`) before handing work off.

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
- **Before implementing UI**:
  - [ ] Confirm component exists in `@nside/wefa`; reuse when possible.
  - [ ] Evaluate PrimeVue composition options; plan Tailwind class usage.
  - [ ] Prepare justification comment if falling back to raw HTML.
- **Before shipping backend change**:
  - [ ] Update/extend system checks and settings docs.
  - [ ] Provide migrations only when required and reversible.
  - [ ] Add pytest coverage for new branches/edge cases.
- **Before opening a PR**:
  - [ ] All required lint/format/test commands executed (per workspace).
  - [ ] Docs, stories, or demo snippets updated.
  - [ ] Screenshots or recordings captured for visible UI changes.
  - [ ] Breaking changes documented and version impacts noted.

## Quick Command Reference
- Frontend dev server: `cd vue && npm run dev`
- Frontend build: `cd vue && npm run build`
- Frontend tests: `cd vue && npm run test:unit` / `npm run test:e2e`
- Storybook: `cd vue && npm run storybook`
- Backend install: `cd django && pip install -e .[dev]` (or `uv sync --all-extras`)
- Backend tests: `cd django && pytest`
- Backend lint/type: `cd django && ruff check . && ruff format --check && mypy nside_wefa/`

## When in Doubt
- Re-read the relevant `README.md` and `CONTRIBUTE.md` before altering flows.
- Trace existing implementations (e.g., `src/components/FormComponent`, `nside_wefa/legal_consent`) to mirror patterns.
- Consult `vue/scripts/files/copilot-instructions.md` for the authoritative UI decision matrix—this agent guide should enforce, not replace, those rules.
- Surface open questions early (e.g., new authentication modes, bespoke styling) so design/system owners can confirm direction.

Following this guide keeps contributions aligned with the existing architecture, ensures compliance with the WeFa component hierarchy, and preserves release quality across both Django and Vue packages.
