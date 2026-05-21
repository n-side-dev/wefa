# WeFa Vue - Agent Guide

## Scope

This file applies to the `@nside/wefa` Vue 3 workspace in `vue/`: components, containers, composables, stores, router helpers, network helpers, locales, demo code, Storybook docs, tests, and CLI installer assets.

Read `vue/README.md` and `vue/CONTRIBUTE.md` before changing public exports, package behavior, docs, or validation commands. Use `$wefa-vue-frontend` for frontend implementation and review work. Use `$wefa-tanstack-query` for TanStack Query setup, query/mutation flows, cache invalidation, query keys, and network wrapper decisions.

## UI And Composition Rules

- Treat public WeFa components as an enhancement layer over PrimeVue: they should wrap, extend, or compose PrimeVue behavior with clear added value for consumers.
- Reuse WeFa exports first. Start public-surface discovery at `src/lib.ts`, `src/containers/index.ts`, and nearest feature `index.ts` files.
- If WeFa does not provide the needed UI, compose PrimeVue components before using native HTML.
- Use native HTML only when WeFa and PrimeVue cannot model the requirement cleanly; leave a brief inline justification when the fallback is not obvious.
- Prefer Tailwind utility classes for routine styling. Do not add new CSS imports.
- Use scoped styles or bound style objects only when an existing feature pattern or layout math makes Tailwind impractical.
- Follow adjacent component patterns for props, emits, file names, tests, stories, and docs. Prefer `const { prop = defaultValue } = defineProps<Type>()` for defaults unless local code already uses another pattern.
- Use the `@/*` alias for source imports when it improves clarity and matches nearby files.

## Component Deliverables

- New public components should include the SFC, colocated Storybook stories, colocated unit tests, and consumer-facing MDX docs when usage or accessibility guidance is non-trivial.
- Storybook stories should demonstrate meaningful states and interactions; do not add the `autodocs` tag unless the Storybook setup changes to require it.
- Use Storybook for isolated manual validation when component behavior, visual states, or accessibility affordances change.

## Localization, Exports, And Generated Code

- Route user-facing literals through the library i18n helpers, including labels, placeholders, validation copy, titles, and accessibility text.
- Add or update locale resources under `src/locales/<locale>/` when library copy changes.
- When adding public surface, update nearest `index.ts` files and shared entrypoints such as `src/lib.ts` or `src/containers/index.ts`.
- Do not hand-edit generated OpenAPI client artifacts. Regenerate them with the existing script when needed.
- Prefer existing network wrappers: `typedApiClient` for generated callables, `apiClient` for URL-based flows, and direct TanStack hooks only when wrappers cannot model the behavior cleanly.

## Stories, Docs, And Tests

- New or changed components need Storybook stories and tests matching the nearby feature style.
- Add MDX docs when usage, accessibility, states, or props need consumer-facing guidance.
- Update demo wiring when routed or integrated flows change.
- Keep Storybook docs and README-facing examples consistent with implementation.
- Place tests in the layer that owns the behavior: component tests beside component folders, network wrapper tests under `src/network/__tests__`, store/router/locales tests near their modules, and Playwright specs under `e2e/`.
- Mock the highest stable boundary in tests: feature tests should usually mock WeFa network helpers, while network wrapper tests may mock transport or TanStack Query internals directly.
- Codex guidance should come from `AGENTS.md` files and skills, not generated assistant instruction artifacts.

## Validation Commands

Run from `vue/` unless noted:

```bash
npm run type-check
npm run lint-check
npm run format-check
npm run test:unit -- --reporter=dot --silent
npm run build
npm run test:package-types
npm run test:e2e -- --reporter=dot
npm run knip -- --exclude exports,unlisted,duplicates,devDependencies,files
npm audit --audit-level high
```

Use `npm run test:e2e` when routing, demo flows, browser behavior, or integration paths change. Use `npm run test:package-types` when exports, packaging, declaration generation, or subpaths change. If running a subset, state what remains unrun.
