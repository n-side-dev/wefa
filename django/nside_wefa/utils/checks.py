"""
Utility functions to implement Django system checks for nside_wefa.

This module provides helpers used by the nside_wefa Django apps to validate
project configuration and application ordering:

- check_nside_wefa_settings: validates NSIDE_WEFA.<SECTION> configuration.
- check_apps_dependencies_order: verifies INSTALLED_APPS ordering for dependent apps.
- Primitive validators (validate_bool, validate_optional_positive_int,
  validate_string_list, validate_dotted_path_callable, validate_model_label)
  composable inside ``custom_validators`` mappings.

See also
- Django system check framework: https://docs.djangoproject.com/en/stable/topics/checks/
"""

from importlib import import_module
from typing import Any, Callable, Dict, List, Optional

from django.apps import apps as django_apps
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


# ---------------------------------------------------------------------------
# Primitive validators — composable inside ``check_nside_wefa_settings``'s
# ``custom_validators`` mapping. They share a small partial-application pattern
# so each one returns a callable suitable for that mapping.
# ---------------------------------------------------------------------------


def validate_bool(setting_path: str) -> Callable[[Any], List[Error]]:
    """Return a validator that ensures the value is a boolean."""

    def _validator(value: Any) -> List[Error]:
        if not isinstance(value, bool):
            return [
                Error(
                    f"{setting_path} must be a boolean, got {type(value).__name__}.",
                )
            ]
        return []

    return _validator


def validate_optional_positive_int(
    setting_path: str,
) -> Callable[[Any], List[Error]]:
    """Return a validator that accepts ``None`` or a positive integer."""

    def _validator(value: Any) -> List[Error]:
        if value is None:
            return []
        if isinstance(value, bool) or not isinstance(value, int):
            return [
                Error(
                    f"{setting_path} must be a positive integer or None, "
                    f"got {value!r}.",
                )
            ]
        if value <= 0:
            return [
                Error(
                    f"{setting_path} must be a positive integer or None, "
                    f"got {value!r}.",
                )
            ]
        return []

    return _validator


def validate_string_list(
    setting_path: str, allowed: Optional[List[str]] = None
) -> Callable[[Any], List[Error]]:
    """Return a validator that ensures the value is a list of non-empty strings.

    When ``allowed`` is provided, every entry must additionally be one of the
    allowed values.
    """

    def _validator(value: Any) -> List[Error]:
        errors: List[Error] = []
        if not isinstance(value, list):
            return [
                Error(
                    f"{setting_path} must be a list of strings, "
                    f"got {type(value).__name__}.",
                )
            ]
        for entry in value:
            if not isinstance(entry, str) or not entry:
                errors.append(
                    Error(
                        f"{setting_path} entries must be non-empty strings, "
                        f"got {entry!r}.",
                    )
                )
                continue
            if allowed is not None and entry not in allowed:
                errors.append(
                    Error(
                        f"{setting_path} entry {entry!r} is not allowed. "
                        f"Expected one of {allowed}.",
                    )
                )
        return errors

    return _validator


def validate_dotted_path_callable(
    setting_path: str,
) -> Callable[[Any], List[Error]]:
    """Return a validator that resolves the value as a dotted-path callable."""

    def _validator(value: Any) -> List[Error]:
        if not isinstance(value, str) or "." not in value:
            return [
                Error(
                    f"{setting_path} must be a dotted Python path string, "
                    f"got {value!r}.",
                )
            ]
        module_path, _, attr = value.rpartition(".")
        try:
            module = import_module(module_path)
        except ImportError as exc:
            return [
                Error(
                    f"{setting_path} could not be imported: {exc}.",
                )
            ]
        target = getattr(module, attr, None)
        if target is None:
            return [
                Error(
                    f"{setting_path} resolved {module_path!r} but it has no "
                    f"attribute {attr!r}.",
                )
            ]
        if not callable(target):
            return [
                Error(
                    f"{setting_path} resolved to {value!r} but it is not callable.",
                )
            ]
        return []

    return _validator


def validate_model_label(label: Any) -> Optional[Error]:
    """Resolve an ``"app_label.ModelName"`` string via the Django app registry.

    Returns ``None`` on success, an :class:`~django.core.checks.Error` instance
    when the label is malformed or unresolvable. Useful inside higher-level
    validators that walk a settings dict of model labels.
    """
    if not isinstance(label, str) or "." not in label:
        return Error(
            f"Model label {label!r} must be a string of the form 'app_label.ModelName'.",
        )
    try:
        django_apps.get_model(label)
    except LookupError as exc:
        return Error(
            f"Model label {label!r} could not be resolved: {exc}.",
        )
    except ValueError as exc:
        return Error(
            f"Model label {label!r} is invalid: {exc}.",
        )
    return None


def validate_model_label_dict(
    setting_path: str,
) -> Callable[[Any], List[Error]]:
    """Return a validator that ensures the value is a ``{label: dict}`` mapping.

    Each key must be a resolvable ``"app_label.ModelName"`` string. Each value
    must be a (possibly empty) dict — option contents are validated by callers
    that know which keys make sense for them.
    """

    def _validator(value: Any) -> List[Error]:
        errors: List[Error] = []
        if not isinstance(value, dict):
            return [
                Error(
                    f"{setting_path} must be a dict mapping 'app.Model' labels to options, "
                    f"got {type(value).__name__}.",
                )
            ]
        for label, options in value.items():
            label_error = validate_model_label(label)
            if label_error is not None:
                errors.append(
                    Error(
                        f"{setting_path}: {label_error.msg}",
                    )
                )
            if not isinstance(options, dict):
                errors.append(
                    Error(
                        f"{setting_path}[{label!r}] options must be a dict, "
                        f"got {type(options).__name__}.",
                    )
                )
        return errors

    return _validator
