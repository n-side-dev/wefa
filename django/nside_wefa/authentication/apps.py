from django.apps import AppConfig

from nside_wefa.authentication.utils.settings_initialization import initialize_settings


class AuthenticationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.authentication"

    def ready(self) -> None:
        # Import checks so Django registers them during app initialization
        # The import is intentionally unused; registration happens via decorators in checks.py
        from . import checks  # noqa: F401

        initialize_settings()
