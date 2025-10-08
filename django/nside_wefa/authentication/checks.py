from typing import Any
from django.core.checks import Error, register

from nside_wefa.authentication.constants import AUTHENTICATION_TYPES
from nside_wefa.authentication.apps import AuthenticationConfig
from nside_wefa.common.apps import CommonConfig
from utils.checks import check_apps_dependencies_order, check_nside_wefa_settings


@register()
def wefa_apps_dependencies_check(app_configs, **kwargs) -> list[Error]:
    # Check INSTALLED_APPS ordering - common must come before authentication
    dependencies = [
        "rest_framework",
        "rest_framework.authtoken",
        "rest_framework_simplejwt",
        CommonConfig.name,
        AuthenticationConfig.name,
    ]
    return check_apps_dependencies_order(dependencies)


def validate_authentication_types(authentication_types: Any) -> list[Error]:
    """Custom validator for AUTHENTICATION.TYPES"""
    errors: list[Error] = []
    if authentication_types:
        for authentication_type in authentication_types:
            if authentication_type not in AUTHENTICATION_TYPES:
                errors.append(
                    Error(
                        f"NSIDE_WEFA.AUTHENTICATION.TYPES is not properly configured. "
                        f"{authentication_type} is not in {AUTHENTICATION_TYPES}.",
                    )
                )
    return errors


@register()
def authentication_settings_check(app_configs, **kwargs) -> list[Error]:
    return check_nside_wefa_settings(
        section_name="AUTHENTICATION",
        required_keys=["TYPES"],
        custom_validators={"TYPES": validate_authentication_types},
    )
