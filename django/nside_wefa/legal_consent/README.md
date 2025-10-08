# WeFa Legal Consent App

A Django application for managing Legal Consent compliance by tracking user consents and serving legal documents.

## Overview

The Legal Consent app automatically creates and manages consent records for users in your Django application. It ensures that every user has an associated consent record to track consent versions and expiration dates. Additionally, it provides endpoints for serving legal documents with customizable templates.

## Features

- **Automatic LegalConsent Creation**: Automatically creates a LegalConsent record when a new user is created
- **Version Tracking**: Track different versions of LegalConsent agreements
- **Expiration Management**: Set and track expiration dates for LegalConsent agreements
- **Migration Support**: Includes migration to create LegalConsent agreements for existing users
- **Legal Documents Serving**: Provides endpoints for Terms of Use and Privacy Notice documents
- **Template Customization**: Supports custom legal document templates with app name templating
- **Template Validation**: Includes system checks to validate required template files

## Installation

1. Add `'nside_wefa.common'` and `'nside_wefa.legal_consent'` to your `INSTALLED_APPS` in Django settings (the common app must be registered first):

```python
INSTALLED_APPS = [
    # ... other apps
    'nside_wefa.common',
    'nside_wefa.legal_consent',
]
```

2. Run migrations to create the necessary database tables:

```bash
python manage.py makemigrations legal_consent
python manage.py migrate
```

3. Include the LegalConsent URLs in your project's main `urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... other URL patterns
    path('legal-consent/', include('nside_wefa.legal_consent.urls')),
    # ... other URL patterns
]
```

## Legal Templates

The Legal Consent app provides endpoints for serving Terms of Use and Privacy Notice documents with customizable templates.

### Available Endpoints

- **GET `/legal-consent/terms-of-service/`**: Returns the Terms of Use document as plain text
- **GET `/legal-consent/privacy-policy/`**: Returns the Privacy Notice document as plain text

### Default Templates

The app includes default markdown templates located in `nside_wefa/legal_consent/templates/`:

- `terms_of_use.md`: Default Terms of Use template
- `privacy_notice.md`: Default Privacy Notice template

These templates support the following template variables:
- `{{app_name}}`: Replaced with the application name from settings

### Template Customization

You can override the default templates by configuring the `TEMPLATES` setting in your `NSIDE_WEFA.LEGAL_CONSENT` configuration:

```python
NSIDE_WEFA = {
    "APP_NAME": "Your App Name",
    "LEGAL_CONSENT": {
        "VERSION": 1,
        "EXPIRY_LIMIT": 365,
        "TEMPLATES": "/path/to/your/project/templates/legal_consent",
    },
}
```

When using custom templates:

1. **Create the template directory**: Create the directory specified in the `TEMPLATES` setting
2. **Add required files**: Both `privacy_notice.md` and `terms_of_use.md` must be present
3. **Use template variables**: Include `{{app_name}}` and `{{current_date}}` as needed

**Example custom template** (`privacy_notice.md`):

```markdown
# Privacy Notice for {{app_name}}

{{app_name}} is committed to protecting your privacy.

## Information We Collect

{{app_name}} may collect personal information when you use our services.

---

Last updated: {{current_date}}
```

### Template Validation

The app includes system checks that validate:

- Required LEGAL_CONSENT settings are properly configured
- When `TEMPLATES` setting is specified, both `privacy_notice.md` and `terms_of_use.md` files exist
- Template files are accessible and readable

Run Django's system checks to validate your configuration:

```bash
python manage.py check
```

### Configuration

Configure the Legal Consent app in your Django settings:

```python
NSIDE_WEFA = {
    "APP_NAME": "Your Application Name",  # Used in template variables
    "LEGAL_CONSENT": {
        "VERSION": 1,                     # Current legal documents version
        "EXPIRY_LIMIT": 365,             # Agreement expiry in days
        "TEMPLATES": "/path/to/templates", # Optional: Custom template directory
    },
}
```

**Required settings:**
- `NSIDE_WEFA.LEGAL_CONSENT.VERSION`: Current legal consent version number
- `NSIDE_WEFA.LEGAL_CONSENT.EXPIRY_LIMIT`: Number of days until agreements expire

**Optional settings:**
- `NSIDE_WEFA.APP_NAME`: Application name used in templates (defaults to "Application")
- `NSIDE_WEFA.LEGAL_CONSENT.TEMPLATES`: Path to custom template directory

## Models

### LegalConsent

The main model that stores legal consent information for each user.

**Fields:**
- `user` (OneToOneField): Links to Django's User model
- `version` (IntegerField, optional): Version of the legal documents
- `accepted_at` (DateTimeField, optional): Date of consent

**Features:**
- One-to-one relationship with User model
- Automatically created when a new user is registered
- Cascade deletion when user is deleted

## Signal Handlers

### create_legal_consent_agreement

A Django signal handler that automatically creates a `LegalConsent` instance whenever a new user is created. This ensures that every user in the system has a corresponding consent record.

## Usage

### Basic Usage

Once installed, the app works automatically. Every time a new user is created in your Django application, a corresponding legal consent will be created.

### Accessing LegalConsent

```python
from django.contrib.auth.models import User
from nside_wefa.legal_consent.models.legal_consent import LegalConsent

# Get user's legal consent
user = User.objects.get(username='example_user')
legal_consent = user.legalconsent

# Update legal consent version
legal_consent.version = 2
legal_consent.save()

# Set acceptance date
from datetime import datetime, timedelta

legal_consent.accepted_at = datetime.now()
legal_consent.save()
```

### Admin Integration

The model includes proper verbose names and string representation for easy admin interface integration.

## Migration Behavior

The initial migration includes a data migration that creates Legal Consent records for any existing users in the system. This ensures backward compatibility when adding the LegalConsent app to an existing Django project.

## Requirements

- Django >= 3.2
- Python >= 3.8

## Testing

The app includes comprehensive tests covering:
- Model functionality
- Signal handler behavior
- Migration operations
- Integration scenarios
- Legal template views and customization
- System checks and validation

Run tests with:
```bash
python manage.py test legal_consent
```

## License

Distributed under the Apache-2.0 license alongside the rest of the WeFa project.