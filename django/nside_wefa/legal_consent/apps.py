from django.apps import AppConfig


class LegalConsentConfig(AppConfig):
    """
    Django app configuration for the LegalConsent module.

    This configuration class defines the settings and metadata for the LegalConsent app,
    which provides functionality for managing user consent and agreement tracking
    in compliance with legal compliance.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.legal_consent"

    def ready(self) -> None:
        # Import checks so Django registers them during app initialization
        # The import is intentionally unused; registration happens via decorators in checks.py
        from . import checks  # noqa: F401
