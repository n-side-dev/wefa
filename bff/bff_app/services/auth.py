"""Authentication-related service helpers shared by route handlers."""

from __future__ import annotations

from typing import Any, Mapping

import requests
from flask import current_app, session

from bff_app.settings import BffSettings


def get_settings() -> BffSettings:
    """Return resolved application settings from Flask extensions.

    :returns: Current app settings object.
    :rtype: BffSettings
    """
    return current_app.extensions["bff_settings"]


def store_session_token(token: Mapping[str, Any]) -> None:
    """Store OAuth token payload in the signed Flask session cookie."""
    session["token"] = dict(token)


def get_session_token() -> dict[str, Any] | None:
    """Return OAuth token payload from the signed Flask session cookie."""
    raw_token = session.get("token")
    if isinstance(raw_token, Mapping):
        return dict(raw_token)

    if raw_token is not None:
        current_app.logger.warning(
            "Session token payload has unexpected type %s",
            type(raw_token).__name__,
        )
        session.pop("token", None)
    return None


def refresh_access_token() -> bool:
    """Refresh the access token using the current session refresh token.

    The function updates ``session["token"]`` with the token payload returned
    by the OAuth token endpoint.

    :returns:
        ``True`` when the token refresh succeeds, otherwise ``False``.
    :rtype: bool
    """
    settings = get_settings()

    session_token = get_session_token() or {}
    refresh_token = session_token.get("refresh_token")
    if not refresh_token:
        current_app.logger.warning("Refresh token is missing from session")
        return False

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
        return False

    if response.status_code != 200:
        current_app.logger.warning(
            "Refresh token request rejected with status %s",
            response.status_code,
        )
        return False

    store_session_token(response.json())
    return True
