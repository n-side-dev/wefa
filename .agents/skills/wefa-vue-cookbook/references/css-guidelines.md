# CSS Guidelines

## Purpose

Use this reference when styling WeFa-based Vue code or reviewing whether a styling approach fits WeFa conventions.

## Default Styling Stack

1. Tailwind 4 utilities
2. `tailwindcss-primeui`
3. PrimeVue theming and component APIs
4. Scoped styles only as an explicit escape hatch

The default expectation is utility-first styling, not custom CSS-first styling.

## Rules

1. Prefer Tailwind utility classes for layout, spacing, typography, colors, and responsive behavior.
2. Do not add new CSS imports or routine `<style>` blocks for normal component work.
3. Use flex by default for layout. Reach for grid when two-dimensional track control, explicit row or column alignment, or track-based sizing clearly makes it the better fit.
4. Reach for PrimeVue props, slots, and pass-through customization before DOM or CSS hacks.
5. Use scoped styles or bound style objects only when the existing local pattern already needs them or when Tailwind cannot express the requirement cleanly, such as layout math, chart sizing, or library-specific rendering constraints.
6. Keep theme ownership centralized:
   rely on the established app or library theme entrypoints instead of introducing ad-hoc fonts, color systems, or resets inside components.

## Layout Ownership

- The parent owns external layout:
  available space, flex or grid participation, sibling spacing, and container padding.
- The child owns internal layout:
  content arrangement, internal spacing, and the minimum size required by its own UI.
- The parent should usually control whether children participate in layout at all, for example with parent-owned `v-if` or `v-show` driven by parent props or parent state. Once rendered, the child may still control its own internal visual state.
- Reusable children should not default to `h-full` or `w-full` unless fill behavior is part of their explicit contract.
- If a child is meant to fill available space, the parent should establish that sizing context on the relevant axis and pass fill behavior intentionally through classes, slots, or an explicit child API.
- Do not assume `h-full` works by default:
  use it only when the parent chain makes height resolvable.
- Prefer layout-driven sizing through flex, grid, and min/max constraints over fixed `h-*` or `w-*` values. Use fixed sizes sparingly.
- For parent/child layout interfaces, prefer parent-owned `gap`, padding, and placement rules over child margins or offsets when expressing layout between siblings.
- Reusable children should usually avoid defining decorative backgrounds, borders, shadows, or similar chrome at the outer interface level. Keep those at the parent level unless they are semantic, serve a clear purpose, or are an explicit part of the child component contract.

## Practical Heuristics

- Prefer existing Tailwind scale tokens before arbitrary values.
- If a class list is growing because the component is doing too much, review the component structure before extracting CSS.
- If the styling problem comes from the underlying PrimeVue component, first inspect whether PrimeVue props or pass-through APIs already solve it.

## Repo-Specific Anchors

- Theme exports: `vue/src/theme/index.ts`, `vue/src/theme/nside.ts`
- Shared CSS entrypoint: `vue/src/assets/main.css`
- Markdown-to-Tailwind utility mapping: `vue/src/utils/markdown.ts`

## When CSS Is Justified

Scoped CSS is justified when all of the following are true:

1. Tailwind or PrimeVue APIs cannot express the requirement cleanly.
2. The styling is local to the component.
3. The nearest existing pattern uses the same escape hatch or the need is clearly technical rather than stylistic.

## Smell Checks

- New stylesheet added for routine spacing or color tweaks
- Component-level font imports or theme definitions
- Native CSS overrides used before checking PrimeVue theming options
- Large custom style blocks where Tailwind classes would have been clearer
