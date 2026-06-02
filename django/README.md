# WeFa Django Toolkit

WeFa (Web Factory) delivers a set of modular Django apps that cover recurring web platform concerns such as authentication bootstrapping and legal consent management. The toolkit focuses on convention-over-configuration so new projects can enable production-grade defaults with minimal setup.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Included Apps](#included-apps)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Requirements](#requirements)
- [Local Development](#local-development)
- [Contributing](#contributing)
- [License](#license)
- [Project Status](#project-status)

## Features

- Shared utilities that power the higher-level apps ([`nside_wefa.common`](nside_wefa/common/))
- Plug-and-play Django REST Framework authentication configuration (token and JWT) ([`nside_wefa.authentication`](nside_wefa/authentication/README.md))
- Legal consent tracking with automatic user onboarding and templated documents ([`nside_wefa.legal_consent`](nside_wefa/legal_consent/README.md))
- Per-user locale persistence with a public discovery endpoint ([`nside_wefa.locale`](nside_wefa/locale/README.md))
- Append-only audit log with REST endpoints, model-registration UX, built-in event sources, and optional tamper-evident hash chain — built on `django-auditlog` ([`nside_wefa.audit`](nside_wefa/audit/README.md))
- Abstract attachment model with versioning, pluggable storage (S3/local/SFTP via `django-storages`), python-magic content-type sniffing, and a generic CRUD endpoint factory ([`nside_wefa.attachments`](nside_wefa/attachments/README.md))
- System checks and sensible defaults so configuration mistakes surface early
- A runnable [demo project](demo/README.md) showing how to consume every app end-to-end

## Installation

Install the package from PyPI:

```bash
pip install nside-wefa
```

Or add it to your dependency file (e.g. `requirements.txt`):

```
nside-wefa>=0.3.0
```

## Included Apps

### [Common](nside_wefa/common/)

Foundational helpers shared across the toolkit. You rarely interact with it directly, but it must be installed before the other apps.

### [Authentication](nside_wefa/authentication/README.md)

Automatically wires Django REST Framework authentication classes, URLs, and dependency checks. See the [authentication README](nside_wefa/authentication/README.md) for the full guide.

### [Legal Consent](nside_wefa/legal_consent/README.md)

Tracks acceptance of privacy and terms documents with templating support and REST endpoints. See the [legal consent README](nside_wefa/legal_consent/README.md) for details.

### [Locale](nside_wefa/locale/README.md)

Persists each user's preferred locale and exposes the supported locales for the project over REST. See the [locale README](nside_wefa/locale/README.md) for details.

### [Audit](nside_wefa/audit/README.md)

Wraps `django-auditlog` to give every product an append-only audit store with four ergonomic ways to register models, REST endpoints (`/audit/events/` for staff, `/audit/me/` for end users), built-in event sources for `auth` / `legal_consent` / `locale`, an optional SHA-256 tamper-evident chain, and management commands for purge / verify / GDPR export. See the [audit README](nside_wefa/audit/README.md) for details.

### [Attachments](nside_wefa/attachments/README.md)

Provides an abstract `Attachment` base model that consumer apps subclass to add file-attachment semantics to their tables. Versioning, storage routing through `django-storages`, whitelist-only content-type sniffing via `python-magic`, streaming size enforcement, hashing, and a generic CRUD endpoint factory in either *singleton* or *multi* mode. See the [attachments README](nside_wefa/attachments/README.md) for details.

### [Demo project](demo/README.md)

A runnable Django project that consumes every WeFa app and ships two illustrative consumer apps (`demo.profiles` for avatars, `demo.documents` for versioned PDFs / spreadsheets). Use it as a worked example when integrating the toolkit into a new project. See the [demo README](demo/README.md) for the reading order and quick start.

The Vue demo playground in [`../vue/`](../vue/README.md) talks to this Django demo over HTTP — its dev client is hard-wired to `http://localhost:8000`, so spin up `manage.py runserver` here before running `npm run dev` on the Vue side.

## Quick Start

1. Install the package.
2. Add the apps to `INSTALLED_APPS` (order matters):

   ```python
   INSTALLED_APPS = [
       # Django + DRF dependencies...
       "rest_framework",
       "rest_framework.authtoken",  # For token auth
       "rest_framework_simplejwt",  # For JWT auth
       "auditlog",                  # Required by nside_wefa.audit
       "nside_wefa.common",
       "nside_wefa.authentication",
       "nside_wefa.legal_consent",
       "nside_wefa.locale",
       "nside_wefa.audit",
       "nside_wefa.attachments",
   ]
   ```

3. Apply migrations:

   ```bash
   python manage.py migrate
   ```

4. Expose the URLs you need:

   ```python
   from django.urls import include, path

   urlpatterns = [
       # ...your URLs
       path("auth/", include("nside_wefa.authentication.urls")),
       path("legal-consent/", include("nside_wefa.legal_consent.urls")),
       path("locale/", include("nside_wefa.locale.urls")),
       path("audit/", include("nside_wefa.audit.urls")),
   ]
   ```

## Configuration

The toolkit reads from a namespaced settings dictionary. Start with the minimal configuration below and extend it as needed:

```python
# settings.py
NSIDE_WEFA = {
    "APP_NAME": "My Product",  # Used in legal consent templates
    "AUTHENTICATION": {
        "TYPES": ["TOKEN", "JWT"],  # Enable the authentication flows you need
    },
    "LEGAL_CONSENT": {
        "VERSION": 1,
        "EXPIRY_LIMIT": 365,  # days
        # "TEMPLATES": BASE_DIR / "templates/legal_consent",  # Optional overrides
    },
    "LOCALE": {
        "AVAILABLE": ["en", "fr"],
        "DEFAULT": "en",
    },
    "AUDIT": {
        # All keys are optional. See the audit README.
        # Track third-party models you can't edit:
        # "MODELS": {"auth.Group": {"include_fields": ["name"]}},
        # "TAMPER_EVIDENT": True,   # SHA-256 hash chain (opt-in)
        # "RETENTION_DAYS": 365,    # used by wefa_audit_purge
    },
    "ATTACHMENTS": {
        # All keys are optional. See the attachments README.
        # "STORAGE": "default",                # alias into settings.STORAGES
        # "MAX_FILE_SIZE": 10 * 1024 * 1024,   # global cap; subclasses may override
        # "UPLOAD_PATH_PREFIX": "attachments/",
        # "HASH_ALGORITHM": "sha256",
        # "CONTENT_TYPE_SNIFF_BYTES": 2048,
    },
}
```

Per-app settings reference: [authentication](nside_wefa/authentication/README.md), [legal consent](nside_wefa/legal_consent/README.md), [locale](nside_wefa/locale/README.md), [audit](nside_wefa/audit/README.md), [attachments](nside_wefa/attachments/README.md).

Validation happens through Django system checks. Run `python manage.py check` to surface configuration issues early.

## Requirements

- Python >= 3.12
- Django >= 6.0.4
- Django REST Framework >= 3.14.0
- djangorestframework-simplejwt >= 5.5.1 (if you enable JWT support)
- django-storages >= 1.14 (used by `nside_wefa.attachments`)
- python-magic >= 0.4.27 (used by `nside_wefa.attachments`; needs `libmagic` on the host)

## Local Development

Clone the repository and install the development extras:

```bash
cd django
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

Run the [demo project](demo/README.md):

```bash
python manage.py migrate
python manage.py runserver
```

Execute the test suite and linters:

```bash
pytest
```

## Contributing

We welcome feature ideas, bug reports, and pull requests. Check [CONTRIBUTE](CONTRIBUTE.md) for the current workflow (it will be merged with the repo-wide guidelines soon). Please include documentation updates and tests when relevant.
