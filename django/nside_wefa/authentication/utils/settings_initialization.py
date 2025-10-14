"""
Initialize underlying authentication framework defaults based on configured authentication types.

This module inspects the project's NSIDE_WEFA authentication settings at app
startup and configures REST framework's default authentication and permission
classes accordingly.
"""

from django.conf import settings

from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT
import logging

from nside_wefa.authentication.utils.utils import get_authentication_types

logger = logging.getLogger(__name__)


def initialize_settings():
    """Apply DRF defaults derived from ``NSIDE_WEFA.AUTHENTICATION.TYPES``.

    Depending on whether ``TOKEN`` and/or ``JWT`` authentication are enabled,
    this sets ``REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES']`` and ensures
    ``IsAuthenticated`` is used as the default permission class.
    """
    authentication_types = get_authentication_types()
    default_authentication_classes = []
    default_permission_classes = [
        "rest_framework.permissions.IsAuthenticated",
    ]
    if AUTH_TYPE_TOKEN in authentication_types:
        default_authentication_classes.append(
            "rest_framework.authentication.TokenAuthentication"
        )

    if AUTH_TYPE_JWT in authentication_types:
        default_authentication_classes.append(
            "rest_framework_simplejwt.authentication.JWTAuthentication"
        )

    settings.REST_FRAMEWORK.update(
        {
            "DEFAULT_AUTHENTICATION_CLASSES": default_authentication_classes,
            "DEFAULT_PERMISSION_CLASSES": default_permission_classes,
        }
    )
