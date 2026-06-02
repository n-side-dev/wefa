"""Django system checks for the attachments app.

Validates ``NSIDE_WEFA.ATTACHMENTS`` and the order of installed apps. Per-
subclass validation (each concrete model declaring ``allowed_content_types``
etc.) lives in the registration factory so it runs against models known
to the URL surface.
"""

import hashlib
from typing import Any, List

from django.conf import settings
from django.core.checks import Error, register

from nside_wefa.common.apps import CommonConfig
from nside_wefa.utils.checks import (
    check_apps_dependencies_order,
    check_nside_wefa_settings,
    validate_optional_positive_int,
)

from .apps import AttachmentsConfig


def _validate_storage_alias(value: Any) -> List[Error]:
    if not isinstance(value, str) or not value:
        return [
            Error(
                "NSIDE_WEFA.ATTACHMENTS.STORAGE must be a non-empty string alias "
                f"into settings.STORAGES, got {value!r}.",
            )
        ]
    storages_setting = getattr(settings, "STORAGES", None) or {}
    if value not in storages_setting:
        return [
            Error(
                f"NSIDE_WEFA.ATTACHMENTS.STORAGE alias '{value}' is not declared "
                "in settings.STORAGES.",
            )
        ]
    return []


def _validate_hash_algorithm(value: Any) -> List[Error]:
    if not isinstance(value, str) or value not in hashlib.algorithms_guaranteed:
        return [
            Error(
                "NSIDE_WEFA.ATTACHMENTS.HASH_ALGORITHM must be one of "
                f"{sorted(hashlib.algorithms_guaranteed)}, got {value!r}.",
            )
        ]
    return []


def _validate_positive_int(setting_path: str):
    def _validator(value: Any) -> List[Error]:
        if isinstance(value, bool) or not isinstance(value, int) or value <= 0:
            return [
                Error(
                    f"{setting_path} must be a positive integer, got {value!r}.",
                )
            ]
        return []

    return _validator


def _validate_upload_path_prefix(value: Any) -> List[Error]:
    if not isinstance(value, str):
        return [
            Error(
                "NSIDE_WEFA.ATTACHMENTS.UPLOAD_PATH_PREFIX must be a string, "
                f"got {type(value).__name__}.",
            )
        ]
    return []


@register()
def attachments_settings_check(app_configs, **kwargs) -> List[Error]:
    """Validate the ``NSIDE_WEFA.ATTACHMENTS`` settings section.

    All keys are optional — defaults live in :class:`AttachmentsSettings`.
    When a key is provided, it must be the right shape.
    """
    return check_nside_wefa_settings(
        section_name="ATTACHMENTS",
        required_keys=[],
        custom_validators={
            "STORAGE": _validate_storage_alias,
            "MAX_FILE_SIZE": validate_optional_positive_int(
                "NSIDE_WEFA.ATTACHMENTS.MAX_FILE_SIZE"
            ),
            "UPLOAD_PATH_PREFIX": _validate_upload_path_prefix,
            "HASH_ALGORITHM": _validate_hash_algorithm,
            "CONTENT_TYPE_SNIFF_BYTES": _validate_positive_int(
                "NSIDE_WEFA.ATTACHMENTS.CONTENT_TYPE_SNIFF_BYTES"
            ),
        },
    )


@register()
def attachments_apps_dependencies_check(app_configs, **kwargs) -> List[Error]:
    """Ensure ``nside_wefa.common`` is installed before ``nside_wefa.attachments``."""
    return check_apps_dependencies_order([CommonConfig.name, AttachmentsConfig.name])
