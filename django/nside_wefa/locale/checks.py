"""
System checks for the nside_wefa.locale app.

This module registers Django system checks to validate:

- Application load order (``nside_wefa.common`` before ``nside_wefa.locale``)
- Presence and structure of the ``NSIDE_WEFA.LOCALE`` settings, including
  validation that ``AVAILABLE`` is a non-empty list of strings and that
  ``DEFAULT`` is a string contained in ``AVAILABLE``.

See also
- Django system check framework: https://docs.djangoproject.com/en/stable/topics/checks/
"""

from typing import Any
from django.conf import settings
from django.core.checks import Error, register

from nside_wefa.common.apps import CommonConfig
from nside_wefa.locale.apps import LocaleConfig
from nside_wefa.utils.checks import (
    check_nside_wefa_settings,
    check_apps_dependencies_order,
)


@register()
def wefa_apps_dependencies_check(app_configs, **kwargs) -> list[Error]:
    """Validate app dependency order in ``INSTALLED_APPS`` for Locale.

    Ensures that ``nside_wefa.common`` is listed before ``nside_wefa.locale``
    in the Django ``INSTALLED_APPS`` setting.
    """
    dependencies = [CommonConfig.name, LocaleConfig.name]
    return check_apps_dependencies_order(dependencies)


def validate_available_locales(available_locales: Any) -> list[Error]:
    """Validate the ``NSIDE_WEFA.LOCALE.AVAILABLE`` setting.

    Ensures the value is a non-empty list whose entries are all strings.
    """
    errors: list[Error] = []
    if not isinstance(available_locales, list) or not available_locales:
        errors.append(
            Error(
                "NSIDE_WEFA.LOCALE.AVAILABLE is not properly configured. "
                "It must be a non-empty list of locale codes.",
            )
        )
        return errors

    for entry in available_locales:
        if not isinstance(entry, str) or not entry:
            errors.append(
                Error(
                    f"NSIDE_WEFA.LOCALE.AVAILABLE is not properly configured. "
                    f"'{entry!r}' is not a valid locale code (expected a non-empty string).",
                )
            )
    return errors


def validate_default_locale(default_locale: Any) -> list[Error]:
    """Validate the ``NSIDE_WEFA.LOCALE.DEFAULT`` setting.

    Ensures the value is a non-empty string and, when ``AVAILABLE`` is
    defined, that it is a member of that list.
    """
    errors: list[Error] = []
    if not isinstance(default_locale, str) or not default_locale:
        errors.append(
            Error(
                "NSIDE_WEFA.LOCALE.DEFAULT is not properly configured. "
                "It must be a non-empty string.",
            )
        )
        return errors

    nside_wefa_settings: Any = getattr(settings, "NSIDE_WEFA", None)
    locale_settings: Any = (
        nside_wefa_settings.get("LOCALE") if nside_wefa_settings else None
    )
    available = locale_settings.get("AVAILABLE") if locale_settings else None
    if isinstance(available, list) and default_locale not in available:
        errors.append(
            Error(
                f"NSIDE_WEFA.LOCALE.DEFAULT is not properly configured. "
                f"'{default_locale}' is not a member of NSIDE_WEFA.LOCALE.AVAILABLE "
                f"({available}).",
            )
        )
    return errors


@register()
def locale_settings_check(app_configs, **kwargs) -> list[Error]:
    """Validate the ``NSIDE_WEFA.LOCALE`` settings section.

    Delegates to :func:`nside_wefa.utils.checks.check_nside_wefa_settings` to
    ensure the section exists and contains the required keys (``AVAILABLE``
    and ``DEFAULT``), then applies custom validators to check each value.
    """
    return check_nside_wefa_settings(
        section_name="LOCALE",
        required_keys=["AVAILABLE", "DEFAULT"],
        custom_validators={
            "AVAILABLE": validate_available_locales,
            "DEFAULT": validate_default_locale,
        },
    )
