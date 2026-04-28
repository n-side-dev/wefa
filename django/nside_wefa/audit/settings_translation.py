"""
Translate ``NSIDE_WEFA.AUDIT`` keys into the ``AUDITLOG_*`` keys understood
by ``django-auditlog``.

Run once on app ready(). All keys are optional; absent keys fall back to the
upstream defaults.
"""

from typing import Any

from django.conf import settings

from nside_wefa.common.settings import get_section

# Default fields whose values are masked in the LogEntry.changes / additional_data
# payloads. Tuned for typical web-app secrets.
DEFAULT_REDACT_FIELDS = ["password", "token", "authorization", "secret", "api_key"]

# Default subset of WeFa apps whose built-in event sources are installed.
DEFAULT_BUILTIN_SOURCES = ["auth", "legal_consent", "locale"]


def apply_to_django_auditlog() -> None:
    """Mirror NSIDE_WEFA.AUDIT into the AUDITLOG_* setting keys.

    Existing AUDITLOG_* settings the project may have set explicitly are NOT
    overridden — WeFa only fills in defaults for keys that are absent.
    """
    section: Any = get_section("AUDIT", default={})

    _set_if_absent(
        "AUDITLOG_INCLUDE_TRACKING_MODELS",
        section.get("MODELS"),
        normalize=_normalize_models_setting,
    )
    _set_if_absent(
        "AUDITLOG_INCLUDE_ALL_MODELS",
        section.get("INCLUDE_ALL_MODELS"),
    )
    _set_if_absent(
        "AUDITLOG_EXCLUDE_TRACKING_MODELS",
        section.get("EXCLUDE_MODELS"),
    )
    _set_if_absent(
        "AUDITLOG_MASK_TRACKING_FIELDS",
        section.get("REDACT_FIELDS", DEFAULT_REDACT_FIELDS),
    )
    _set_if_absent(
        "AUDITLOG_DISABLE_REMOTE_ADDR",
        section.get("DISABLE_REMOTE_ADDR"),
    )
    _set_if_absent(
        "AUDITLOG_CID_HEADER",
        section.get("REQUEST_ID_HEADER"),
    )
    if section.get("TAMPER_EVIDENT"):
        # auditlog.get_logentry_model expects the Django ``app_label.ModelName``
        # form, NOT the dotted Python import path.
        _set_if_absent(
            "AUDITLOG_LOGENTRY_MODEL",
            "audit.WefaLogEntry",
        )


def _set_if_absent(setting_name: str, value: Any, normalize: Any = None) -> None:
    """Set ``settings.<setting_name>`` to ``value`` only if absent and value is not None."""
    if value is None:
        return
    if hasattr(settings, setting_name):
        return
    if normalize is not None:
        value = normalize(value)
    setattr(settings, setting_name, value)


def _normalize_models_setting(models: Any) -> Any:
    """Normalize ``NSIDE_WEFA.AUDIT.MODELS`` to auditlog's expected shape.

    auditlog accepts the same ``{label: options}`` shape as WeFa, so this is
    largely a passthrough — it's kept as a separate function so future schema
    drift is contained here.
    """
    if not isinstance(models, dict):
        return models
    return {label: dict(options or {}) for label, options in models.items()}
