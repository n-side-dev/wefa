"""Authentication-related service helpers shared by route handlers."""

from __future__ import annotations

from typing import Any, Mapping

import requests
from flask import current_app, request

from bff_app.services.token_cookies import (
    clear_token_cookies,
    has_any_token_cookie,
    load_token_from_cookies,
    set_token_cookies,
)
from bff_app.settings import BffSettings


def get_settings() -> BffSettings:
    """Return resolved application settings from Flask extensions.

    :returns: Current app settings object.
    :rtype: BffSettings
    """
    return current_app.extensions["bff_settings"]


def store_session_token(response: Any, token: Mapping[str, Any]) -> None:
    """Store OAuth token payload in encrypted HttpOnly cookies."""
    settings = get_settings()
    set_token_cookies(response, token, settings)


def clear_session_token(response: Any) -> None:
    """Clear all encrypted token cookies from the browser."""
    settings = get_settings()
    clear_token_cookies(response, settings)


def has_session_token_cookie() -> bool:
    """Return whether at least one auth token cookie is present."""
    settings = get_settings()
    return has_any_token_cookie(request.cookies, settings)


def get_session_token() -> dict[str, Any] | None:
    """Return OAuth token payload from encrypted auth cookies."""
    settings = get_settings()
    return load_token_from_cookies(request.cookies, settings)


def refresh_access_token() -> dict[str, Any] | None:
    """Refresh the access token using the current refresh token.

    :returns:
        Merged token payload when refresh succeeds, otherwise ``None``.
    :rtype: dict[str, Any] | None
    """
    settings = get_settings()

    existing_token = get_session_token() or {}
    refresh_token = existing_token.get("refresh_token")
    if not isinstance(refresh_token, str) or not refresh_token:
        current_app.logger.warning("Refresh token is missing from token cookies")
        return None

    try:
        response = requests.post(
            settings.oauth_endpoint_token,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": settings.oauth_client_id,
                "client_secret": settings.oauth_client_secret,
            },
            timeout=(
                settings.backend_connect_timeout_seconds,
                settings.backend_read_timeout_seconds,
            ),
        )
    except requests.exceptions.RequestException as exc:
        current_app.logger.warning("Refresh token request failed: %s", exc)
        return None

    if response.status_code != 200:
        current_app.logger.warning(
            "Refresh token request rejected with status %s",
            response.status_code,
        )
        return None

    refreshed_payload = response.json()
    if not isinstance(refreshed_payload, Mapping):
        current_app.logger.warning(
            "Refresh token response has unexpected type %s",
            type(refreshed_payload).__name__,
        )
        return None

    merged_token = dict(existing_token)
    merged_token.update(dict(refreshed_payload))
    return merged_token
