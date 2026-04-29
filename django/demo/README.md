# WeFa Demo Project

A minimal Django project that consumes every app shipped by the
`nside-wefa` package. Its purpose is **educational** — it shows the
shortest path from a fresh Django installation to a working integration
of the toolkit.

If you're new to the package, read the demo's source files alongside
each app's README to see how the documented APIs are wired up in
practice.

## What's inside

The demo project is a regular Django project with two demo apps that
illustrate consumer-side wiring:

| Folder | What it shows |
|---|---|
| [`demo/settings.py`](settings.py) | Installing every WeFa app, populating the `NSIDE_WEFA` settings dict, declaring `STORAGES` for the attachments app. |
| [`demo/urls.py`](urls.py) | Mounting each app's URLs at a stable prefix and including the demo apps' URL trees. |
| [`demo/profiles/`](profiles/) | Demo app — adds an `Avatar` model to users using the **singleton, non-versioned** mode of [`nside_wefa.attachments`](../nside_wefa/attachments/README.md). |
| [`demo/documents/`](documents/) | Demo app — adds a `Document` model accepting PDFs and Excel files using the **multi, versioned** mode of [`nside_wefa.attachments`](../nside_wefa/attachments/README.md). |
| [`demo/conftest.py`](conftest.py) | Shared pytest fixtures: per-test `MEDIA_ROOT` redirect, byte builders for PNG/PDF, two-user setup. |

Each demo app contains heavily commented `models.py`, `urls.py`, and a
matching `tests/test_*.py` file. The comments explain *why* each line
is there and what the alternatives look like, rather than restating
*what* the code does — they're written as reading material for
developers working through the toolkit for the first time.

## Per-app reading order

The fastest way to learn the toolkit is to read each app's README and
then jump to the matching demo wiring:

1. [`nside_wefa.common`](../nside_wefa/common/) — foundational helpers
   (`get_section`, system check primitives). No demo app of its own;
   the other demos rely on it transparently.
2. [`nside_wefa.authentication`](../nside_wefa/authentication/README.md) —
   wired in `demo/settings.py` and `demo/urls.py`.
3. [`nside_wefa.legal_consent`](../nside_wefa/legal_consent/README.md) —
   wired in `demo/settings.py` and `demo/urls.py`.
4. [`nside_wefa.locale`](../nside_wefa/locale/README.md) —
   wired in `demo/settings.py` and `demo/urls.py`.
5. [`nside_wefa.audit`](../nside_wefa/audit/README.md) —
   wired in `demo/settings.py` and `demo/urls.py`.
6. [`nside_wefa.attachments`](../nside_wefa/attachments/README.md) —
   wired in `demo/settings.py`; demo apps live at
   [`demo/profiles/`](profiles/) and [`demo/documents/`](documents/).

## Running the demo

From the `django/` directory:

```bash
uv sync --all-extras          # install runtime + dev dependencies
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

A few interesting URLs once the server is up:

| URL | What it does |
|---|---|
| `/admin/` | Django admin — log in with the superuser. |
| `/auth/` | Authentication endpoints exposed by `nside_wefa.authentication`. |
| `/legal-consent/agreement/` | Per-user consent state (login required). |
| `/locale/` | List supported locales. |
| `/audit/events/` | Audit event log (staff only). |
| `/me/avatar/` | Demo: singleton avatar (POST to upload, GET to read, GET `/download/` to stream). |
| `/documents/` | Demo: multi-document store (POST to upload v1, POST `/<id>/versions/` to bump, GET `/<id>/versions/` for history). |

## Running the demo's tests

```bash
uv run pytest demo/
```

The demo tests are HTTP-level — they exercise the same endpoints a
frontend would call and exist primarily as worked examples for
consumers writing their own test suites against the toolkit. See
[`demo/profiles/tests/test_avatar.py`](profiles/tests/test_avatar.py)
and [`demo/documents/tests/test_documents.py`](documents/tests/test_documents.py).

## Notes for readers

- The demo intentionally uses `FileSystemStorage` and SQLite. Swap
  these for S3 / Postgres in a real product by editing
  [`STORAGES`](settings.py) and [`DATABASES`](settings.py).
- Several of the per-app READMEs include *additional* configuration
  knobs the demo doesn't exercise. Consult them when adapting a demo
  pattern to a real product.
- The demo project is **not** packaged on PyPI — only the
  `nside_wefa.*` apps are. The demo lives in the source tree to make
  the toolkit easier to learn and to drive the test suite.
