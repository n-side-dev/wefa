# Ecosystem Map

## Purpose

Use this reference when deciding which tool or layer to use for Vue code that depends on WeFa, whether in a consuming app or in the WeFa library itself.

## Library Identity

`@nside/wefa` is a PrimeVue superset. The normal path is:

1. Reuse an existing WeFa component or container.
2. Compose PrimeVue when WeFa does not provide the needed primitive.
3. Fall back to native HTML only when both higher layers fail.

If a native element is chosen while PrimeVue already solves the problem, that choice should be justified and rare.

When working in a consuming app, think in layers:

1. Existing app-level abstraction or local pattern
2. WeFa abstraction
3. PrimeVue building block
4. Native Vue or HTML primitive

## Tool Selection By Concern

### UI primitives

- Search for a neighboring feature in the current app before adding a new primitive.
- Check `@nside/wefa` exports before composing PrimeVue from scratch.
- Use PrimeVue as the default building-block layer below WeFa.
- Use native HTML only as an escape hatch.

### Routing and navigation

- Prefer the host app's existing router conventions.
- If WeFa already provides the navigation-shaped abstraction you need, prefer it over rebuilding the interaction locally.
- Inside the WeFa repo, check `vue/src/router` and existing routed containers before adding route helpers from scratch.

### State management

- Keep state local to the component or composable when it is screen-local and short-lived.
- Reach for Pinia only when the state is app-level, cross-route, or already follows an existing store-driven pattern.
- Avoid introducing a store just to move local component state elsewhere.

### Translations

- In WeFa-based code, use the established i18n helpers instead of hard-coded strings.
- Inside the WeFa repo, use `vue/src/locales/index.ts` and `useI18nLib`, and add locale messages under `vue/src/locales/<locale>/`.
- Treat `aria-label`, placeholders, helper text, dialog titles, and validation copy as translatable UI.

### Networking

- Prefer `typedApiClient` when an OpenAPI-generated callable exists.
- Prefer `apiClient` for simple URL-based GET/POST flows.
- Use direct TanStack Query hooks only when the wrappers do not model the behavior cleanly.
- Use `axiosInstance` directly only below the query layer or for calls that should not be modeled as TanStack-managed server state.

### Documentation and demos

- In consuming apps, keep examples and tests close to the app's existing conventions.
- Inside the WeFa repo, public components and containers usually need a story, MDX docs, and tests next to the implementation.
- Treat `vue/src/demo` as the manual integration surface, not as a place for reusable library logic.
- Treat `vue/src/demo/openapi` as generated code.

## Useful Anchors

- Package imports: `@nside/wefa`, `@nside/wefa/network`, `@nside/wefa/types`
- Repo-only anchors: `vue/src/lib.ts`, `vue/src/containers/index.ts`, `vue/src/network`, `vue/src/router`, `vue/src/plugins`, `vue/src/stores`
- Repo-only translation guidance: `vue/src/locales/Translation.mdx`
- Repo-only network guidance: `vue/src/network/network.mdx`

## Smell Checks

- New component created even though a WeFa or PrimeVue equivalent already exists
- Hard-coded strings instead of i18n keys
- New store for state that could remain local
- Repo-only demo shortcuts copied into reusable code
- Direct axios or raw TanStack usage where the wrappers already fit
