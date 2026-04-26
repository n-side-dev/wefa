"""
System checks for the nside_wefa.audit app.

Validates:

- Application load order: ``nside_wefa.common`` → ``auditlog`` → ``nside_wefa.audit``.
- Presence and shape of the ``NSIDE_WEFA.AUDIT`` settings section. All keys
  are optional; default values keep the app installable with zero config.
- Each model label in ``MODELS`` and ``EXCLUDE_MODELS`` resolves via the
  Django app registry. (Auditlog itself silently drops unresolvable entries
  — failing the boot is the right WeFa default.)
- Each entry in ``BUILTIN_SOURCES`` is a known WeFa source. Missing source
  apps are tolerated (the source is silently skipped at install time) but an
  unknown source name is an error.
"""

from typing import Any, List

from django.core.checks import Error, register

from nside_wefa.common.apps import CommonConfig
from nside_wefa.utils.checks import (
    check_apps_dependencies_order,
    validate_bool,
    validate_dotted_path_callable,
    validate_model_label,
    validate_model_label_dict,
    validate_optional_positive_int,
    validate_string_list,
)

from .apps import AuditConfig
from .builtin import KNOWN_SOURCES


@register()
def wefa_apps_dependencies_check(app_configs, **kwargs) -> List[Error]:
    """Validate INSTALLED_APPS order.

    ``nside_wefa.common`` and ``auditlog`` are independent prerequisites of
    ``nside_wefa.audit`` — their relative order does not matter, but each
    must precede ``nside_wefa.audit``.
    """
    errors: List[Error] = []
    errors.extend(check_apps_dependencies_order([CommonConfig.name, AuditConfig.name]))
    errors.extend(check_apps_dependencies_order(["auditlog", AuditConfig.name]))
    return errors


@register()
def audit_settings_check(app_configs, **kwargs) -> List[Error]:
    """Validate the ``NSIDE_WEFA.AUDIT`` settings section.

    ``NSIDE_WEFA.AUDIT`` itself is optional — a missing or empty section is
    treated as "use all defaults". Only present keys are validated. The
    validators are run directly (rather than through
    :func:`check_nside_wefa_settings`) because that helper rejects empty
    sections, which we explicitly want to accept.
    """
    from django.conf import settings as django_settings

    nside_wefa_settings: Any = getattr(django_settings, "NSIDE_WEFA", None) or {}
    section = nside_wefa_settings.get("AUDIT")
    if section is None:
        return []
    if not isinstance(section, dict):
        return [
            Error(
                f"NSIDE_WEFA.AUDIT must be a dict, got {type(section).__name__}.",
            )
        ]

    validators = {
        "MODELS": validate_model_label_dict("NSIDE_WEFA.AUDIT.MODELS"),
        "INCLUDE_ALL_MODELS": validate_bool("NSIDE_WEFA.AUDIT.INCLUDE_ALL_MODELS"),
        "EXCLUDE_MODELS": _validate_exclude_models,
        "REDACT_FIELDS": validate_string_list("NSIDE_WEFA.AUDIT.REDACT_FIELDS"),
        "DISABLE_REMOTE_ADDR": validate_bool("NSIDE_WEFA.AUDIT.DISABLE_REMOTE_ADDR"),
        "REQUEST_ID_HEADER": _validate_non_empty_string(
            "NSIDE_WEFA.AUDIT.REQUEST_ID_HEADER"
        ),
        "TAMPER_EVIDENT": validate_bool("NSIDE_WEFA.AUDIT.TAMPER_EVIDENT"),
        "RETENTION_DAYS": validate_optional_positive_int(
            "NSIDE_WEFA.AUDIT.RETENTION_DAYS"
        ),
        "BUILTIN_SOURCES": validate_string_list(
            "NSIDE_WEFA.AUDIT.BUILTIN_SOURCES",
            allowed=list(KNOWN_SOURCES),
        ),
        "RAISE_ON_FAILURE": validate_bool("NSIDE_WEFA.AUDIT.RAISE_ON_FAILURE"),
        "ACTOR_RESOLVER": validate_dotted_path_callable(
            "NSIDE_WEFA.AUDIT.ACTOR_RESOLVER"
        ),
    }

    errors: List[Error] = []
    for key, validator in validators.items():
        if key in section:
            errors.extend(validator(section[key]))
    return errors


def _validate_exclude_models(value: Any) -> List[Error]:
    """``EXCLUDE_MODELS`` must be a list of resolvable ``"app.Model"`` labels."""
    errors: List[Error] = []
    if not isinstance(value, list):
        return [
            Error(
                "NSIDE_WEFA.AUDIT.EXCLUDE_MODELS must be a list of "
                f"'app.Model' labels, got {type(value).__name__}.",
            )
        ]
    for label in value:
        label_error = validate_model_label(label)
        if label_error is not None:
            errors.append(Error(f"NSIDE_WEFA.AUDIT.EXCLUDE_MODELS: {label_error.msg}"))
    return errors


def _validate_non_empty_string(setting_path: str):
    """Inline helper for plain non-empty string settings."""

    def _validator(value: Any) -> List[Error]:
        if not isinstance(value, str) or not value:
            return [
                Error(
                    f"{setting_path} must be a non-empty string, got {value!r}.",
                )
            ]
        return []

    return _validator
