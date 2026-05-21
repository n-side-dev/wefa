# WeFa Django - Agent Guide

## Scope

This file applies to the Django toolkit in `django/`. The package publishes `nside-wefa` and contains reusable apps under `nside_wefa/` plus the `demo/` project used for local and CI validation.

Read `django/README.md` and `django/CONTRIBUTE.md` before changing public behavior, settings, migrations, or release-facing docs.

## Architecture Rules

- Extend existing apps when the domain fits: `common`, `authentication`, `legal_consent`, `locale`, `audit`, `attachments`, `admin_theme`, or `utils`.
- Mirror the existing app layout: `apps.py`, `checks.py`, `models/`, `serializers.py`, `urls.py`, `views/`, `tests/`, and app-level README files where applicable.
- Keep all project configuration under the `NSIDE_WEFA` settings dictionary. New settings need defaults, Django system checks, tests, and README documentation.
- `nside_wefa.common` is foundational and should remain before dependent WeFa apps in `INSTALLED_APPS` examples.
- Prefer Django and DRF conventions over custom framework code. Put shared authentication or request helpers under the nearest `utils/` module.
- Expose app routes through `include("nside_wefa.<app>.urls")` and cover URL/API behavior in tests.

## Data, Migrations, And Checks

- Add migrations only when model state changes. Keep them reversible unless Django cannot reasonably reverse the operation.
- Run `python manage.py makemigrations --check --dry-run` when model or field definitions change.
- Run `python manage.py check` or targeted system-check tests when changing settings contracts.
- Preserve existing data semantics for legal consent, audit events, locale preferences, and authentication unless the task explicitly defines a migration path.
- Audit-related changes must preserve append-only expectations and document any tamper-evident or retention behavior changes.

## Documentation And Tests

- Update `django/README.md`, app READMEs, or demo snippets when configuration, URLs, APIs, or behavior changes.
- Add pytest coverage for new branches, validation checks, serializers, views, management commands, and migrations where relevant.
- Use the demo project for manual verification when behavior depends on Django settings or installed app ordering.

## Validation Commands

Run from `django/` unless noted:

```bash
uv run ruff check .
uv run ruff format --check .
DJANGO_SETTINGS_MODULE=demo.settings uv run mypy --install-types --non-interactive .
python manage.py makemigrations --check --dry-run
python manage.py migrate --plan
python manage.py migrate --noinput
uv run pytest --cov-config=.coveragerc --cov-report xml --cov .
uvx pysentry-rs --config .pysentry.toml .
uv run bandit -c pyproject.toml -r nside_wefa -n 3 -l
```

If running a smaller subset, choose the narrowest command that exercises the changed app and state what remains unrun.
