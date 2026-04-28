"""
Django app configuration for the nside_wefa.audit app.

The audit app wraps `django-auditlog`_ and adds the WeFa-specific layers on
top: a namespaced ``NSIDE_WEFA.AUDIT`` settings shape with system checks, an
ergonomic registration API for consuming apps, opinionated REST endpoints,
built-in event sources for the rest of the WeFa toolkit, and optional
tamper-evident / retention / export tooling.

This module also performs the **settings translation** from the WeFa namespace
to django-auditlog's ``AUDITLOG_*`` keys at app startup, so consumers never
need to know which library is underneath.

.. _django-auditlog: https://github.com/jazzband/django-auditlog
"""

from django.apps import AppConfig


class AuditConfig(AppConfig):
    """App configuration for the audit module."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.audit"

    def ready(self) -> None:
        # Import checks so Django registers them during app initialization.
        # The import is intentionally unused; registration happens via
        # decorators in checks.py.
        from . import checks  # noqa: F401

        # Translate NSIDE_WEFA.AUDIT into the django-auditlog AUDITLOG_*
        # settings the upstream library reads. Done here so consumers only
        # ever interact with the WeFa namespace.
        from .settings_translation import apply_to_django_auditlog

        apply_to_django_auditlog()

        # Register declared models (settings-driven Path D and the registry
        # entries collected at import time by Path A/B). Auditlog's own
        # ``register_from_settings`` walks AUDITLOG_INCLUDE_TRACKING_MODELS
        # one more time during ``ready()``.
        from auditlog.registry import auditlog as _auditlog_registry

        _auditlog_registry.register_from_settings()

        # Wire built-in event sources for whichever other WeFa apps are
        # installed and listed in NSIDE_WEFA.AUDIT.BUILTIN_SOURCES.
        from .builtin import install_builtin_sources

        install_builtin_sources()

        # Install the immutability guard so accidental updates / deletes of
        # LogEntry rows raise loudly.
        from . import immutability

        immutability.install_guards()
