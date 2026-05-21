---
name: wefa-vue-frontend
description: Frontend implementation and review guide for the N-SIDE WeFa Vue package. Use when coding or reviewing files under `vue/`, especially `vue/src/components`, `vue/src/containers`, `vue/src/locales`, Storybook stories or MDX docs, router/network/plugins/stores helpers, demo wiring, and frontend tests.
---

# WeFa Vue Frontend

Apply the WeFa Vue workspace standards with predictable discovery, implementation, and validation steps.

## First Reads
1. Read `vue/README.md` for package capabilities, exports, and workspace scripts.
2. Read `vue/CONTRIBUTE.md` for quality gates and contribution expectations.

## Workspace Map
1. Start public-surface discovery at `vue/src/lib.ts` and `vue/src/containers/index.ts`.
2. Expect feature folders to keep neighbors together: component or container source, `index.ts`, stories, MDX docs, and tests in the same folder.
3. Use `vue/src/locales/index.ts` plus `vue/src/locales/<locale>/*.json` for library i18n wiring.
4. Check `vue/src/network`, `vue/src/router`, `vue/src/plugins`, and `vue/src/stores` before adding duplicate helpers.
5. Treat `vue/src/demo` and `vue/src/demo/openapi` as the manual-validation and generated-client surface for demo flows.

## Implementation Rules
1. Start from the nearest existing feature and mirror its folder shape, naming, and test style instead of inventing a new pattern.
2. Reuse existing WeFa exports before building anything new; inspect the nearest `index.ts` files and the library entrypoints first.
3. Compose with PrimeVue if WeFa does not provide the needed UI.
4. Fall back to native HTML only when higher tiers fail, and leave a brief inline justification comment when the fallback is not obvious.
5. Prefer Tailwind utility classes for routine styling. Do not add new CSS imports. Use scoped styles or bound style objects only when the existing feature pattern needs layout math, chart sizing, or other cases Tailwind cannot express cleanly.
6. Prefer `const { prop = defaultValue } = defineProps<Type>()` for defaults and avoid `withDefaults()` unless the local file pattern already depends on it.
7. Keep user-facing literals translated through i18n keys (`useI18nLib`, `t`, `$t`), including `aria-label`, `title`, placeholders, validation copy, and button labels.
8. New public components or containers should usually ship with source, stories, MDX docs, and unit tests, unless the adjacent feature pattern in this repo clearly differs.
9. When a change creates or exposes new public surface, update the nearest `index.ts` and shared entrypoints such as `vue/src/lib.ts` or `vue/src/containers/index.ts` as needed.
10. Regenerate or reuse generated OpenAPI client artifacts through the existing script instead of hand-editing generated files.

## Delivery Workflow
1. Inspect existing implementation first:
   Search for a neighboring component, container, plugin, store, or network helper that already solves most of the problem.
2. Confirm the reuse hierarchy:
   WeFa component reuse, then PrimeVue composition, then native HTML fallback.
3. Implement with local conventions:
   Match adjacent prop patterns, file names, exports, and test naming (`.spec.ts`, `.test.ts`, or `__tests__`) used by that feature.
4. Wire localization:
   Add or update locale namespaces under `vue/src/locales/<locale>/` and use `useI18nLib` or `$t` in code. If a story or test needs extra messages, register them through the existing locale helpers.
5. Update supporting artifacts:
   Update stories and MDX docs when props, states, a11y guidance, or usage changed. Update demo wiring when the change affects routed or integrated flows.
6. Validate before handoff:
   `npm run lint-check`
   `npm run type-check`
   `npm run format-check`
   `npm run test:unit -- --reporter=dot --silent`
   `npm run build`
   `npm run test:e2e -- --reporter=dot` when routing, demo flows, or browser interactions changed

## Test Output Discipline
1. Always run tests with low-verbosity flags to limit terminal noise and token usage.
2. Keep the minimal reporters above unless debugging failures requires temporary extra detail.
3. If extra verbosity is needed for debugging, rerun only the failing test scope with detailed output.

## References
- Read `vue/README.md` and `vue/CONTRIBUTE.md` for project workflows.
- Read `vue/src/locales/Translation.mdx` when adding or reshaping translations.

## Definition of Done
1. UI follows WeFa/PrimeVue/Tailwind hierarchy.
2. User-facing literals are translated.
3. Public exports and supporting entrypoints are updated when surface area changes.
4. Tests, stories, docs, and demo wiring are updated for behaviour changes.
5. Required lint, type, format, unit-test, build, and relevant e2e checks pass.
