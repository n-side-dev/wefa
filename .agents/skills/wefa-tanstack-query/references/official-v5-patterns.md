# Official TanStack Query Vue v5 Patterns

This file distills the official Vue v5 docs into the guidance most likely to matter in WeFa work.

## Source Pages

- Overview: `https://tanstack.com/query/v5/docs/framework/vue/overview`
- Reactivity: `https://tanstack.com/query/v5/docs/framework/vue/reactivity`
- Important Defaults: `https://tanstack.com/query/v5/docs/framework/vue/guides/important-defaults`
- Query Keys: `https://tanstack.com/query/v5/docs/framework/vue/guides/query-keys`
- Query Options: `https://tanstack.com/query/v5/docs/framework/vue/guides/query-options`
- Mutations: `https://tanstack.com/query/v5/docs/framework/vue/guides/mutations`
- Invalidations from Mutations: `https://tanstack.com/query/v5/docs/framework/vue/guides/invalidations-from-mutations`
- Updates from Mutation Responses: `https://tanstack.com/query/v5/docs/framework/vue/guides/updates-from-mutation-responses`
- Optimistic Updates: `https://tanstack.com/query/v5/docs/framework/vue/guides/optimistic-updates`
- Query Cancellation: `https://tanstack.com/query/v5/docs/framework/vue/guides/query-cancellation`
- Custom Client: `https://tanstack.com/query/v5/docs/framework/vue/guides/custom-client`
- Migrating to v5: `https://tanstack.com/query/v5/docs/framework/vue/guides/migrating-to-v5`

## Important Defaults

- Cached query data is stale by default.
- Stale queries refetch automatically when a new instance mounts, the window refocuses, or the network reconnects.
- Inactive queries remain cached and are garbage-collected after 5 minutes by default.
  This 5-minute horizon is TanStack's default inactive-query `gcTime`, not a WeFa-specific policy.
- Failed queries retry 3 times with exponential backoff by default.
  These are TanStack defaults: `retry` defaults to `3`, and the default `retryDelay` doubles from 1000 ms up to 30000 ms.
- Query results are structurally shared by default, which preserves references when JSON-compatible data has not meaningfully changed.

Implication:

- Set `staleTime` intentionally before disabling refetch triggers.
- If your app needs a different inactive-query cache horizon, change the default query `gcTime`.
- If your app needs different retry behavior, change the default query `retry` and `retryDelay` options globally or per-query. Use `retry: false`, a number, or a function; use `retryDelay` as either a fixed number or a function.
- Change `gcTime`, `retry`, or refetch policies only when the UX or API cost justifies it.

## Reactivity Rules

- `queryKey` and `enabled` can consume reactive values.
- If a query should refetch when an input changes, pass the ref or reactive getter itself, not an eagerly-unwrapped `.value`.
- For composables, prefer parameter types that accept plain values, refs, or reactive getters when the API benefits from both reactive and non-reactive use sites.
- Query results are immutable; create a copy before editing or two-way binding.

## Query-Key Rules

- Include every changing variable that the query function depends on.
- Array item order matters in keys.
- Object property order inside a key segment does not matter because keys are hashed deterministically.

Implication:

- When a fetch depends on filters, pagination, IDs, locale, or auth-relevant scope, put those into the key.

## Shared Query Definitions

Use `queryOptions(...)` when the same key, function, and defaults need to be reused across:

- `useQuery`
- `useQueries`
- prefetching
- imperative cache reads/writes tied to the same key

This keeps the authoritative query shape in one place while preserving strong TypeScript inference.

## Mutation Rules

- Mutations do not update related queries automatically.
- After success, either invalidate related queries or update the cache directly with `setQueryData(...)`.
- If the mutation response already contains the full updated entity, prefer `setQueryData(...)` over a blind refetch.
- If follow-up invalidations must finish before the mutation is considered complete, return or await the invalidation promise from `onSuccess`.

## Optimistic Updates

Use optimistic updates only when:

- the interaction benefits materially from immediate UI feedback, and
- you can define a safe rollback strategy

Typical shape:

1. `onMutate`: cancel overlapping queries, snapshot previous cache, write optimistic value
2. `onError`: roll back with the snapshot
3. `onSettled` or `onSuccess`: invalidate the affected queries

## Cancellation

- Direct query functions receive an `AbortSignal`.
- If your transport supports cancellation, pass the signal through.
- Manual cancellation uses `queryClient.cancelQueries({ queryKey })`.

This matters most for long-running or rapidly-changing direct queries.

## Custom Client

- `VueQueryPlugin` accepts either `queryClientConfig` or a prebuilt `QueryClient`.
- Keep the client stable and app-scoped.
- Reach for a custom client only when defaults or integration requirements demand it.

## v5 Migration Notes

- v5 only supports the single-object hook signature. Do not copy older positional overloads like `useQuery(key, fn, options)`.
- Query callbacks were removed from `useQuery` and `QueryObserver`; do not add `onSuccess`, `onError`, or `onSettled` to query options. Mutation callbacks still exist.
- `cacheTime` was renamed to `gcTime`.
- `useErrorBoundary` was renamed to `throwOnError`.
- `keepPreviousData` behavior now maps to `placeholderData` with the previous value identity pattern.
- Infinite queries now require `initialPageParam`, and `getNextPageParam` is required when using infinite-query pagination.
- `useQueries` now returns a `ref` that wraps the array instead of returning a reactive array directly.
- Query and mutation loading state terminology changed: `status: loading` became `status: pending`, and `isLoading` on mutations became `isPending`.
- The removed hook-level `context` prop from older examples was replaced by passing a custom `queryClient`; in Vue, `queryClientKey` is still supported through `VueQueryPlugin` and per-query options when custom client keys are needed.

If you encounter older examples or local code written against v4 language, translate them to these v5 terms before copying the pattern.
