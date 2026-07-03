# Design And Architecture

## Purpose

Use this reference when shaping new Vue features, reviewing architectural fit, or deciding where code belongs in a WeFa-based codebase.

## SFC structure

Use the following as the recommended SFC organization order. If the host project already has a strong local pattern, keep that pattern, but still split each concern with short comment delimiters inside the SFC.

- Top-level block order should follow the host project rules.
  The default order is `template -> script -> style`.
- Inside `script setup lang="ts"`, the recommended concern order is:
  - imports
  - hardcoded constants
  - reference state: props and their types, `v-model`s, router params, and the refs that define the base state of the SFC
  - emits and `defineExpose`, with their types when needed
  - additional local types and interfaces used by the code that follows
  - local helper functions needed by later sections; move reusable logic to composables or utils files
  - derived and integrated reactive state: computed values, TanStack Query or WeFa query hooks with their options and extracted results, store reads, and data reshaping before passing to child components
  - watchers
  - lifecycle hooks
  - one-time initialization calls

## Core Design Rules

1. Mirror the closest existing implementation before inventing a new pattern.
2. Keep related files close to the feature when the host codebase already uses that pattern.
3. Prefer extending the current public surface over creating parallel entrypoints.
4. Keep product-app code inside the app and reusable library code inside the library; do not blur those layers accidentally.
5. If working inside the WeFa repo, keep the library surface in `src/`, use `src/demo/` only for demo wiring, and do not hand-edit generated clients in `src/demo/openapi/`.

## Placement Heuristics

Ask first: "Is this behavior app-specific, reusable within the app, or reusable across products?"

- App-specific behavior belongs in the consuming app, close to its feature.
- WeFa-specific reusable behavior belongs in the library only when it is broadly reusable and consistent with the library's scope.
- Do not push product logic down into WeFa just because the current task is happening in the WeFa repo.

## Repo-Specific Folder Heuristics

### `vue/src/components`

Use for reusable UI primitives and composable visual building blocks.

### `vue/src/containers`

Use for higher-level routed or layout-aware building blocks that compose multiple primitives and often integrate router concerns.

### `vue/src/network`

Use for shared HTTP and TanStack Query infrastructure, not feature-local fetch logic that belongs inside an existing wrapper consumer.

### `vue/src/router`, `vue/src/plugins`, `vue/src/stores`

Check these before adding new helpers elsewhere. Many cross-cutting needs already have a home.

### `vue/src/demo`

Use for example integration, routed showcase flows, and local manual validation. Keep library abstractions out of the demo unless they are intentionally part of the public package.

## Public Surface Rules

1. If a new abstraction should be reused, expose it through the codebase's normal public surface instead of relying on deep imports.
2. If a change alters setup or usage for consumers, update the surrounding docs or examples.
3. Inside the WeFa repo, wire the nearest `index.ts`, shared entrypoint, and supporting docs when the library surface changes.

## Component Design Checks

- Does the API mirror the nearest comparable WeFa component?
- Is the component wrapping or composing PrimeVue rather than re-implementing the primitive?
- Are prop defaults expressed with `const { prop = defaultValue } = defineProps<Type>()` unless the local file pattern already depends on `withDefaults()`?
- If inside the WeFa repo, is the SFC block order `template -> script -> style`?
- Are user-visible states documented and tested according to the host project's conventions?

## Architecture Smells

- Generic helper added in a feature folder even though a shared helper area already exists
- Shared abstraction added to WeFa even though the need is product-specific
- Public component added without exports, docs, or tests
- Demo code copied into library code
- New pattern introduced despite a strong neighboring precedent
- English literals embedded in components instead of locale keys

## Review Prompt

Ask: "If another developer adds the next feature beside this one, will they be able to copy a clear local pattern?"
