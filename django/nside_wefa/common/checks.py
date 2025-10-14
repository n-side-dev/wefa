"""
Common system checks for the nside_wefa.common app.

This module registers Django system checks that validate the top-level
``NSIDE_WEFA`` settings and ensure required keys are present for the project.

See also
- Django system check framework: https://docs.djangoproject.com/en/stable/topics/checks/
"""

from typing import Any

from django.conf import settings
from django.core.checks import Error, register


@register()
def common_settings_check(app_configs, **kwargs) -> list[Error]:
    """Validate presence of the top-level ``NSIDE_WEFA`` settings.

    This check ensures that the ``NSIDE_WEFA`` dictionary exists in settings
    and contains the required ``APP_NAME`` key used by the project.

    :param app_configs: Iterable of Django app configs provided by the
        check framework. Unused in this implementation.
    :type app_configs: Iterable[django.apps.AppConfig] | None
    :param kwargs: Additional keyword arguments provided by Django. Unused.
    :return: A list of configuration errors for missing settings.
    :rtype: list[django.core.checks.Error]
    """
    errors: list[Error] = []

    nside_wefa_settings: Any = getattr(settings, "NSIDE_WEFA", None)

    if not nside_wefa_settings:
        errors.append(
            Error(
                "NSIDE_WEFA is not defined in settings.py",
            )
        )

    if nside_wefa_settings and "APP_NAME" not in nside_wefa_settings:
        errors.append(
            Error(
                "NSIDE_WEFA is not properly configured. Missing key: 'APP_NAME'.",
            )
        )

    return errors
