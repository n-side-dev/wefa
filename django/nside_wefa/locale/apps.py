"""
Django app configuration for the nside_wefa.locale app.

This app registers system checks and provides views, models, and serializers
for managing each user's preferred locale.
"""

from django.apps import AppConfig


class LocaleConfig(AppConfig):
    """
    Django app configuration for the Locale module.

    This configuration class defines the settings and metadata for the Locale app,
    which provides functionality to persist and expose each user's preferred
    locale code along with the list of locales supported by the project.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.locale"

    def ready(self) -> None:
        # Import checks so Django registers them during app initialization
        # The import is intentionally unused; registration happens via decorators in checks.py
        from . import checks  # noqa: F401
