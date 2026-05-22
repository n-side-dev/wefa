# WeFa Vue - Agent Guide

## Scope

This file applies to the `@nside/wefa` Vue 3 workspace in `vue/`: components, containers, composables, stores, router helpers, network helpers, locales, demo code, Storybook docs, tests, and packaging helpers.

Read [README.md](/Users/ala/N-SIDE/wefa/vue/README.md) and [CONTRIBUTE.md](/Users/ala/N-SIDE/wefa/vue/CONTRIBUTE.md) before changing public exports, package behavior, docs, or validation commands.

## Skill Routing

- Load `wefa-vue-cookbook` first for any Vue work here.
- `wefa-vue-cookbook` is the shared base skill for the WeFa Vue ecosystem: it applies to consuming projects that use `@nside/wefa`, and it also applies inside this repository for the shared conventions that the library follows too.
- After the cookbook, load `wefa-vue-frontend` for repo-specific maintainer guidance in this `vue/` workspace.
- `wefa-vue-frontend` adds only repo-specific rules for exports, Storybook and MDX docs, demo wiring, generated artifacts, frontend tests, and the package quality gate.
- For TanStack Query setup, query or mutation flows, invalidation, or wrapper-choice work, also use `wefa-tanstack-query`.
- [`.github/copilot-instructions.md`](/Users/ala/N-SIDE/wefa/vue/.github/copilot-instructions.md) is a compatibility pointer only, not the source of truth.

## UI And Composition Rules

- Treat public WeFa components as an enhancement layer over PrimeVue.
- Reuse hierarchy is strict: WeFa component or container first, then PrimeVue composition, then native HTML only when neither higher layer fits cleanly.
- Reuse public-surface exports first. Start discovery at `src/lib.ts`, `src/containers/index.ts`, and nearby feature `index.ts` files.
- Prefer Tailwind utility classes for routine styling. Do not add new CSS imports for routine work.
- Use scoped styles only when an existing local pattern or unavoidable layout math makes Tailwind impractical.
- Follow adjacent component patterns for props, emits, tests, stories, docs, and file naming.
- Keep user-facing literals translated, including labels, placeholders, validation copy, `title`, and accessibility text.

## Repo-Specific Rules

- New or changed public components usually need source, stories, tests, and MDX docs when consumer guidance is non-trivial.
- Update nearest `index.ts` files and shared entrypoints when public surface changes.
- Treat `src/demo/` as a manual-validation surface, not as a home for reusable library logic.
- Do not hand-edit generated demo OpenAPI client artifacts; regenerate them through the existing script.
- Keep Storybook docs, demo flows, and README-facing examples aligned with implementation changes.
- SFC block order is enforced: `<template>` then `<script>` then `<style>`.
- Storybook stories should not add the `autodocs` tag unless the Storybook setup itself changes.

## Validation Commands

Run from `vue/` unless noted:

```bash
npm install
npm run lint-check
npm run type-check
npm run format-check
npm run test:unit -- --reporter=dot --silent
npm run build
npm run test:e2e -- --reporter=dot
npm run test:package-types
```

Use `npm run test:e2e` when routing, demo flows, browser behavior, or integration paths change. Use `npm run test:package-types` when exports, packaging, declaration generation, or subpaths change. If running a subset, state what remains unrun.
