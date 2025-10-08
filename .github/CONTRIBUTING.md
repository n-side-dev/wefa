# Contributing to WeFa

Thanks for your interest in improving WeFa! This document explains how to get started
with contributing through GitHub. Each workspace (Django and Vue) also ships a detailed
contribution guide—follow the links below for environment-specific workflows.

- Backend: [`django/CONTRIBUTE.md`](../django/CONTRIBUTE.md)
- Frontend: [`vue/CONTRIBUTE.md`](../vue/CONTRIBUTE.md)

## Ways to Contribute

- Report bugs or request features by opening an issue
- Improve documentation, examples, or Storybook content
- Submit patches that fix bugs, add features, or tidy the project tooling

Before opening an issue or pull request, please search existing discussions to avoid
duplicates.

## Development Workflow

1. **Fork and clone** the repository from GitHub (`https://github.com/n-side-dev/wefa`).
2. **Create a feature branch** using a descriptive name (`feature/new-component`, `bugfix/form-validation`).
3. **Follow the package-specific guides** referenced above to set up dependencies,
   run tests, and apply formatting before you push.
4. **Open a pull request** targeting the `main` branch.

Please include:

- A clear description of the motivation and behaviour change
- Relevant screenshots for UI updates
- Tests and documentation updates when behaviour changes

Maintainers review pull requests as time and work allocation permits; responding to feedback quickly helps
keep the process moving.

## Commit and PR Guidelines

- Use conventional commit prefixes where practicable (`feat:`, `fix:`, `docs:`, etc.).
- Write clear, concise commit messages that accurately describe the change.
- Avoid using emojis or ambiguous language in commit messages.
- Keep commits focused; avoid mixing refactors with unrelated changes.
- Ensure `npm run build`/`npm run test:*` and `pytest` (where relevant) pass before submitting.

## License

By contributing to WeFa, you agree that your contributions will be licensed under the
[Apache-2.0 License](../LICENSE.txt).
