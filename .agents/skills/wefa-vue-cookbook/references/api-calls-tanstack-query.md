# API Calls With TanStack Query

## Purpose

Use this reference when adding or reviewing API calls, wrapper choice, query configuration, cache invalidation, optimistic updates, or TanStack Query Vue v5 usage in WeFa-based Vue code.

## Decision Order

1. Prefer `typedApiClient` from `@nside/wefa/network` when an OpenAPI-generated callable exists.
2. If the host app exposes a local wrapper around WeFa's network helpers, follow that local wrapper instead of bypassing it.
3. Prefer `apiClient` for straightforward URL-based GET and POST flows.
4. Use direct `@tanstack/vue-query` hooks only when the wrappers cannot model the needed behavior cleanly.
5. Use `useQueryClient` whenever wrapper-backed flows still need invalidation or other cache management.
6. Use `axiosInstance` directly only for lower-level infrastructure or non-query-managed calls.

This is the preferred order for WeFa-based code. When the host project already wraps WeFa's network layer locally, keep following that local abstraction boundary.

TanStack Query already provides the main building blocks for fetching, caching, reactivity, retries, invalidation, and mutation lifecycle state. Prefer those built-in features over hand-rolled refs, watches, loading flags, or manual cache synchronization.

## Setup Order

1. Install `VueQueryPlugin` at app startup.
2. If the app needs non-default cache behavior, pass `queryClientConfig` or a stable `QueryClient` instance to `VueQueryPlugin`; do not create query clients inside components or composables.
3. Configure `axiosInstance.defaults.baseURL` when env wiring is absent.
4. Call `typedApiClient.setupOpenApiClient(client)` before using generated SDK callables.
5. Continue app, router, i18n, feature, and backend-store setup.

Do not create query clients inside components or feature composables.

## Wrapper Conventions In WeFa

### `apiClient.query`

- Accepts a `Ref<string | undefined>`
- Uses `[url]` as the query key
- Suppresses fetches when the URL ref is empty

### `typedApiClient.query`

- Accepts a generated callable plus `Ref<TOptions | undefined>`
- Uses `[callable.name, options]` as the query key
- Suppresses fetches when the options ref is empty
- Unwraps `result.data`

### `typedApiClient.mutation`

- Wraps generated POST/PUT/DELETE callables
- Unwraps `result.data`
- Throws Axios-like errors when `isAxiosError` is present

Current wrapper boundaries are ref-oriented. For new direct-hook abstractions, plain values or reactive getters may still be reasonable, but do not silently change wrapper ergonomics in feature code.

## Important Defaults

- Cached query data is stale by default.
- Stale queries refetch automatically on mount, window refocus, and network reconnect unless you opt out.
- Inactive queries are garbage-collected after 5 minutes by default through `gcTime`.
- Failed queries retry 3 times with exponential backoff by default.
- Query results are structurally shared by default.

Implication:

- Set `staleTime` intentionally before disabling refetch triggers.
- Change `gcTime`, retry behavior, or refetch policies only when the UX or API cost justifies it.

## Query Workflow

1. Build reactive inputs first with `ref`, `toRef`, or `computed`.
2. Put every fetch dependency in the query key.
3. Treat fetched data as immutable.
4. Prefer wrapper signatures that already encode WeFa's reactive patterns:
   `apiClient.query(refUrl)` and `typedApiClient.query(callable, refOptions)`.
5. Use TanStack features before custom orchestration:
   `enabled`, `select`, `placeholderData`, `staleTime`, `gcTime`, `retry`, cancellation via `signal`, and `queryOptions(...)` should usually replace watcher-based or ref-based control flow.
6. Use `queryOptions(...)` when sharing direct-hook configuration across multiple call sites.
7. Pass `signal` through custom direct-query functions when cancellation matters.

## Mutation Workflow

1. Start with wrapper mutations unless there is a concrete gap.
2. After success, prefer one of two cache-update paths:
   invalidate related queries with `useQueryClient().invalidateQueries(...)`, or
   write returned entity data into the cache with `setQueryData(...)` only when you own the exact key shape or a direct-hook abstraction exposes it clearly.
3. Await invalidation when the UI should remain pending until related queries refresh.
4. Use optimistic updates only when the UX benefit clearly justifies rollback complexity; pair them with `onMutate`, rollback context, and targeted invalidation.
5. Prefer `useMutation` lifecycle hooks and cache APIs over custom pending, error, or success state machines.

## v5 Migration Checks

- Use the single-object hook signature, not older positional overloads.
- Do not add `onSuccess`, `onError`, or `onSettled` to query options; those query callbacks were removed in v5.
- Use `gcTime` instead of `cacheTime`.
- Use `throwOnError` instead of `useErrorBoundary`.
- Replace old `keepPreviousData` patterns with `placeholderData`.
- Infinite queries need `initialPageParam` and `getNextPageParam`.
- `useQueries` returns a `ref` wrapping the array, not a reactive array directly.
- Mutation loading state is `isPending`, not the older `isLoading`.

## Review Checklist

1. Did the code use the highest-level fitting abstraction?
2. Are the query keys complete and stable?
3. Was reactivity preserved, or did the code unwrap `.value` too early?
4. Were `staleTime`, `gcTime`, retries, and refetch triggers chosen intentionally?
5. Are the semantics v5-correct:
   `gcTime` instead of `cacheTime`, `throwOnError` instead of `useErrorBoundary`, and `placeholderData` instead of old `keepPreviousData` patterns?
6. Did the implementation avoid common pre-v5 patterns such as positional hook overloads, query callbacks, or infinite queries without `initialPageParam`?
7. Did the implementation use TanStack features that already exist instead of rebuilding fetch state, caching, or mutation bookkeeping manually?

## Testing Boundaries

### Wrapper tests

- Location: wherever the host project keeps network-wrapper tests
- Pattern: mock `@tanstack/vue-query` directly and assert wrapper configuration

### Feature tests

- Pattern: mock the host project's network wrapper unless the feature truly owns direct TanStack configuration
- Goal: test feature behavior against the wrapper contract, not TanStack internals

## Inside The WeFa Repo

Use this section only when the task is inside the WeFa repository itself.

- Concrete startup reference: `vue/src/demo/main.ts`
- Network guidance: `vue/src/network/network.mdx`
- Wrapper test location: `vue/src/network/__tests__/`
- Keep repo docs in sync:
  `vue/README.md` when consumer setup changes,
  `vue/CONTRIBUTE.md` when validation expectations change,
  `vue/AGENTS.md` and the repo-root `AGENTS.md` when skill-routing guidance changes

## Smell Checks

- Raw axios used in a normal query flow that wrappers already support
- Manual cache writes without owning the key shape
- Query keys missing a dependency used by `queryFn`
- Query data mutated directly in component state
