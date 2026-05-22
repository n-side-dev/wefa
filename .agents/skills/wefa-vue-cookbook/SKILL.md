---
name: wefa-vue-cookbook
description: Shared cookbook of conventions for writing Vue code with the WeFa ecosystem. Use it first in product apps that consume `@nside/wefa`, and also use it inside the WeFa `vue/` package for the shared rules that apply there too. It covers architecture and layout conventions, WeFa versus PrimeVue reuse decisions, i18n expectations, validation planning, and TanStack Query Vue v5 usage including wrapper choice, query keys, invalidation, optimistic updates, and v5 migration pitfalls.
---

# WeFa Vue Cookbook

This is the shared Vue skill for WeFa.

Use it in two situations:

1. In consuming Vue projects that use `@nside/wefa`.
2. Inside the WeFa `vue/` package for the shared conventions that also apply to the library itself.

When the task is inside the WeFa `vue/` package, pair this skill with `wefa-vue-frontend`, which is the maintainer skill for repo-specific export, docs, demo, generated-artifact, and quality-gate work.

Use this skill in two layers:

1. Keep this `SKILL.md` loaded for the always-on rules.
2. Load only the matching reference file when the task needs deeper checks.

## Always-Loaded Rules

1. Treat `@nside/wefa` as a PrimeVue superset styled through Tailwind 4 with `tailwindcss-primeui`.
2. Follow the reuse hierarchy strictly: **WeFa component/container -> PrimeVue composition -> native HTML fallback**.
3. Start by mirroring the nearest existing local pattern before inventing a new abstraction, prop API, fetch flow, or styling approach.
4. Before adding helpers or infrastructure, check whether the current app, WeFa, or PrimeVue already provides the needed building block.
5. Keep user-facing text translated through i18n keys, including labels, placeholders, validation copy, `aria-label`, and `title`.
6. Prefer Tailwind utilities for routine styling. Use flex by default for layout, reach for grid when it clearly fits better, and do not add new CSS imports or routine `<style>` blocks.
7. For server state, prefer `typedApiClient` when an OpenAPI-generated callable exists, then `apiClient` for straightforward URL-based GET or POST flows, then direct TanStack Query hooks only when the wrappers cannot model the behavior cleanly, then raw `axiosInstance` only for lower-level infrastructure or non-query-managed calls.
8. TanStack Query already covers most fetch lifecycle, caching, retries, invalidation, and mutation state. Prefer built-in query and cache features over hand-rolled refs, watches, loading flags, or manual cache synchronization.
9. Treat TanStack query data as immutable. Copy it before binding to `v-model` or mutating it locally.
10. Put every changing query dependency into the query key, and avoid unwrapping reactive inputs too early if the query should react to them.
11. Parent components own external layout and sizing context. Reusable children should not assume fill behavior or decorative outer chrome unless that is part of their explicit contract.
12. When shared or public-facing behavior changes, update the surrounding tests, docs, and usage examples expected by that codebase.
13. Run the validation commands that match the host project and the risk of the change. If working inside the WeFa repo, `wefa-vue-frontend` adds the exact repo gate.

## First Reads

1. Inspect how the current codebase already uses `@nside/wefa`, PrimeVue, i18n, and network helpers before introducing new patterns.
2. If the task touches API calls, cache behavior, invalidation, optimistic updates, or direct `@tanstack/vue-query` hooks, load `references/api-calls-tanstack-query.md`.
3. If the task is inside the WeFa repo's `vue/` package, also read `vue/AGENTS.md` and then load `wefa-vue-frontend` for maintainer-only rules.

## Topic References

- `references/ecosystem-map.md`
  Load when choosing between WeFa, PrimeVue, local app code, router/plugins/stores helpers, i18n, or network layers.
- `references/design-and-architecture.md`
  Load when designing a new component/container/composable, choosing where code belongs, or reviewing whether code fits the intended architecture.
- `references/css-guidelines.md`
  Load when styling components, deciding whether CSS is allowed, or reviewing Tailwind/PrimeVue usage, flex-first layout choices, and parent/child layout ownership.
- `references/api-calls-tanstack-query.md`
  Load when adding or reviewing API calls, wrapper choice, startup wiring, query keys, cache behavior, invalidation, optimistic updates, or TanStack Query Vue v5 usage and migration pitfalls.
- `references/delivery-and-validation.md`
  Load when deciding what checks, tests, docs, or review hygiene should accompany the change.

## Package Anchors

- Main package import: `@nside/wefa`
- Network helpers: `@nside/wefa/network`
- Type exports: `@nside/wefa/types`

## Repo Anchors

Use these only when the task is inside the WeFa repository:

- Public library entrypoints: `vue/src/lib.ts`, `vue/src/containers/index.ts`
- Canonical public component shape: `vue/src/components/AutoroutedBreadcrumb/`
- Translation guidance: `vue/src/locales/Translation.mdx`
- Network guidance: `vue/src/network/network.mdx`

## Definition of Done

1. The implementation follows the WeFa -> PrimeVue -> native hierarchy.
2. The chosen tool matches the highest-level fitting abstraction instead of the first thing that works.
3. Styling stays inside the Tailwind + PrimeVue theme conventions, with parent-owned layout and intentional child fill behavior.
4. Tests, docs, examples, and translations are updated when the changed surface requires them.
5. The relevant validation commands for the current codebase have been run.
