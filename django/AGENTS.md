# WeFa Django – Agent Guide

Backend slice of the N-SIDE WeFa toolkit. Read alongside the repo-wide [`../AGENTS.md`](../AGENTS.md). Each shipped app additionally has its own `README.md` covering its public surface — read that before extending an existing app.

## Layout

- Source: `nside_wefa/<app>/` — one app per concern. Existing apps: `common`, `utils`, `authentication`, `legal_consent`, `locale`, `audit`.
- Each app mirrors the same shape: `apps.py`, `checks.py`, `models/` or `models.py`, `serializers.py`, `urls.py`, `views/`, `admin.py` (when it owns models), `tests/`, `README.md`.
- Canonical references when in doubt:
  - **`audit/`** — most complete: settings, system checks, registration UX, REST endpoints, admin, signals, management commands, tamper-evident model, exhaustive tests.
  - **`locale/`** — smallest end-to-end: model + signal + REST + checks + tests.
- Test settings & wiring live in `demo/` — adding a new app means updating `demo/settings.py` (`INSTALLED_APPS`, `MIDDLEWARE`, `NSIDE_WEFA`) and `demo/urls.py`.
- `pytest.ini` is configured to use `demo.settings`.

## Conventions

### Settings access
- Every app reads from `NSIDE_WEFA.<SECTION>`. Use `nside_wefa.common.settings.get_section(name)` / `get_value(name, key, default)` to read. Do not invent new `_*Configuration` private classes — the legacy ones in `legal_consent` and `locale` are kept for back-compat only.
- `override_settings(NSIDE_WEFA={...})` replaces the **whole** dict in tests. Re-include `APP_NAME` and any other section consumed by an installed app's `apps.py.ready()`.

```python
# Bad — bespoke private config class duplicating shared infrastructure
class _LegalConsentConfiguration:
    def __init__(self) -> None:
        nside_wefa_settings = cast(_NsideWefaSettings, settings.NSIDE_WEFA)
        configuration = nside_wefa_settings["LEGAL_CONSENT"]
        self.version = configuration["VERSION"]

config = _LegalConsentConfiguration()
version = config.version

# Good — read through the shared helper so checks and tests behave consistently
from nside_wefa.common.settings import get_value

version = get_value("LEGAL_CONSENT", "VERSION")
```

### System checks
- Every app registers via `apps.py.ready() → from . import checks`. The import is intentionally unused; `@register()` decorators in `checks.py` do the work.
- Use the helpers in `nside_wefa.utils.checks`:
  - `check_apps_dependencies_order(deps)` — enforces order between **consecutive pairs**. For "X *and* Y must each precede Z" without ordering X vs Y, call it twice with separate two-element lists (see `audit/checks.py::wefa_apps_dependencies_check`).
  - `check_nside_wefa_settings(...)` — validates a section + required keys + per-key validators. **Footgun: it rejects empty `{}` sections.** For all-keys-optional sections, iterate validators directly (see `audit/checks.py::audit_settings_check`).
  - Primitive validators (each takes a `setting_path` for error messages): `validate_bool`, `validate_optional_positive_int`, `validate_string_list(allowed=...)`, `validate_dotted_path_callable`, `validate_model_label`, `validate_model_label_dict`.

```python
# Bad — using check_nside_wefa_settings on an all-optional section.
#       Empty NSIDE_WEFA["AUDIT"] = {} would now raise a system-check error
#       even though "use all defaults" is the intended UX.
@register()
def audit_settings_check(app_configs, **kwargs):
    return check_nside_wefa_settings(
        section_name="AUDIT",
        required_keys=[],
        validators={"TAMPER_EVIDENT": validate_bool("...")},
    )

# Good — iterate validators only over keys that are actually present
@register()
def audit_settings_check(app_configs, **kwargs):
    section = (getattr(django_settings, "NSIDE_WEFA", None) or {}).get("AUDIT")
    if section is None:
        return []
    validators = {"TAMPER_EVIDENT": validate_bool("NSIDE_WEFA.AUDIT.TAMPER_EVIDENT")}
    errors = []
    for key, validator in validators.items():
        if key in section:
            errors.extend(validator(section[key]))
    return errors
```

### Models, signals, migrations
- OneToOne to `settings.AUTH_USER_MODEL` with `post_save` auto-creation is the toolkit pattern (`legal_consent.LegalConsent`, `locale.UserLocale`). Use `dispatch_uid="models.create_*"` so reconnects stay idempotent.
- Migrations should backfill existing users via `RunPython` (see `locale/migrations/0001_initial.py`).
- `default_auto_field = "django.db.models.BigAutoField"` on every `AppConfig`.

### Signal-driven diffs (only emit on real change)
- Pattern used by `audit/builtin/locale.py` and `audit/builtin/legal_consent.py`: `post_init` snapshots the persisted tuple onto the instance under `_wefa_audit_previous_*`, `post_save` compares current vs snapshot and emits only on change, then refreshes the snapshot. Do not use `created` as a proxy — it misses re-saves of already-changed rows.

```python
# Bad — `created` only fires on insert, so updates that change `code`
#       silently never emit an audit event.
def _on_locale_saved(sender, instance, created, **kwargs):
    if created:
        api.log("locale.change", actor=instance.user, target=instance,
                changes={"code": {"from": None, "to": instance.code}})

# Good — snapshot the persisted value at post_init, diff at post_save,
#        refresh the snapshot so successive saves are also tracked.
_SNAPSHOT_ATTR = "_wefa_audit_previous_code"

def _snapshot_code(sender, instance, **kwargs):
    setattr(instance, _SNAPSHOT_ATTR, instance.code)

def _on_locale_saved(sender, instance, created, **kwargs):
    previous = getattr(instance, _SNAPSHOT_ATTR, None)
    current = instance.code
    if previous == current:
        return
    api.log("locale.change", actor=instance.user, target=instance,
            changes={"code": {"from": previous, "to": current}})
    setattr(instance, _SNAPSHOT_ATTR, current)
```

### REST views
- `APIView`-based; explicit `permission_classes` and `serializer_class`.
- `@extend_schema` annotations on every method with `operation_id`, `tags=["<App>"]`, `summary`, `description`, explicit `responses={...}`.
- Define `app_name` in `urls.py`; mount in `demo/urls.py` via `include("nside_wefa.<app>.urls")`.

### Admin
- Every shipped model should be admin-registered (`audit/admin.py` is the reference for read-only admins).
- When wrapping a third-party model that's already admin-registered (e.g. `auditlog.LogEntry`), `admin.site.unregister(Model)` first inside a `try/except NotRegistered`. **`NotRegistered` lives at `django.contrib.admin.exceptions`** — the alias under `.sites` exists at runtime but isn't in the type stubs.

### Working with `django-auditlog` (when relevant)
- **Always resolve the active model via `auditlog.get_logentry_model()`** instead of importing `LogEntry` directly. Under tamper-evidence the base `LogEntry.objects` raises `AttributeError: Manager isn't available; ... has been swapped`, so hard-coded references silently break — and silently-failing audit writes are doubly bad because `RAISE_ON_FAILURE=False` swallows them.
- `AUDITLOG_LOGENTRY_MODEL` expects Django's `app_label.ModelName` form (e.g. `audit.WefaLogEntry`), **not** the dotted Python import path. Resolved via `apps.get_model(...)` internally.

## Quality gate

Run before opening a PR. CWD is `django/`.

```bash
uv sync --all-extras                               # install + dev deps (idempotent)
uv run pytest                                      # full suite
uv run ruff check nside_wefa demo                  # lint
uv run ruff format --check nside_wefa demo         # format check
uv run mypy nside_wefa/                            # type check
uv run python manage.py check                      # system checks
```

Helpers:

```bash
uv run ruff format nside_wefa demo                 # auto-format
uv run ruff check --fix nside_wefa demo            # auto-fix lint
uv run pytest nside_wefa/<app>/tests/test_<x>.py -x --tb=short
uv run python manage.py makemigrations --check --dry-run
```

## Tests

- Mirror production layout under `nside_wefa/<app>/tests/<area>/`. Each `tests/` and subfolder needs an empty `__init__.py`.
- `django.test.TestCase` for DB-touching tests (auto-rollback per test); `rest_framework.test.APITestCase` for view tests.
- **Transaction gotcha**: a query expected to raise inside `TestCase` leaves the implicit `atomic` block in error state and subsequent queries fail with `TransactionManagementError`. Wrap the failing call in its own savepoint:
  ```python
  with transaction.atomic(), self.assertRaises(SomeError):
      thing_that_raises()
  ```
- **Module-global registries** (e.g. `auditlog.registry.auditlog`) persist across tests. Add a `tearDown` that unregisters anything the test registered, and prefer test-only models that aren't already wired in `demo/settings.py` to avoid cross-test interference.
- **`AUDITLOG_*` settings** get set during `AppConfig.ready()` at suite boot. Tests that exercise the translation layer must snapshot, clear, and restore those keys around each case (see `audit/tests/test_settings_translation.py::_RestoreAuditlogSettings`).
- **Test under non-default settings**: every feature gated by an opt-in flag (tamper-evidence, `INCLUDE_ALL_MODELS`, `RAISE_ON_FAILURE=True`) needs a regression test with the flag flipped on. Several real bugs in past PRs shared the shape "worked in the default config, broke under the opt-in".

## Demo project

- `python manage.py runserver` and `python manage.py migrate` use the SQLite DB at `django/db.sqlite3` (committed for the demo).
- One-shot ORM scripts need `DJANGO_SETTINGS_MODULE` in the env:
  ```bash
  DJANGO_SETTINGS_MODULE=demo.settings uv run python -c '
  import django; django.setup()
  ...
  '
  ```
- New apps must be wired in `demo/settings.py` (`INSTALLED_APPS`, `MIDDLEWARE` if relevant, `NSIDE_WEFA["<APP>"]`) and `demo/urls.py` **before** `manage.py makemigrations <app>` will work — the autodetector needs the app installed.

## Adding a new app — checklist

1. **Scaffold**: `nside_wefa/<app>/{__init__.py, apps.py, checks.py}`. `apps.py` sets `default_auto_field = "django.db.models.BigAutoField"` and `name = "nside_wefa.<app>"`; `ready()` does `from . import checks  # noqa: F401` and any startup wiring.
2. **Wire the demo**: add to `demo/settings.py` `INSTALLED_APPS` (after `nside_wefa.common`); populate `NSIDE_WEFA["<APP>"]` if the app reads settings; register URLs in `demo/urls.py`; append middleware if needed.
3. **System checks**: dependency-order check, settings-shape check, per-key validators using the primitives from `nside_wefa.utils.checks`. Cover every key so `manage.py check` catches mistakes at boot.
4. **Models + migrations**: `python manage.py makemigrations <app>` once models exist; commit migration alongside the model. Backfill existing users via `RunPython` for OneToOne to `AUTH_USER_MODEL`.
5. **Tests**: mirrored `tests/` tree covering models, serializers, views, checks, signals, management commands. Include cases for opt-in flags turned on.
6. **Per-app README**: follow `nside_wefa/audit/README.md` shape — overview, installation, registration UX (if relevant), settings reference table, REST endpoints table, conventions.
7. **Top-level docs**: update `django/README.md` Features list, Included Apps, Quick Start `INSTALLED_APPS` snippet, `NSIDE_WEFA` Configuration block.
8. **Version bump**: bump `pyproject.toml` `version` when shipping; the monorepo release script lives at `scripts/wefa_version.py` (run from repo root).

## When in doubt

- Mirror [`nside_wefa/audit/`](nside_wefa/audit/) (latest, full surface) or [`nside_wefa/locale/`](nside_wefa/locale/) (smallest end-to-end).
- For DRF / SimpleJWT mutations of `REST_FRAMEWORK`, mirror `nside_wefa.authentication.utils.settings_initialization`.
- Before adding cross-cutting infrastructure, check [`../docs/agent-roadmap.md`](../docs/agent-roadmap.md) first — some presets are already scoped there (for example audit was tracked as E1 and request-ID observability as E8).
