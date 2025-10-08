from typing import Any

from django.conf import settings
from django.core.checks import Error, register


@register()
def common_settings_check(app_configs, **kwargs) -> list[Error]:
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
