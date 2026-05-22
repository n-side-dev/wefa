# WeFa Django - Agent Guide

## Scope

This file applies to the Django toolkit in `django/`. The package publishes `nside-wefa` and contains reusable apps under `nside_wefa/` plus the `demo/` project used for local and CI validation.

Read [README.md](/Users/ala/N-SIDE/wefa/django/README.md) and [CONTRIBUTE.md](/Users/ala/N-SIDE/wefa/django/CONTRIBUTE.md) before changing public behavior, settings, migrations, or release-facing docs.

## Architecture Rules

- Extend existing apps when the domain fits: `common`, `utils`, `authentication`, `legal_consent`, `locale`, and `audit`.
- Mirror the existing app layout: `apps.py`, `checks.py`, models, serializers, URLs, views, tests, and app-level README files where applicable.
- Keep all project configuration under the `NSIDE_WEFA` settings dictionary.
- Read settings through `nside_wefa.common.settings` helpers instead of inventing new config wrappers.
- `nside_wefa.common` is foundational and should remain before dependent WeFa apps in `INSTALLED_APPS` examples.
- Register system checks from `apps.py.ready()` and cover new settings with Django system-check validation.
- Prefer Django and DRF conventions over custom framework code. Expose app routes through `include("nside_wefa.<app>.urls")`.

## Models, Signals, And Migrations

- Preserve existing data semantics for legal consent, audit events, locale preferences, and authentication unless the task explicitly defines a migration path.
- One-to-one user companion models should follow the existing toolkit pattern, including idempotent signal wiring.
- Add migrations only when model state changes, and keep them reversible unless Django cannot reasonably reverse the operation.
- Backfill existing users when introducing one-to-one models tied to `AUTH_USER_MODEL`.
- Audit-related changes must preserve append-only expectations and document any tamper-evident or retention behavior changes.

## Tests And Docs

- Add pytest coverage for new branches, validation checks, serializers, views, management commands, and migrations where relevant.
- Test opt-in flags with the flag enabled, not only default settings.
- Update `django/README.md`, app READMEs, and demo snippets when configuration, URLs, APIs, or behavior changes.
- Use the `demo/` project for manual verification when behavior depends on Django settings or installed-app ordering.

## Validation Commands

Run from `django/` unless noted:

```bash
uv sync --all-extras
uv run pytest
uv run ruff check nside_wefa demo
uv run ruff format --check nside_wefa demo
uv run mypy nside_wefa/
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run
```

If running a smaller subset while iterating, choose the narrowest command that exercises the changed app and state what remains unrun.

## When In Doubt

- Mirror the closest existing app, usually `audit/` for the fullest reference or `locale/` for the smallest end-to-end shape.
- Check [../docs/agent-roadmap.md](/Users/ala/N-SIDE/wefa/docs/agent-roadmap.md) before inventing new cross-cutting infrastructure.
