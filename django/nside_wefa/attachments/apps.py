from django.apps import AppConfig


class AttachmentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.attachments"
    verbose_name = "WeFa Attachments"

    def ready(self) -> None:
        # Import checks so Django registers them during app initialization.
        from . import checks  # noqa: F401
