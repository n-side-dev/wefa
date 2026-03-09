"""Encrypted auth token cookie helpers."""

from __future__ import annotations

import base64
import binascii
import json
import os
import warnings
from typing import Any, Mapping

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from flask import current_app
from werkzeug.datastructures import MultiDict
from werkzeug.http import dump_cookie

from bff_app.settings import BffSettings

COOKIE_VERSION = 1
COOKIE_NONCE_BYTES = 12
MAX_SET_COOKIE_BYTES = 4096

TOKEN_COOKIE_SUFFIXES = {
    "access_token": "at",
    "refresh_token": "rt",
    "id_token": "it",
    "meta": "meta",
}

REQUIRED_TOKEN_FIELDS: tuple[str, ...] = (
    "access_token",
    "refresh_token",
    "id_token",
)


class TokenCookieTooLargeError(ValueError):
    """Raised when a token cookie exceeds the browser size budget."""

    def __init__(self, cookie_name: str, cookie_size_bytes: int) -> None:
        super().__init__(
            f"Cookie {cookie_name!r} is {cookie_size_bytes} bytes; max is "
            f"{MAX_SET_COOKIE_BYTES} bytes"
        )
        self.cookie_name = cookie_name
        self.cookie_size_bytes = cookie_size_bytes


def token_cookie_names(settings: BffSettings) -> dict[str, str]:
    """Return concrete token-cookie names derived from session cookie prefix."""
    prefix = settings.session_cookie_name
    return {
        field: f"{prefix}_{suffix}"
        for field, suffix in TOKEN_COOKIE_SUFFIXES.items()
    }


def has_any_token_cookie(
    cookies: Mapping[str, str] | MultiDict[str, str],
    settings: BffSettings,
) -> bool:
    """Return whether any encrypted token cookie is present in the request."""
    names = token_cookie_names(settings)
    return any(name in cookies for name in names.values())


def load_token_from_cookies(
    cookies: Mapping[str, str] | MultiDict[str, str],
    settings: BffSettings,
) -> dict[str, Any] | None:
    """Load and decrypt full OAuth token payload from request cookies."""
    names = token_cookie_names(settings)
    encrypted_parts = {
        field: cookies.get(name)
        for field, name in names.items()
    }

    present_parts = sum(value is not None for value in encrypted_parts.values())
    if present_parts == 0:
        return None

    if present_parts != len(encrypted_parts):
        _log_warning("Token cookie payload is incomplete; treating as invalid")
        return None

    key = settings.token_cookie_encryption_key
    decrypted_token_fields: dict[str, str] = {}
    try:
        for field in REQUIRED_TOKEN_FIELDS:
            cookie_name = names[field]
            encrypted_value = encrypted_parts[field]
            if not isinstance(encrypted_value, str):
                _log_warning("Token cookie %s has unexpected type", cookie_name)
                return None
            decrypted_token_fields[field] = _decrypt_component(
                encrypted_value,
                key,
                cookie_name,
            )

        meta_cookie_name = names["meta"]
        encrypted_meta = encrypted_parts["meta"]
        if not isinstance(encrypted_meta, str):
            _log_warning("Token cookie %s has unexpected type", meta_cookie_name)
            return None
        decrypted_meta = _decrypt_component(encrypted_meta, key, meta_cookie_name)
    except (InvalidTag, ValueError, binascii.Error, UnicodeDecodeError) as exc:
        _log_warning("Failed to decrypt token cookies: %s", exc)
        return None

    try:
        raw_meta = json.loads(decrypted_meta)
    except json.JSONDecodeError as exc:
        _log_warning("Failed to decode token cookie metadata JSON: %s", exc)
        return None

    if not isinstance(raw_meta, dict):
        _log_warning(
            "Token cookie metadata JSON must decode to object, got %s",
            type(raw_meta).__name__,
        )
        return None

    for required_field in REQUIRED_TOKEN_FIELDS:
        if required_field in raw_meta:
            _log_warning(
                "Token cookie metadata contains reserved field %s",
                required_field,
            )
            return None

    token: dict[str, Any] = dict(raw_meta)
    token.update(decrypted_token_fields)
    return token


def set_token_cookies(
    response: Any,
    token: Mapping[str, Any],
    settings: BffSettings,
) -> None:
    """Encrypt and write OAuth token payload to multiple HttpOnly cookies."""
    names = token_cookie_names(settings)
    token_payload = dict(token)

    missing_fields = [
        field
        for field in REQUIRED_TOKEN_FIELDS
        if field not in token_payload or not isinstance(token_payload[field], str)
    ]
    if missing_fields:
        missing_csv = ", ".join(missing_fields)
        raise ValueError(
            "Token payload must contain string values for required fields: "
            f"{missing_csv}"
        )

    key = settings.token_cookie_encryption_key
    encrypted_values = {
        "access_token": _encrypt_component(
            token_payload["access_token"],
            key,
            names["access_token"],
        ),
        "refresh_token": _encrypt_component(
            token_payload["refresh_token"],
            key,
            names["refresh_token"],
        ),
        "id_token": _encrypt_component(
            token_payload["id_token"],
            key,
            names["id_token"],
        ),
    }

    metadata_payload = {
        metadata_key: value
        for metadata_key, value in token_payload.items()
        if metadata_key not in REQUIRED_TOKEN_FIELDS
    }
    encrypted_values["meta"] = _encrypt_component(
        json.dumps(metadata_payload, separators=(",", ":"), sort_keys=True),
        key,
        names["meta"],
    )

    for field, encrypted_value in encrypted_values.items():
        _validate_set_cookie_size(
            cookie_name=names[field],
            cookie_value=encrypted_value,
            settings=settings,
        )

    for field, encrypted_value in encrypted_values.items():
        response.set_cookie(
            names[field],
            encrypted_value,
            path=settings.session_cookie_path,
            secure=settings.session_cookie_secure,
            httponly=settings.session_cookie_httponly,
            samesite=settings.session_cookie_samesite,
        )


def clear_token_cookies(response: Any, settings: BffSettings) -> None:
    """Clear all token cookies from the client."""
    for cookie_name in token_cookie_names(settings).values():
        response.delete_cookie(
            cookie_name,
            path=settings.session_cookie_path,
            secure=settings.session_cookie_secure,
            httponly=settings.session_cookie_httponly,
            samesite=settings.session_cookie_samesite,
        )


def _encrypt_component(plaintext: str, key: bytes, cookie_name: str) -> str:
    nonce = os.urandom(COOKIE_NONCE_BYTES)
    ciphertext = AESGCM(key).encrypt(
        nonce,
        plaintext.encode("utf-8"),
        cookie_name.encode("utf-8"),
    )
    payload = bytes([COOKIE_VERSION]) + nonce + ciphertext
    return _urlsafe_b64encode(payload)


def _decrypt_component(encoded_payload: str, key: bytes, cookie_name: str) -> str:
    raw_payload = _urlsafe_b64decode(encoded_payload)
    min_payload_size = 1 + COOKIE_NONCE_BYTES + 16
    if len(raw_payload) < min_payload_size:
        raise ValueError("Encrypted cookie payload is truncated")

    payload_version = raw_payload[0]
    if payload_version != COOKIE_VERSION:
        raise ValueError(f"Unsupported cookie payload version: {payload_version}")

    nonce = raw_payload[1 : 1 + COOKIE_NONCE_BYTES]
    ciphertext = raw_payload[1 + COOKIE_NONCE_BYTES :]
    plaintext = AESGCM(key).decrypt(
        nonce,
        ciphertext,
        cookie_name.encode("utf-8"),
    )
    return plaintext.decode("utf-8")


def _urlsafe_b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _validate_set_cookie_size(
    cookie_name: str,
    cookie_value: str,
    settings: BffSettings,
) -> None:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        cookie_header = dump_cookie(
            key=cookie_name,
            value=cookie_value,
            path=settings.session_cookie_path,
            secure=settings.session_cookie_secure,
            httponly=settings.session_cookie_httponly,
            samesite=settings.session_cookie_samesite,
        )
    cookie_size_bytes = len(cookie_header.encode("utf-8"))
    if cookie_size_bytes > MAX_SET_COOKIE_BYTES:
        raise TokenCookieTooLargeError(cookie_name, cookie_size_bytes)


def _log_warning(message: str, *args: Any) -> None:
    try:
        current_app.logger.warning(message, *args)
    except RuntimeError:
        return
