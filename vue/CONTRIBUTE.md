# Contributing to WeFa Frontend

Thanks for helping shape the WeFa (Web Factory) frontend library. This guide covers environment setup, quality gates, and the workflow we follow while preparing the project for its first open-source release.

> **Namespace note**: the package is still published as `@nside/wefa` while we complete the rename. File paths and commands below use that scope until the transition lands.

## Table of Contents

- [Development Environment](#development-environment)
- [Project Layout](#project-layout)
- [Install Dependencies](#install-dependencies)
- [Available Commands](#available-commands)
- [Quality Gates](#quality-gates)
- [Storybook and Documentation](#storybook-and-documentation)
- [Commit and Branch Conventions](#commit-and-branch-conventions)
- [Pull Request Checklist](#pull-request-checklist)
- [Release Preparation](#release-preparation)

## Development Environment

### Prerequisites

- Node.js 20 or later (align with `.nvmrc` once added)
- npm 10 or an alternative package manager (pnpm, yarn)
- Git

### Cloning the repository

```bash
git clone https://github.com/n-side-dev/wefa.git
cd wefa/vue
```

## Project Layout

```
vue/
├── src/                # Library source (components, composables, stores, styles)
│   ├── components/     # Vue components + stories + tests
│   ├── composables/    # Reusable composition utilities
│   ├── locales/        # i18n resources
│   ├── router/         # Router helpers and demo routes
│   ├── stores/         # Pinia stores for the demo and reusable patterns
│   └── README.mdx      # Storybook docs entry point (imports README.md)
├── demo/               # Playground application consuming the library
├── dist/               # Build artifacts (generated)
├── scripts/            # CLI helpers (e.g. `wefa-install`)
├── README.md           # Frontend overview (kept in sync with Storybook)
└── package.json        # Scripts, dependencies, build targets
```

## Install Dependencies

From `vue/` install the toolchain:

```bash
npm install
```

To work with `pnpm` or `yarn`, delete `package-lock.json` and run the equivalent install command. Keep the lockfile consistent with the package manager you are using in the branch.

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Launch the demo playground with hot reloading |
| `npm run build` | Type check and build the library bundle |
| `npm run build:demo` | Build the demo application only |
| `npm run preview` | Preview the built demo (requires `npm run build:demo`) |
| `npm run storybook` | Run Storybook locally |
| `npm run build-storybook` | Generate the static Storybook site |
| `npm run lint` / `npm run lint-check` | Fix or check ESLint issues |
| `npm run format` / `npm run format-check` | Apply or verify Prettier formatting |
| `npm run test:unit` | Execute Vitest unit tests once |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Build the demo and run Playwright end-to-end tests |

## Quality Gates

Before opening a pull request make sure:

1. `npm run lint-check` passes without warnings you cannot justify.
2. `npm run format-check` passes (or run `npm run format`).
3. `npm run test:unit` succeeds.
4. `npm run test:e2e` passes when your changes touch interactive flows or routing.
5. `npm run build` finishes cleanly.

Document deviations from these gates in the pull request summary and explain the follow-up plan.

## Storybook and Documentation

- Every new component needs at least one Storybook story (`ComponentName.stories.ts`).
- Prefer MDX docs (`ComponentName.mdx`) when usage instructions, accessibility notes, or complex props merit extra context.
- Keep prop tables, example code, and i18n guidance current with the implementation.
- The file `src/README.mdx` automatically surfaces `README.md` in Storybook—update both together.

## Commit and Branch Conventions

- Use short, descriptive branch names such as `feat/date-picker`, `fix/table-scroll`, or `docs/contribution-guide`.
- Commits should follow the conventional message format where possible (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:` ...). This helps future release tooling produce changelogs.
- Keep commits focused; avoid mixing unrelated refactors with feature work.

## Pull Request Checklist

- [ ] Linked issue or clear problem statement in the description.
- [ ] Tests cover the new behaviour (unit, e2e, or both where relevant).
- [ ] Storybook stories and MDX docs updated or created.
- [ ] Screenshots or recordings added if the UI changes visibly.
- [ ] All quality gates from the previous section pass locally.
- [ ] Changelog entry drafted (to be added once the changelog file is introduced).

## Release Preparation

Our first public release will be automated through GitHub Actions. For now follow the manual flow when testing locally:

```bash
npm version <major|minor|patch>
npm publish --access public
```

Do not publish from feature branches. Coordinate releases through a dedicated pull request, obtain approvals, update the changelog, and tag the release. Once CI is in place the workflow will be updated here.

---

Questions, ideas, or feedback? Open a GitHub discussion or issue so we can align on the change before the implementation starts.
