"""Application configuration objects and environment loading helpers."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Mapping


class SettingsValidationError(ValueError):
    """Raised when required BFF environment configuration is missing."""


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
    flask_secret_key: str
    session_cookie_name: str
    session_cookie_path: str
    session_cookie_httponly: bool
    session_cookie_secure: bool
    session_cookie_samesite: str
    cors_allowed_origin: str
    backend_endpoint: str
    oauth_client_id: str
    oauth_client_secret: str
    oauth_oidc_scope: str
    oauth_endpoint_authorization: str
    oauth_endpoint_token: str
    oauth_endpoint_userinfo: str
    oauth_endpoint_logout: str
    oauth_login_redirect_uri: str
    frontend_redirect: str


REQUIRED_ENV_VARS: tuple[str, ...] = (
    "FLASK_SECRET_KEY",
    "SESSION_COOKIE_NAME",
    "SESSION_COOKIE_PATH",
    "SESSION_COOKIE_HTTPONLY",
    "SESSION_COOKIE_SECURE",
    "SESSION_COOKIE_SAMESITE",
    "CORS_ALLOWED_ORIGIN",
    "BACKEND_ENDPOINT",
    "OAUTH_CLIENT_ID",
    "OAUTH_CLIENT_SECRET",
    "OAUTH_OIDC_SCOPE",
    "OAUTH_ENDPOINT_AUTHORIZATION",
    "OAUTH_ENDPOINT_TOKEN",
    "OAUTH_ENDPOINT_USERINFO",
    "OAUTH_ENDPOINT_LOGOUT",
    "OAUTH_LOGIN_REDIRECT_URI",
    "FRONTEND_REDIRECT",
)


def validate_required_env(raw_env: Mapping[str, str | None]) -> None:
    """Validate that all required env vars exist and are non-empty.

    :param raw_env:
        Environment values keyed by variable name.
    :raises SettingsValidationError:
        If one or more required variables are missing/blank.
    """
    missing = sorted(
        name
        for name in REQUIRED_ENV_VARS
        if raw_env.get(name) is None or not str(raw_env.get(name)).strip()
    )
    if missing:
        missing_csv = ", ".join(missing)
        raise SettingsValidationError(
            "Missing required BFF environment variables: "
            f"{missing_csv}. Configure them before starting the service."
        )


def load_settings_from_env() -> BffSettings:
    """Build :class:`BffSettings` from process environment variables.

    :returns: Environment-derived application settings.
    :rtype: BffSettings
    """
    raw_env = {name: os.getenv(name) for name in REQUIRED_ENV_VARS}
    validate_required_env(raw_env)

    return BffSettings(
        flask_secret_key=raw_env["FLASK_SECRET_KEY"],
        session_cookie_name=raw_env["SESSION_COOKIE_NAME"],
        session_cookie_path=os.getenv("SESSION_COOKIE_PATH", "/"),
        session_cookie_httponly=_env_bool("SESSION_COOKIE_HTTPONLY", True),
        session_cookie_secure=_env_bool("SESSION_COOKIE_SECURE", True),
        session_cookie_samesite=os.getenv("SESSION_COOKIE_SAMESITE", "Strict"),
        cors_allowed_origin=raw_env["CORS_ALLOWED_ORIGIN"],
        backend_endpoint=raw_env["BACKEND_ENDPOINT"],
        oauth_client_id=raw_env["OAUTH_CLIENT_ID"],
        oauth_client_secret=raw_env["OAUTH_CLIENT_SECRET"],
        oauth_oidc_scope=raw_env["OAUTH_OIDC_SCOPE"],
        oauth_endpoint_authorization=raw_env["OAUTH_ENDPOINT_AUTHORIZATION"],
        oauth_endpoint_token=raw_env["OAUTH_ENDPOINT_TOKEN"],
        oauth_endpoint_userinfo=raw_env["OAUTH_ENDPOINT_USERINFO"],
        oauth_endpoint_logout=raw_env["OAUTH_ENDPOINT_LOGOUT"],
        oauth_login_redirect_uri=raw_env["OAUTH_LOGIN_REDIRECT_URI"],
        frontend_redirect=raw_env["FRONTEND_REDIRECT"],
    )
