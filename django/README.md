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
- System checks and sensible defaults so configuration mistakes surface early

## Installation

Install the package from PyPI:

```bash
pip install nside-wefa
```

Or add it to your dependency file (e.g. `requirements.txt`):

```
nside-wefa>=0.1.0
```

## Included Apps

### Common

Foundational helpers shared across the toolkit. You rarely interact with it directly, but it must be installed before the other apps.

### Authentication

Automatically wires Django REST Framework authentication classes, URLs, and dependency checks. See `nside_wefa/authentication/README.md` for the full guide.

### Legal Consent

Tracks acceptance of privacy and terms documents with templating support and REST endpoints. See `nside_wefa/legal_consent/README.md` for details.

## Quick Start

1. Install the package.
2. Add the apps to `INSTALLED_APPS` (order matters):

   ```python
   INSTALLED_APPS = [
       # Django + DRF dependencies...
       "rest_framework",
       "rest_framework.authtoken",  # For token auth
       "rest_framework_simplejwt",  # For JWT auth
       "nside_wefa.common",
       "nside_wefa.authentication",
       "nside_wefa.legal_consent",
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
}
```

Validation happens through Django system checks. Run `python manage.py check` to surface configuration issues early.

## Requirements

- Python >= 3.12
- Django >= 5.2.6
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