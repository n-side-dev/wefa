# WeFa Vue – Agent Guide

Frontend slice of the N-SIDE WeFa monorepo. This file is the entry point for any agent that follows the AGENTS.md convention; the deep guidance lives in two repo-local skills that Codex can auto-discover and other agents can read directly.

## Library identity

`@nside/wefa` is a **PrimeVue superset** — every public component either wraps, extends, or composes PrimeVue + PrimeIcons, styled exclusively through Tailwind 4 with `tailwindcss-primeui`. The reuse hierarchy is **WeFa → PrimeVue → native HTML**, never invent a new primitive when a PrimeVue equivalent exists. Pinia, Vue Router, Axios, and TanStack Query Vue v5 round out the runtime stack.

## Where the conventions live

- **`../.agents/skills/wefa-vue-frontend/SKILL.md`** — component reuse hierarchy (WeFa → PrimeVue → native), folder shape, i18n, delivery workflow, quality-gate commands. Read first for any UI work. Codex can auto-discover this skill; non-Codex agents should open the `SKILL.md` file directly.
- **`../.agents/skills/wefa-tanstack-query/SKILL.md`** — TanStack Query Vue v5 patterns, when to use `apiClient` / `typedApiClient` / direct hooks, cache invalidation, mutations, v5 vs pre-v5 review checklist. Read when adding or reviewing network code.
- **[`CONTRIBUTE.md`](CONTRIBUTE.md)** — human onboarding, project layout, full npm scripts table, release flow.
- **[`README.md`](README.md)** — package capabilities, exports, install, demo flow.
- **[`.github/copilot-instructions.md`](.github/copilot-instructions.md)** — compatibility entry point for tools that look for `copilot-instructions.md`; it points back to this file and the skills above and is not the source of truth.

## Quality gate (paste-ready)

Run from `vue/` before opening a PR:

```bash
npm install
npm run lint-check
npm run type-check
npm run format-check
npm run test:unit -- --reporter=dot --silent
npm run build
npm run test:e2e -- --reporter=dot       # only when routing, demo flows, or browser interactions changed
npm run test:package-types               # only when exports or packaging changed
```

## Workspace map (cheat sheet)

- Public surface starts at `src/lib.ts` and `src/containers/index.ts`.
- Feature folders keep neighbours together: source, `index.ts`, stories, MDX docs, tests in the same folder.
- Reference component: [`src/components/AutoroutedBreadcrumb/`](src/components/AutoroutedBreadcrumb/) — canonical four-deliverable shape (`.vue`, `.stories.ts`, `.spec.ts`, `.mdx`). Mirror this structure when adding a public component.
- Library i18n: `src/locales/index.ts` + `src/locales/<locale>/*.json`.
- Cross-cutting helpers: `src/network/`, `src/router/`, `src/plugins/`, `src/stores/` — check before duplicating.
- Demo + generated OpenAPI client: `src/demo/` and `src/demo/openapi/`.

## Test layout

Vitest is configured with three projects plus a separate Playwright runner. Pick the right one:

- **Component tests** — `src/components/**/*.{spec,test}.ts`, jsdom env, Vue Test Utils.
- **Network tests** — `src/network/__tests__/**`, jsdom + axios-mock-adapter; mock `@tanstack/vue-query` directly when asserting wrapper config.
- **Storybook visual tests** — auto-generated from `*.stories.ts`, run in browser mode (Chromium + WebKit).
- **E2E** — `e2e/**/*.spec.ts` via Playwright; auto-starts the demo dev server. Run only when routing, demo flows, or browser interactions changed.

Coverage is Istanbul, output in `./coverage` (`text` + `cobertura` + `lcov` reporters).

## Cross-workspace coordination

- Backend API shape comes from `django/` first. When the OpenAPI surface changes, regenerate the typed client through the existing script under `src/demo/openapi/` rather than hand-editing.
- Cookie/session-based auth flows are mediated by `bff/`. When changing auth-aware UI, confirm cookie names and redirect targets match what `bff/AGENTS.md` and `bff/README.md` document.

## Known gotchas

- `copilot-instructions.md` is a compatibility pointer only. Keep the current rules in this file and the two skill files above.
- `withDefaults()` is discouraged; use `const { prop = default } = defineProps<Type>()` (per the frontend SKILL).
- Treat data returned from queries as immutable; copy before binding to `v-model` or local mutation (per the TanStack SKILL).
- Test runs default to low-verbosity reporters (`--reporter=dot --silent`); rerun the failing scope with detail only when debugging.
- Keep user-facing literals (including `aria-label`, `title`, placeholders) translated through i18n keys — never hard-code English copy.
- **SFC block order is enforced**: `<template>` → `<script>` → `<style>` (eslint `vue/block-order`). Composition-API instinct is to write script first; ESLint will fail the build.
- **Stories must not declare the `autodocs` tag** — the project relies on hand-authored `.mdx` docs as the canonical reference and `autodocs` causes duplicated/stale auto-generated pages.
- **No new CSS files / `<style>` blocks for routine styling.** Stick to Tailwind utilities and `tailwindcss-primeui`. Scoped styles are an escape hatch only when an existing feature pattern already needs layout math, chart sizing, or other cases Tailwind cannot express cleanly (per the frontend SKILL).
- **Bundle budget**: `./dist/**/*.js` is capped at 2 MB by [bundlesize](package.json) — if a change risks breaching it, flag the bundle delta in the PR.
