# N-SIDE WeFa - Agent Guide

## Purpose

This file gives Codex durable repository context. Keep it concise: put shared rules here, put workspace-specific rules in nested `AGENTS.md` files, and move repeatable task workflows into skills.

Codex loads AGENTS instructions from the repository root down to the current working directory. Later files are more specific, so prefer plain nested `AGENTS.md` files for additive guidance. Use `AGENTS.override.md` only when intentionally replacing broader guidance.

## Repository Map

- `django/` publishes the `nside-wefa` Django toolkit with reusable apps under `nside_wefa/` and the `demo/` validation project.
- `vue/` publishes the `@nside/wefa` Vue 3 library, demo app, Storybook docs, CLI helpers, and generated OpenAPI demo clients.
- `bff/` provides the Flask backend-for-frontend for OAuth login/logout/session checks and proxying backend REST calls.
- `scripts/` contains repository automation, especially the version orchestrator used to keep package versions aligned.
- `.github/workflows/` is the source of truth for CI-equivalent validation commands.

## Technology Baseline

- Python workspaces target Python 3.12+ and use `uv`, pytest, Ruff, mypy, and security checks.
- `django/` targets modern Django, Django REST Framework, Simple JWT, drf-spectacular, and Hatchling packaging.
- `bff/` uses Flask, Authlib, encrypted token cookies, Docker, and generated OpenAPI documentation.
- `vue/` uses Vue 3, Vite, TypeScript, PrimeVue, Tailwind 4, Pinia, Vue I18n, TanStack Query, Vitest, Storybook, and Playwright.

## Instruction Routing

- For `django/` work, read `django/AGENTS.md`, `django/README.md`, and `django/CONTRIBUTE.md`.
- For `vue/` work, read `vue/AGENTS.md`, `vue/README.md`, and `vue/CONTRIBUTE.md`; use `$wefa-vue-frontend` for component, container, Storybook, i18n, demo, and frontend test work.
- For TanStack Query work in `vue/`, also use `$wefa-tanstack-query`.
- For `bff/` work, read `bff/AGENTS.md` and `bff/README.md`.
- For `scripts/` work, read `scripts/AGENTS.md`.
- For cross-cutting changes, coordinate backend/API shape first, then update consumers and documentation in the affected workspaces.

The current repository skills live under `skills/`. A later cleanup should migrate shared Codex skills to official repository discovery under `.agents/skills`, but do not do that as part of AGENTS-only edits unless explicitly requested.

## Shared Engineering Rules

- Explore first: inspect existing implementations, neighboring files, docs, and CI before designing changes.
- Prefer existing conventions and helpers over new bespoke wiring.
- Preserve public APIs unless the task explicitly asks for a breaking change; document behavior changes where consumers will notice them.
- Keep Python and TypeScript types accurate. Avoid broad casts, silent fallbacks, and broad exception handling.
- Keep user-facing copy localized in frontend code and documented in the relevant README, MDX, or package docs.
- Add or update tests when behavior changes. If validation is skipped, state exactly why.
- Do not hand-edit generated artifacts unless the workspace guide explicitly allows it.
- Do not commit secrets. Treat `.env` files, OAuth credentials, tokens, and generated local IDE/cache files as local-only.

## Versioning And Releases

- The monorepo uses one shared version across `django/`, `vue/`, and `bff/`.
- Use `python3 scripts/wefa_version.py` from the repository root for version changes.
- Prefer `--dry-run` before version changes; do not manually edit per-package version fields unless repairing the orchestrator itself.
- Keep lockfiles consistent with the package manager used in the branch: `uv.lock` for Python workspaces and `package-lock.json` for npm.

## Validation Expectations

- Run the smallest relevant checks while iterating, then run the workspace's CI-equivalent commands before handoff when feasible.
- Documentation-only AGENTS changes do not require product test suites, but they should pass basic markdown/content sanity checks.
- For reviews, prioritize bugs, behavior regressions, missing tests, security risks, and docs drift before style suggestions.

## Compatibility Notes

- Codex guidance should come from `AGENTS.md` files and skills, not generated assistant instruction artifacts.
- Keep AGENTS files compact. Link to workspace docs rather than copying full manuals so the combined instruction chain stays below Codex's default 32 KiB project-doc size limit.
