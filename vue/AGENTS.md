# N-SIDE WeFa Vue – Agent Guide

## Scope
- This file is the source of truth for work inside `vue/`.
- Apply shared cross-workspace rules from the repository root `AGENTS.md`.

## Frontend Principles
- **Reuse-first UI rule (non-negotiable)**: 1) Prefer existing WeFa components exported from `@nside/wefa`. 2) If absent, compose PrimeVue building blocks. 3) Only fall back to native HTML with an inline comment explaining why higher tiers failed. Never ship custom `<style>` blocks or CSS imports; Tailwind utility classes only.
- **Convention over configuration**: align with PrimeVue + Tailwind defaults before introducing bespoke wiring.
- **Translations required for literals**: all user-facing literal strings in components (visible text, button labels, placeholders, `title`, `aria-label`, and similar accessibility text) must use the i18n system via translation keys; do not hardcode them in `.vue` files.
- **Type safety & documentation**: keep TypeScript types accurate, add comments only for non-obvious logic, and update README/MDX/Storybook with behavioural changes.
- **Tests as gatekeepers**: extend existing Vitest/Playwright coverage when behaviour changes; no feature lands without matching tests unless explicitly justified.

## Frontend Playbook
- **Component discovery**: inspect `src/components`, exported barrels (`src/components/**/index.ts`), and `@nside/wefa` type definitions before crafting new UI. Use `npm info @nside/wefa` or local `dist/lib.d.ts` for quick lookup.
- **PrimeVue composition**: when WeFa lacks a widget, compose PrimeVue primitives with Tailwind classes. Imports follow `import Component from 'primevue/component'`, and styling sticks to utility classes or theme tokens (`bg-primary-500`, `text-surface-900`, etc.).
- **State & data utilities**: rely on provided composables (`src/composables`), Pinia stores (`src/stores`), and network helpers (`src/network`). Prefer enhancing these layers rather than re-implementing ad-hoc logic in components.
- **Props definition**: use `const { prop1 = prop1Default, ... } = defineProps<YourPropsType>()` with explicit interfaces/types. Avoid `withDefault()`.
- **Stories & docs**: every component lives with `.stories.ts`, `.mdx`, and spec files under its folder. Keep stories authoritative and update MDX docs when props/state change.
- **Quality gates**: run `npm run lint-check`, `npm run type-check`, `npm run format-check`, `npm run test:unit`, `npm run test:e2e` (when flows/routing change), `npm run build`, and regenerate Storybook (`npm run storybook` or `npm run build-storybook`) before handoff.

## Decision Checklists
- **Before implementing UI**:
  - [ ] Confirm component exists in `@nside/wefa`; reuse when possible.
  - [ ] Evaluate PrimeVue composition options and plan Tailwind class usage.
  - [ ] Prepare justification comment if falling back to raw HTML.
- **Before opening a PR**:
  - [ ] Linting, type-check, and formatting checks executed (`npm run lint-check`, `npm run type-check`, `npm run format-check`).
  - [ ] Required frontend tests executed (`npm run test:unit`; `npm run test:e2e` when flows/routing changed).
  - [ ] Docs, stories, or demo snippets updated.
  - [ ] Screenshots or recordings captured for visible UI changes.
  - [ ] Breaking changes documented and version impacts noted.

## Quick Command Reference
- Frontend dev server: `npm run dev`
- Frontend build: `npm run build`
- Frontend linting: `npm run lint-check`
- Frontend type-check: `npm run type-check`
- Frontend formatting check: `npm run format-check`
- Frontend tests: `npm run test:unit` / `npm run test:e2e`
- Storybook: `npm run storybook` / `npm run build-storybook`

## When in Doubt
- Re-read `vue/README.md` and `vue/CONTRIBUTE.md` before altering flows.
- Trace existing implementations (for example `src/components/FormComponent`) to mirror patterns.
- Consult `scripts/files/copilot-instructions.md` for the authoritative UI decision matrix; this guide enforces, not replaces, those rules.
- Surface open questions early (for example bespoke styling or custom interaction patterns) so design/system owners can confirm direction.
