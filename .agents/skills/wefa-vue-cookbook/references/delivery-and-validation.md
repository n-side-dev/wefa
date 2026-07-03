# Delivery And Validation

## Purpose

Use this reference when deciding what checks, documentation, and review hygiene should accompany a WeFa-based change.

## Core Rule

The validation should match the risk and the host codebase.

- Small presentational change: lint, type-check, focused tests
- Shared component or composable change: broader unit coverage and affected usage examples
- Routing or integration change: add the relevant browser or e2e checks
- Public API or package-surface change: verify the published usage path, not only local internals

## Delivery Checklist

1. Update or add tests for the changed behavior, not only the happy path.
2. Update the nearest docs, examples, or stories when the usage surface changed.
3. Verify translations for any new user-facing copy.
4. Confirm the abstraction choice still matches the WeFa -> PrimeVue -> native order.
5. Run the validation commands that the current project expects.

## Review Prompts

- Did the code choose the right abstraction layer?
- Did it preserve existing conventions instead of introducing a parallel pattern?
- Did it validate the behavior at the layer where users will actually feel the change?
- Did it update surrounding guidance, examples, or tests when the surface changed?

## WeFa Repo Note

If the task is inside the WeFa repository itself, load `wefa-vue-frontend` for the exact repo quality gate, Storybook/MDX expectations, export wiring, demo wiring, and review workflow.
