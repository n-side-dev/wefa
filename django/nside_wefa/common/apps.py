"""
Django app configuration for the nside_wefa.common app.

This foundational app should be loaded before other nside_wefa apps and
provides shared utilities and system checks.
"""

from django.apps import AppConfig


class CommonConfig(AppConfig):
    """App configuration for the shared common package."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.common"

    def ready(self) -> None:
        """Register common system checks at startup."""
        # Import checks so Django registers them during app initialization
        # The import is intentionally unused; registration happens via decorators in checks.py
        from . import checks  # noqa: F401
