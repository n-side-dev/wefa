"""
Django app configuration for the nside_wefa.ai_assistant app.
"""

from django.apps import AppConfig


class AIAssistantConfig(AppConfig):
    """App configuration for the reusable AI assistant module."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.ai_assistant"

    def ready(self) -> None:
        """Register system checks when Django loads the app."""
        from . import checks  # noqa: F401
