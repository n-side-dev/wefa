"""
Utility functions to implement Django system checks for nside_wefa.

This module provides helpers used by the nside_wefa Django apps to validate
project configuration and application ordering:

- check_nside_wefa_settings: validates NSIDE_WEFA.<SECTION> configuration.
- check_apps_dependencies_order: verifies INSTALLED_APPS ordering for dependent apps.

See also
- Django system check framework: https://docs.djangoproject.com/en/stable/topics/checks/
"""

from typing import Any, Dict, List, Callable, Optional
from django.conf import settings
from django.core.checks import Error


def check_nside_wefa_settings(
    section_name: str,
    required_keys: List[str],
    custom_validators: Optional[Dict[str, Callable[[Any], List[Error]]]] = None,
) -> List[Error]:
    """Validate a subsection of the ``NSIDE_WEFA`` settings.

    This function checks that the top-level ``NSIDE_WEFA`` dictionary contains
    a subsection named ``section_name`` and that all ``required_keys`` are
    present in that subsection. If ``custom_validators`` are provided, each
    callable will be invoked for its corresponding key to perform additional
    validation.

    :param section_name: The subsection name under ``NSIDE_WEFA`` (e.g.,
        ``"AUTHENTICATION"``).
    :type section_name: str
    :param required_keys: Keys that must be present in the subsection.
    :type required_keys: list[str]
    :param custom_validators: Mapping of setting key to a callable that receives
        the value for that key and returns a list of errors for that key.
    :type custom_validators: dict[str, Callable[[Any], list[django.core.checks.Error]]] | None
    :return: A list of configuration errors. Empty if everything is correctly configured.
    :rtype: list[django.core.checks.Error]
    """
    errors: List[Error] = []

    # Get NSIDE_WEFA settings
    nside_wefa_settings: Any = getattr(settings, "NSIDE_WEFA", None)
    section_settings: Any = (
        nside_wefa_settings.get(section_name) if nside_wefa_settings else None
    )

    # Check if main settings and section exist
    if not nside_wefa_settings or not section_settings:
        errors.append(
            Error(
                f"NSIDE_WEFA.{section_name} is not defined in settings.py",
            )
        )
        return errors  # No point in further validation if section doesn't exist

    # Check required keys
    for key in required_keys:
        if key not in section_settings:
            errors.append(
                Error(
                    f"NSIDE_WEFA.{section_name} is not properly configured. Missing key: '{key}'.",
                )
            )

    # Run custom validators if provided
    if custom_validators:
        for key, validator in custom_validators.items():
            if key in section_settings:
                custom_errors = validator(section_settings[key])
                errors.extend(custom_errors)

    return errors


def check_apps_dependencies_order(dependencies: list[str]) -> list[Error]:
    """Verify the ordering of dependent apps in ``INSTALLED_APPS``.

    Given an ordered list of app labels, this ensures that each app appears
    before the next one in Django's ``INSTALLED_APPS`` and that required apps
    are present.

    :param dependencies: Ordered app labels to enforce.
    :type dependencies: list[str]
    :return: Errors for ordering violations or missing apps. Empty if valid.
    :rtype: list[django.core.checks.Error]
    """
    errors: list[Error] = []
    installed_apps = getattr(settings, "INSTALLED_APPS", [])

    if len(dependencies) < 2:
        return errors  # Nothing to check if less than 2 dependencies

    # Check each pair of consecutive dependencies
    for i in range(len(dependencies) - 1):
        first_app = dependencies[i]
        second_app = dependencies[i + 1]

        try:
            first_index = installed_apps.index(first_app)
            second_index = installed_apps.index(second_app)

            if first_index > second_index:
                errors.append(
                    Error(
                        f"'{first_app}' must be listed before '{second_app}' in INSTALLED_APPS. "
                        f"Currently '{first_app}' is at position {first_index} and "
                        f"'{second_app}' is at position {second_index}.",
                    )
                )
        except ValueError:
            # Handle case where first app is not in INSTALLED_APPS
            if first_app not in installed_apps:
                errors.append(
                    Error(
                        f"'{first_app}' is required in INSTALLED_APPS when using '{second_app}'.",
                    )
                )

    return errors
