"""
URL configuration for the nside_wefa.authentication app.

This module exposes authentication endpoints depending on the configured
authentication types in ``NSIDE_WEFA.AUTHENTICATION.TYPES``. When enabled:

- ``TOKEN``: exposes ``/token-auth/`` using Django REST framework token auth.
- ``JWT``: exposes ``/token/`` and ``/token/refresh/`` using SimpleJWT.
"""

from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT
from nside_wefa.authentication.utils.utils import get_authentication_types

app_name = "authentication"

urlpatterns = []

authentication_types = get_authentication_types()

if AUTH_TYPE_TOKEN in authentication_types:
    urlpatterns.extend(
        [
            path("token-auth/", obtain_auth_token, name="api-auth"),
        ]
    )

if AUTH_TYPE_JWT in authentication_types:
    urlpatterns.extend(
        [
            path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
            path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
        ]
    )
