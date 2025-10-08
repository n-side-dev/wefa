from django.apps import AppConfig


class CommonConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.common"

    def ready(self) -> None:
        # Import checks so Django registers them during app initialization
        # The import is intentionally unused; registration happens via decorators in checks.py
        from . import checks  # noqa: F401
