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

- Shared utilities that power the higher-level apps (`nside_wefa.common`)
- Plug-and-play Django REST Framework authentication configuration (token and JWT) (`nside_wefa.authentication`)
- Legal consent tracking with automatic user onboarding and templated documents (`nside_wefa.legal_consent`)
- Per-user locale persistence with a public discovery endpoint (`nside_wefa.locale`)
- Append-only audit log with REST endpoints, model-registration UX, built-in event sources, and optional tamper-evident hash chain — built on `django-auditlog` (`nside_wefa.audit`)
- System checks and sensible defaults so configuration mistakes surface early

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

### Common

Foundational helpers shared across the toolkit. You rarely interact with it directly, but it must be installed before the other apps.

### Authentication

Automatically wires Django REST Framework authentication classes, URLs, and dependency checks. See `nside_wefa/authentication/README.md` for the full guide.

### Legal Consent

Tracks acceptance of privacy and terms documents with templating support and REST endpoints. See `nside_wefa/legal_consent/README.md` for details.

### Locale

Persists each user's preferred locale and exposes the supported locales for the project over REST. See `nside_wefa/locale/README.md` for details.

### Audit

Wraps `django-auditlog` to give every product an append-only audit store with four ergonomic ways to register models, REST endpoints (`/audit/events/` for staff, `/audit/me/` for end users), built-in event sources for `auth` / `legal_consent` / `locale`, an optional SHA-256 tamper-evident chain, and management commands for purge / verify / GDPR export. See `nside_wefa/audit/README.md` for details.

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
        # All keys are optional. See nside_wefa/audit/README.md.
        # Track third-party models you can't edit:
        # "MODELS": {"auth.Group": {"include_fields": ["name"]}},
        # "TAMPER_EVIDENT": True,   # SHA-256 hash chain (opt-in)
        # "RETENTION_DAYS": 365,    # used by wefa_audit_purge
    },
}
```

Validation happens through Django system checks. Run `python manage.py check` to surface configuration issues early.

## Requirements

- Python >= 3.12
- Django >= 6.0.4
- Django REST Framework >= 3.14.0
- djangorestframework-simplejwt >= 5.5.1 (if you enable JWT support)

## Local Development

Clone the repository and install the development extras:

```bash
cd django
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

Run the demo project:

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
