"""Authentication-related service helpers shared by route handlers."""

from __future__ import annotations

import requests
from flask import current_app, session

from bff_app.settings import BffSettings


def get_settings() -> BffSettings:
    """Return resolved application settings from Flask extensions.

    :returns: Current app settings object.
    :rtype: BffSettings
    """
    return current_app.extensions["bff_settings"]


def refresh_access_token() -> bool:
    """Refresh the access token using the current session refresh token.

    The function updates ``session["token"]`` with the token payload returned
    by the OAuth token endpoint.

    :returns:
        ``True`` when the token refresh succeeds, otherwise ``False``.
    :rtype: bool
    """
    settings = get_settings()

    refresh_token = session.get("token", {}).get("refresh_token")
    if not refresh_token:
        print("REFRESH TOKEN IS MISSING")
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
        )
    except requests.exceptions.RequestException as exc:
        print(f"REFRESH TOKEN REQUEST FAILED: {exc}")
        return False

    if response.status_code != 200:
        print(f"REFRESH TOKEN REQUEST REJECTED: {response.status_code}")
        return False

    session["token"] = response.json()
    return True
