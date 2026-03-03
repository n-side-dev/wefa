"""Application configuration objects and environment loading helpers."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _env_bool(name: str, default: bool) -> bool:
    """Parse a boolean environment variable.

    :param name: Environment variable name.
    :param default: Value returned when the environment variable is absent.
    :returns: Parsed boolean value.
    :rtype: bool
    """
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class BffSettings:
    """Immutable runtime settings used by endpoint handlers.

    :ivar flask_secret_key: Secret key used to sign the Flask session cookie.
    :ivar session_cookie_name: Name of the session cookie.
    :ivar session_cookie_path: Path scope of the session cookie.
    :ivar session_cookie_httponly: Whether JavaScript access to the cookie is disabled.
    :ivar session_cookie_secure: Whether cookie transport is restricted to HTTPS.
    :ivar session_cookie_samesite: SameSite policy applied to the session cookie.
    :ivar cors_allowed_origin: Allowed CORS origin for browser requests.
    :ivar backend_endpoint: Base URL of the proxied backend API.
    :ivar oauth_client_id: OAuth client identifier.
    :ivar oauth_client_secret: OAuth client secret.
    :ivar oauth_oidc_scope: Requested OIDC scope.
    :ivar oauth_endpoint_authorization: OAuth authorization endpoint URL.
    :ivar oauth_endpoint_token: OAuth token endpoint URL.
    :ivar oauth_endpoint_userinfo: OAuth userinfo endpoint URL.
    :ivar oauth_endpoint_logout: OAuth logout endpoint URL.
    :ivar oauth_login_redirect_uri: Redirect URI handled by the BFF callback.
    :ivar frontend_redirect: Frontend URL used after login callback.
    """
    flask_secret_key: str | None
    session_cookie_name: str | None
    session_cookie_path: str
    session_cookie_httponly: bool
    session_cookie_secure: bool
    session_cookie_samesite: str
    cors_allowed_origin: str | None
    backend_endpoint: str | None
    oauth_client_id: str | None
    oauth_client_secret: str | None
    oauth_oidc_scope: str | None
    oauth_endpoint_authorization: str | None
    oauth_endpoint_token: str | None
    oauth_endpoint_userinfo: str | None
    oauth_endpoint_logout: str | None
    oauth_login_redirect_uri: str | None
    frontend_redirect: str | None


def load_settings_from_env() -> BffSettings:
    """Build :class:`BffSettings` from process environment variables.

    :returns: Environment-derived application settings.
    :rtype: BffSettings
    """
    return BffSettings(
        flask_secret_key=os.getenv("FLASK_SECRET_KEY"),
        session_cookie_name=os.getenv("SESSION_COOKIE_NAME"),
        session_cookie_path=os.getenv("SESSION_COOKIE_PATH", "/"),
        session_cookie_httponly=_env_bool("SESSION_COOKIE_HTTPONLY", True),
        session_cookie_secure=_env_bool("SESSION_COOKIE_SECURE", True),
        session_cookie_samesite=os.getenv("SESSION_COOKIE_SAMESITE", "Strict"),
        cors_allowed_origin=os.getenv("CORS_ALLOWED_ORIGIN"),
        backend_endpoint=os.getenv("BACKEND_ENDPOINT"),
        oauth_client_id=os.getenv("OAUTH_CLIENT_ID"),
        oauth_client_secret=os.getenv("OAUTH_CLIENT_SECRET"),
        oauth_oidc_scope=os.getenv("OAUTH_OIDC_SCOPE"),
        oauth_endpoint_authorization=os.getenv("OAUTH_ENDPOINT_AUTHORIZATION"),
        oauth_endpoint_token=os.getenv("OAUTH_ENDPOINT_TOKEN"),
        oauth_endpoint_userinfo=os.getenv("OAUTH_ENDPOINT_USERINFO"),
        oauth_endpoint_logout=os.getenv("OAUTH_ENDPOINT_LOGOUT"),
        oauth_login_redirect_uri=os.getenv("OAUTH_LOGIN_REDIRECT_URI"),
        frontend_redirect=os.getenv("FRONTEND_REDIRECT"),
    )
