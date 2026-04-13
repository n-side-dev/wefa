---
name: wefa-tanstack-query
description: TanStack Query Vue v5 implementation and review guide for the WeFa `vue/` workspace. Use when adding or reviewing `@tanstack/vue-query` setup, query or mutation flows, cache invalidation, optimistic updates, query keys, or QueryClient defaults, and when deciding whether to use WeFa wrappers (`apiClient`, `typedApiClient`) versus direct TanStack hooks.
---

# WeFa TanStack Query

Apply TanStack Query Vue v5 with official v5 patterns while preserving WeFa's preferred wrapper-first architecture.

## First Reads

1. Read `references/wefa-conventions.md` first for repo-specific rules and preferred entrypoints.
2. Read `references/official-v5-patterns.md` when a task depends on cache semantics, reactivity, mutations, cancellation, or migration details.
3. Re-read `vue/src/network/network.mdx`, `vue/README.md`, and `vue/CONTRIBUTE.md` before changing public APIs or developer guidance.

## Decision Order

1. Prefer `typedApiClient` from `@/network` or `@nside/wefa/network` when an OpenAPI-generated callable exists.
2. Prefer `apiClient` when the call is a straightforward URL-based GET or POST and reactive URL refs are enough.
3. Use direct TanStack hooks (`useQuery`, `useMutation`, `useInfiniteQuery`, `queryOptions`) only when the wrappers cannot model the behavior cleanly.
4. Use `useQueryClient` whenever wrapper-backed flows still need invalidation or other cache management.
5. Use `axiosInstance` directly only when the task does not need TanStack-managed server state or when you are implementing infrastructure beneath the wrappers.

## Setup Workflow

1. Confirm app-level installation before feature work:
   `app.use(VueQueryPlugin)` must happen during startup.
2. If the app needs non-default cache behavior, pass `queryClientConfig` or a stable `QueryClient` instance to `VueQueryPlugin`; do not create query clients inside components or composables.
3. Configure `axiosInstance.defaults.baseURL` when env-based backend wiring is absent.
4. When OpenAPI codegen exists, call `typedApiClient.setupOpenApiClient(client)` during startup before using generated SDK callables.

## Query Workflow

1. Build reactive inputs first.
   For existing WeFa wrappers, pass `ref`, `toRef`, or `computed` values that match the current `Ref<... | undefined>` signatures. For new direct-hook composables, accept refs, plain values, or reactive getters when that improves ergonomics.
2. Put every query dependency into the query key.
   If `queryFn` depends on a changing variable, that variable belongs in the key.
3. Prefer wrapper signatures that already encode WeFa's reactive patterns:
   `apiClient.query(refUrl)` and `typedApiClient.query(callable, refOptions)`.
4. Use `queryOptions(...)` to share direct-query configuration across `useQuery`, `useQueries`, or prefetching sites.
5. Treat returned query data as immutable.
   Copy it before binding to `v-model` or mutating it locally.
6. Pass the provided `signal` through custom direct-query functions when cancellation matters and the transport supports it.

## Mutation Workflow

1. Start with `typedApiClient.mutation(...)` or `apiClient.mutation(...)` unless direct hooks are required.
2. After successful mutations, prefer one of two cache-update paths:
   invalidate related queries with `useQueryClient().invalidateQueries(...)`, or
   write returned entity data into the cache with `setQueryData(...)` only when you own the exact key shape or a direct-hook abstraction exposes it clearly.
3. Await invalidations when the mutation should remain pending until related queries are refreshed.
4. Use optimistic updates only when the UX gain is worth the rollback complexity; pair them with `onMutate`, rollback context, and targeted invalidation.

## Review Checklist

1. Prefer WeFa wrappers over raw TanStack hooks unless there is a concrete gap.
2. Keep query keys complete, stable, and consistent with the fetch inputs.
3. Use reactive values correctly; avoid extracting `.value` too early and accidentally freezing reactivity.
4. Adjust `staleTime`, `gcTime`, retries, or refetch triggers intentionally instead of cargo-culting defaults.
5. Update docs, tests, and public exports when adding new wrappers or network helpers.
6. Use TanStack Query v5 names and semantics:
   `gcTime` instead of `cacheTime`, `throwOnError` instead of `useErrorBoundary`, and `placeholderData` when replacing old `keepPreviousData` behavior.
7. Reject common pre-v5 patterns:
   positional hook overloads, `onSuccess` or `onError` on queries, infinite queries without `initialPageParam` and `getNextPageParam`, or `useQueries` code that assumes a reactive array instead of a `ref`.

## Testing

1. For wrapper tests in `vue/src/network/__tests__`, mock `@tanstack/vue-query` directly and assert the wrapper configuration.
2. For feature or component tests, mock `@/network` instead of TanStack internals unless the feature truly owns the hook configuration.
3. Run the standard Vue quality gates after behavior changes:
   `npm run lint-check`
   `npm run type-check`
   `npm run format-check`
   `npm run test:unit -- --reporter=dot --silent`
   `npm run build`
   `npm run test:e2e -- --reporter=dot` when routed or browser-driven flows changed

## References

- `references/wefa-conventions.md` for local wrapper/setup/test guidance.
- `references/official-v5-patterns.md` for distilled official TanStack Query Vue v5 rules and migration notes.
