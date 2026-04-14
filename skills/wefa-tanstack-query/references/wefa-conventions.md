# WeFa TanStack Query Conventions

## Purpose

Capture the project-specific rules that sit on top of TanStack Query Vue v5 in this repository.

## Preferred Entry Points

1. `vue/src/network/typedApiClient.ts`
   Use first when the backend exposes OpenAPI-generated callables.
2. `vue/src/network/apiClient.ts`
   Use for simple URL-based GET and POST flows.
3. Direct `@tanstack/vue-query` hooks
   Use only when the wrappers do not cover the required behavior.
4. `vue/src/network/axios.ts`
   Use directly only for lower-level infrastructure or non-cached calls.

This mirrors the order documented in `vue/src/network/network.mdx`.

## Existing Wrapper Patterns

### `apiClient.query`

- Input shape: `Ref<string | undefined>`
- Key shape: `[url]`
- Fetch suppression: `enabled: () => !!url.value`
- Query function behavior: return `undefined` when the URL is absent
- Current wrapper boundary: do not pass plain values or reactive getters directly; wrap prop access with `toRef`, `computed`, or another `Ref`-producing helper first

### `typedApiClient.query`

- Input shape: generated callable plus `Ref<TOptions | undefined>`
- Key shape: `[callable.name, options]`
- Fetch suppression: `enabled: () => !!options.value`
- Query function behavior:
  - return `undefined` when options are absent
  - unwrap `result.data`
  - throw results that expose `isAxiosError`
- Current wrapper boundary: plain values and reactive getters are excellent for new direct-hook composables, but this wrapper still expects a `Ref`

### `typedApiClient.mutation`

- Wrap generated POST/PUT/DELETE callables
- Unwrap `result.data`
- Throw Axios-like errors when `isAxiosError` is present

## Startup Order In This Repo

See `vue/src/demo/main.ts` for the concrete example.

1. `app.use(VueQueryPlugin)`
2. Configure `axiosInstance.defaults.baseURL` if env wiring is not present
3. Call `typedApiClient.setupOpenApiClient(client)` when generated SDK code exists
4. Continue app/plugin/router/i18n setup

There is currently no custom `QueryClient` policy in the demo app. If you add one, keep it app-level and document why the defaults were changed.

## Query-Key Guidance For Repo Work

Use the existing wrapper key shapes unless you are intentionally upgrading the abstraction.

- URL wrapper: `[url]`
- Typed wrapper: `[callable.name, options]`

If you introduce a new reusable direct-hook composable, prefer a small local key factory or `queryOptions(...)` helper instead of scattering ad-hoc keys across components.
If you need `setQueryData(...)`, prefer doing it in abstractions that own the exact key shape. Wrapper-backed feature code should usually invalidate instead of reconstructing internal keys by hand.

## Testing Boundaries

### Wrapper tests

Files:

- `vue/src/network/__tests__/apiClient.test.ts`
- `vue/src/network/__tests__/typedApiClient.test.ts`

Pattern:

- mock `@tanstack/vue-query`
- assert `queryKey`, `enabled`, forwarded options, and unwrapped/raised results

### Feature tests

Example:

- `vue/src/plugins/legalConsent/views/__tests__/LegalDocument.test.ts`

Pattern:

- mock `@/network`
- test the feature against the wrapper return shape instead of TanStack internals

## Documentation To Keep In Sync

- `vue/src/network/network.mdx` when public guidance changes
- `vue/README.md` if package-level setup or exports change
- `vue/CONTRIBUTE.md` if validation steps or expected checks change
