from django.conf import settings

from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT
import logging

from nside_wefa.authentication.utils.utils import get_authentication_types

logger = logging.getLogger(__name__)


def initialize_settings():
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
