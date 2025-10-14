"""
Django app configuration for the nside_wefa.authentication app.

This app wires up authentication-related system checks and initializes
auth framework defaults based on project settings.
"""

from django.apps import AppConfig

from nside_wefa.authentication.utils.settings_initialization import initialize_settings


class AuthenticationConfig(AppConfig):
    """App configuration for the authentication package."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.authentication"

    def ready(self) -> None:
        """Register system checks and initialize DRF settings at startup."""
        # Import checks so Django registers them during app initialization.
        # The import is intentionally unused; registration happens via decorators in checks.py
        from . import checks  # noqa: F401

        initialize_settings()
