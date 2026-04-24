# WeFa Locale App

A Django application that persists each user's preferred locale and exposes
it through a small REST API.

## Overview

The Locale app stores a single locale code per user via the `UserLocale`
model and exposes endpoints so that a frontend can fetch and update the
user's preference. A companion public endpoint returns the list of locales
supported by the project, making it possible to render a locale picker
before the user authenticates.

## Features

- **Per-user persistence**: each user owns a single `UserLocale` row.
- **Automatic creation**: a `UserLocale` row is created on user creation
  via a `post_save` signal, mirroring the `legal_consent` pattern.
- **Validation at the edge**: the serializer rejects any code that is not
  listed in `NSIDE_WEFA.LOCALE.AVAILABLE`.
- **Public discovery endpoint**: `GET /locale/available/` returns the
  supported codes and the default, without authentication.

## Installation

1. Add `'nside_wefa.common'` and `'nside_wefa.locale'` to your
   `INSTALLED_APPS` (the common app must be registered first):

   ```python
   INSTALLED_APPS = [
       # ... other apps
       'nside_wefa.common',
       'nside_wefa.locale',
   ]
   ```

2. Run migrations:

   ```bash
   python manage.py migrate
   ```

3. Include the URLs in your project's main `urls.py`:

   ```python
   from django.urls import path, include

   urlpatterns = [
       # ... other URL patterns
       path('locale/', include('nside_wefa.locale.urls')),
   ]
   ```

## Configuration

Configure the Locale app in your Django settings:

```python
NSIDE_WEFA = {
    "APP_NAME": "Your Application Name",
    "LOCALE": {
        "AVAILABLE": ["en", "fr"],
        "DEFAULT": "en",
    },
}
```

**Required settings:**

- `NSIDE_WEFA.LOCALE.AVAILABLE`: non-empty list of locale codes (strings)
  supported by this project.
- `NSIDE_WEFA.LOCALE.DEFAULT`: the fallback locale code used when no user
  preference is available. Must be a member of `AVAILABLE`.

The app registers system checks that validate the above. Run them with:

```bash
python manage.py check
```

## Endpoints

- **GET `/locale/user/`** — authenticated: returns the current user's locale
  as `{"code": "<locale>" | null}`.
- **PATCH `/locale/user/`** — authenticated: updates the current user's
  locale. Request body: `{"code": "fr"}`. A 400 is returned if the code is
  not a member of `AVAILABLE`.
- **GET `/locale/available/`** — anonymous: returns
  `{"available": ["en", "fr"], "default": "en"}`.

## Models

### UserLocale

- `user` (OneToOneField): Links to Django's user model.
- `code` (CharField, optional): BCP-47 style locale code (e.g. `"en"`).
  Null until the user explicitly chooses a locale.

## Signal Handlers

### create_user_locale

A `post_save` signal handler that creates a `UserLocale` row whenever a new
user is created. This keeps the one-to-one invariant intact and removes the
need for any code path to handle the "missing" case.

## Testing

```bash
cd django
pytest nside_wefa/locale/
```
