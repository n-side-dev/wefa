---
name: wefa-vue-frontend
description: Frontend implementation guide for the N-SIDE WeFa Vue package. Use when coding or reviewing files under `vue/`, especially `vue/src/components`, `vue/src/containers`, Storybook stories/docs, translations, and frontend tests.
---

# WeFa Vue Frontend

## Purpose
Apply the WeFa Vue frontend standards with predictable implementation and validation steps.

## Implementation Rules
1. Reuse existing WeFa components from `@nside/wefa` before building anything new.
2. Compose with PrimeVue if WeFa does not provide the needed UI.
3. Fall back to native HTML only when higher tiers fail, and include an inline justification comment.
4. Use Tailwind utility classes only; avoid custom `<style>` blocks and CSS imports in components.
5. Define props as `const { prop = defaultValue } = defineProps<Type>()`; avoid `withDefault()`.
6. Keep user-facing literals translated through i18n keys (`useI18nLib`, `t`, `$t`), including `aria-label`, `title`, placeholders, and button labels.
7. Keep stories (`.stories.ts`), docs (`.mdx`), and specs aligned with behaviour changes.

## Delivery Workflow
1. Inspect existing implementation first:
- Check `vue/src/components/**/index.ts` exports and related component folders.
- Check existing composables/stores/network helpers before adding ad-hoc logic.
2. Implement with the reuse hierarchy:
- WeFa component reuse.
- PrimeVue composition.
- Native HTML fallback with inline justification.
3. Wire localization:
- Add translation keys under `vue/src/locales/<locale>/`.
- Use translation helpers directly in templates or scripts.
4. Update supporting artifacts:
- Update unit tests for behaviour changes.
- Update stories/docs when props, state, or usage changed.
5. Validate before handoff:
- `npm run lint-check`
- `npm run type-check`
- `npm run format-check`
- `npm run test:unit -- --reporter=dot --silent`
- `npm run test:e2e -- --reporter=dot` when routing/flows changed

## Test Output Discipline
1. Always run tests with low-verbosity flags to limit terminal noise and token usage.
2. Keep the minimal reporters above unless debugging failures requires temporary extra detail.
3. If extra verbosity is needed for debugging, rerun only the failing test scope with detailed output.

## References
- Read `vue/README.md` and `vue/CONTRIBUTE.md` for project workflows.

## Definition of Done
1. UI follows WeFa/PrimeVue/Tailwind hierarchy.
2. User-facing literals are translated.
3. Tests/docs/stories are updated for behaviour changes.
4. Required lint/type/format/test/build checks pass.
