from typing import Any, Dict, List, Callable, Optional
from django.conf import settings
from django.core.checks import Error


def check_nside_wefa_settings(
    section_name: str,
    required_keys: List[str],
    custom_validators: Optional[Dict[str, Callable[[Any], List[Error]]]] = None,
) -> List[Error]:
    """
    Generic function to check NSIDE_WEFA settings configuration.

    Args:
        section_name: The section name under NSIDE_WEFA (e.g., "AUTHENTICATION", "GDPR")
        required_keys: List of required keys that must be present in the section
        custom_validators: Optional dict mapping keys to custom validation functions

    Returns:
        List of Error objects for any configuration issues
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
    """
    Check that apps in the dependencies list are ordered correctly in INSTALLED_APPS.

    Args:
        dependencies: An ordered list of app names that should appear in this order
                     in INSTALLED_APPS. Each app must come before the next one in the list.

    Returns:
        List of Error objects for any ordering violations or missing required apps.
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
