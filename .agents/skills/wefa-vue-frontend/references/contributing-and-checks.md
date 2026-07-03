# Contributing And Checks

## Purpose

Use this reference when the task needs contribution workflow, quality-gate commands, or a deeper verification checklist than the always-loaded summary.

## First Reads

1. `vue/AGENTS.md`
2. `vue/CONTRIBUTE.md`
3. `vue/README.md` when the task changes package-level setup, exports, or developer guidance

## Required Quality Gate

Run from `vue/` before handoff:

```bash
npm run lint-check
npm run type-check
npm run format-check
npm run test:unit -- --reporter=dot --silent
npm run build
```

## Extra Checks When The Change Needs Them

- Run `npm run test:e2e -- --reporter=dot` when routing, demo flows, or browser-visible interactions changed.
- Run `npm run test:package-types` when exports, packaging, or published type declarations changed.
- Keep test output low-noise by default; only rerun a narrowed failing scope with higher verbosity while debugging.

## Contributor Expectations

1. Mirror the nearest existing component, container, store, plugin, or network helper before introducing a new pattern.
2. Update docs alongside behavior:
   `README.md`, MDX docs, stories, or in-repo guidance depending on what changed.
3. Keep public-surface changes synchronized:
   update the nearest `index.ts`, `vue/src/lib.ts`, or `vue/src/containers/index.ts` when the change exposes new surface.
4. Keep generated artifacts generated:
   never hand-edit the generated OpenAPI client under `vue/src/demo/openapi/`.
5. Keep user-facing strings translated and test the translated path, not just hard-coded English.

## PR-Ready Checklist

1. Tests cover the changed behavior, not only the happy path.
2. Stories and MDX docs are updated for public component/container changes.
3. Screenshots or recordings exist when the UI changes materially.
4. The quality gate is green, with any justified deviations called out explicitly.
5. The branch does not contain unrelated refactors mixed into the feature.

## Review Prompts

Use these when reviewing agent-generated Vue work:

- Did it choose the correct layer, or did it skip a WeFa/PrimeVue abstraction that already exists?
- Did it add docs, tests, translations, and exports together, or only code?
- Did it run the right checks for the kind of change made?
- Did it change public behavior without updating package-level guidance?
