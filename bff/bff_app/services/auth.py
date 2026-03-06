"""Authentication-related service helpers shared by route handlers."""

from __future__ import annotations

from typing import Any, Mapping

import requests
from cryptography.fernet import Fernet, InvalidToken
from flask import current_app, session

from bff_app.settings import BffSettings

ENCRYPTED_TOKEN_PREFIX = "enc::"
SENSITIVE_TOKEN_FIELDS = frozenset({"access_token", "refresh_token"})


def get_settings() -> BffSettings:
    """Return resolved application settings from Flask extensions.

    :returns: Current app settings object.
    :rtype: BffSettings
    """
    return current_app.extensions["bff_settings"]


def _get_token_cipher() -> Fernet:
    """Build Fernet cipher from configured token encryption key."""
    settings = get_settings()
    return Fernet(settings.session_token_encryption_key.encode("utf-8"))


def store_session_token(token: Mapping[str, Any]) -> None:
    """Store OAuth token payload in session with encrypted sensitive fields."""
    cipher = _get_token_cipher()
    encrypted_token = dict(token)
    for field in SENSITIVE_TOKEN_FIELDS:
        value = encrypted_token.get(field)
        if isinstance(value, str):
            encrypted = cipher.encrypt(value.encode("utf-8")).decode("utf-8")
            encrypted_token[field] = f"{ENCRYPTED_TOKEN_PREFIX}{encrypted}"
    session["token"] = encrypted_token


def get_session_token() -> dict[str, Any] | None:
    """Return OAuth token payload from session with sensitive fields decrypted."""
    raw_token = session.get("token")
    if not isinstance(raw_token, Mapping):
        return None

    token = dict(raw_token)
    cipher = _get_token_cipher()
    for field in SENSITIVE_TOKEN_FIELDS:
        value = token.get(field)
        if value is None:
            continue
        if not isinstance(value, str):
            current_app.logger.warning(
                "Session token field %s has unexpected type %s",
                field,
                type(value).__name__,
            )
            session.clear()
            return None
        if not value.startswith(ENCRYPTED_TOKEN_PREFIX):
            # Backward compatibility for pre-encryption sessions.
            continue

        encrypted_value = value.removeprefix(ENCRYPTED_TOKEN_PREFIX)
        try:
            token[field] = cipher.decrypt(encrypted_value.encode("utf-8")).decode("utf-8")
        except InvalidToken:
            current_app.logger.warning("Failed to decrypt session token field %s", field)
            session.clear()
            return None

    return token


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
