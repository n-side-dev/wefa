---
name: wefa-vue-frontend
description: Maintainer guide for contributing to the N-SIDE WeFa Vue package itself. Use it only when the task is inside this repository's `vue/` workspace, and load it after `wefa-vue-cookbook`. It covers repo-specific maintainer concerns such as exports, Storybook or MDX docs, demo wiring, generated artifacts, frontend tests, and the Vue package quality gate.
---

# WeFa Vue Maintainer

This is the maintainer skill for the WeFa Vue library inside this repository.

Load `wefa-vue-cookbook` first. That cookbook is the shared skill used by consuming projects and by the library itself for common WeFa conventions. Use this skill only for repo-specific maintainer concerns such as exports, Storybook, MDX docs, demo wiring, generated artifacts, tests, and review hygiene inside `vue/`.

## First Reads
1. Read `vue/AGENTS.md` for workspace identity, gotchas, and the repo quality gate.
2. Read `vue/README.md` for package capabilities, exports, and workspace scripts.
3. Read `vue/CONTRIBUTE.md` for contribution expectations and the npm script surface.
4. Read `code_review.md` from the repo root when the task is a review.

## Workspace Map
1. Start public-surface discovery at `vue/src/lib.ts` and `vue/src/containers/index.ts`.
2. Expect feature folders to keep neighbors together: component or container source, `index.ts`, stories, MDX docs, and tests in the same folder.
3. Use `vue/src/locales/index.ts` plus `vue/src/locales/<locale>/*.json` for library i18n wiring.
4. Check `vue/src/network`, `vue/src/router`, `vue/src/plugins`, and `vue/src/stores` before adding duplicate helpers.
5. Treat `vue/src/demo` and `vue/src/demo/openapi` as the manual-validation and generated-client surface for demo flows.

## Repo-Specific Rules
1. New public components or containers should usually ship with source, stories, MDX docs, and unit tests, unless the adjacent feature pattern in this repo clearly differs.
2. When a change creates or exposes new public surface, update the nearest `index.ts` and shared entrypoints such as `vue/src/lib.ts` or `vue/src/containers/index.ts`.
3. Regenerate or reuse generated OpenAPI client artifacts through the existing script instead of hand-editing generated files.
4. Treat `vue/src/demo` as a manual-validation surface, not as a place to hide reusable library logic.
5. Keep `README.md`, MDX docs, and Storybook stories aligned with behavior changes that affect consumers.
6. Respect repo-enforced gotchas from `vue/AGENTS.md`, including SFC block order, the `withDefaults()` preference, and the rule against Storybook `autodocs` tags.

## Delivery Workflow
1. Inspect existing implementation first:
   Search for a neighboring component, container, plugin, store, or network helper that already solves most of the problem.
2. Implement with local conventions:
   Match adjacent prop patterns, file names, exports, and test naming (`.spec.ts`, `.test.ts`, or `__tests__`) used by that feature.
3. Wire localization:
   Add or update locale namespaces under `vue/src/locales/<locale>/` and use `useI18nLib` or `$t` in code. If a story or test needs extra messages, register them through the existing locale helpers.
4. Update supporting artifacts:
   Update stories and MDX docs when props, states, a11y guidance, or usage changed. Update demo wiring when the change affects routed or integrated flows.
5. Validate before handoff:
   `npm run lint-check`
   `npm run type-check`
   `npm run format-check`
   `npm run test:unit -- --reporter=dot --silent`
   `npm run build`
   `npm run test:e2e -- --reporter=dot` when routing, demo flows, or browser interactions changed
   `npm run test:package-types` when exports or packaging changed

## Test Output Discipline
1. Always run tests with low-verbosity flags to limit terminal noise and token usage.
2. Keep the minimal reporters above unless debugging failures requires temporary extra detail.
3. If extra verbosity is needed for debugging, rerun only the failing test scope with detailed output.

## References
- Load `wefa-vue-cookbook` for shared WeFa usage conventions.
- Load `references/contributing-and-checks.md` for the repo quality gate and PR-ready checklist.
- Read `vue/README.md` and `vue/CONTRIBUTE.md` for project workflows.
- Read `vue/src/locales/Translation.mdx` when adding or reshaping translations.

## Definition of Done
1. Shared WeFa usage conventions come from `wefa-vue-cookbook`; this skill adds only repo-specific rules.
2. Public exports and supporting entrypoints are updated when surface area changes.
3. Tests, stories, docs, and demo wiring are updated for behavior changes.
4. Required lint, type, format, unit-test, build, and relevant e2e or package-type checks pass.
