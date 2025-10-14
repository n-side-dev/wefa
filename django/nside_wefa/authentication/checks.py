"""
Authentication system checks for the nside_wefa.authentication app.

This module registers Django system checks related to the authentication app:

- wefa_apps_dependencies_check: verifies that required apps are present and
  correctly ordered in INSTALLED_APPS so that nside_wefa.common is loaded
  before nside_wefa.authentication.
- authentication_settings_check: validates the NSIDE_WEFA.AUTHENTICATION
  configuration, including the TYPES list via a custom validator.

See also

- Django system check framework:
  https://docs.djangoproject.com/en/stable/topics/checks/
- Project settings section: ``NSIDE_WEFA.AUTHENTICATION``
"""

from typing import Any
from django.core.checks import Error, register

from nside_wefa.authentication.constants import AUTHENTICATION_TYPES
from nside_wefa.authentication.apps import AuthenticationConfig
from nside_wefa.common.apps import CommonConfig
from utils.checks import check_apps_dependencies_order, check_nside_wefa_settings


@register()
def wefa_apps_dependencies_check(app_configs, **kwargs) -> list[Error]:
    """Validate app dependency order in ``INSTALLED_APPS``.

    This check ensures the following apps are present and ordered so that
    ``nside_wefa.common`` is loaded before ``nside_wefa.authentication``:
    ``rest_framework``, ``rest_framework.authtoken``,
    ``rest_framework_simplejwt``, ``nside_wefa.common``, and
    ``nside_wefa.authentication`` (in that order).

    :param app_configs: Iterable of Django app configs provided by the
        check framework. Unused in this implementation.
    :param kwargs: Additional keyword arguments provided by Django. Unused.
    :return: A list of errors describing misconfigurations. Empty if the
        order is valid.
    """
    dependencies = [
        "rest_framework",
        "rest_framework.authtoken",
        "rest_framework_simplejwt",
        CommonConfig.name,
        AuthenticationConfig.name,
    ]
    return check_apps_dependencies_order(dependencies)


def validate_authentication_types(authentication_types: Any) -> list[Error]:
    """Validate the ``NSIDE_WEFA.AUTHENTICATION.TYPES`` setting.

    Ensures that each configured authentication type is one of the supported
    values listed in :data:`nside_wefa.authentication.constants.AUTHENTICATION_TYPES`.

    :param authentication_types: Iterable of authentication type identifiers to
        validate. If falsy/``None``, no errors are produced.
    :return: A list of errors for invalid entries. Empty if all entries are
        valid.
    """
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
    """Run validation for the ``NSIDE_WEFA.AUTHENTICATION`` settings section.

    Delegates to :func:`utils.checks.check_nside_wefa_settings` and applies the
    custom validator for the ``TYPES`` key.

    :param app_configs: Iterable of Django app configs provided by the check
        framework. Unused in this implementation.
    :param kwargs: Additional keyword arguments provided by Django. Unused.
    :return: A list of configuration errors. Empty if everything is properly
        configured.
    """
    return check_nside_wefa_settings(
        section_name="AUTHENTICATION",
        required_keys=["TYPES"],
        custom_validators={"TYPES": validate_authentication_types},
    )
