from http.cookies import SimpleCookie

import pytest

from bff_app.services.token_cookies import (
    TokenCookieTooLargeError,
    has_any_token_cookie,
    load_token_from_cookies,
    set_token_cookies,
    token_cookie_names,
)


def _extract_cookie_map(response) -> dict[str, str]:
    parsed = SimpleCookie()
    for set_cookie_header in response.headers.getlist("Set-Cookie"):
        parsed.load(set_cookie_header)
    return {morsel.key: morsel.value for morsel in parsed.values()}


def test_token_cookie_roundtrip_preserves_payload(app, build_token_payload):
    settings = app.extensions["bff_settings"]
    response = app.response_class()
    token_payload = build_token_payload(
        scope="openid email profile",
        expires_at=1773046999,
        custom_field="custom-value",
    )

    set_token_cookies(response, token_payload, settings)
    cookie_map = _extract_cookie_map(response)

    assert has_any_token_cookie(cookie_map, settings) is True
    loaded_payload = load_token_from_cookies(cookie_map, settings)
    assert loaded_payload == token_payload


def test_token_cookie_tamper_returns_none(app, build_token_payload):
    settings = app.extensions["bff_settings"]
    response = app.response_class()
    token_payload = build_token_payload()

    set_token_cookies(response, token_payload, settings)
    cookie_map = _extract_cookie_map(response)

    names = token_cookie_names(settings)
    tampered = dict(cookie_map)
    original = tampered[names["access_token"]]
    tampered[names["access_token"]] = original[:-1] + (
        "A" if original[-1] != "A" else "B"
    )

    assert load_token_from_cookies(tampered, settings) is None


def test_token_cookie_missing_component_returns_none(app, build_token_payload):
    settings = app.extensions["bff_settings"]
    response = app.response_class()
    token_payload = build_token_payload()

    set_token_cookies(response, token_payload, settings)
    cookie_map = _extract_cookie_map(response)

    names = token_cookie_names(settings)
    missing_id = dict(cookie_map)
    missing_id.pop(names["id_token"])

    assert load_token_from_cookies(missing_id, settings) is None


def test_token_cookie_oversize_raises_error(app, build_token_payload):
    settings = app.extensions["bff_settings"]
    response = app.response_class()
    token_payload = build_token_payload(access_token="a" * 7000)

    with pytest.raises(TokenCookieTooLargeError):
        set_token_cookies(response, token_payload, settings)


def test_token_cookie_values_do_not_expose_plaintext(app, build_token_payload):
    settings = app.extensions["bff_settings"]
    response = app.response_class()
    token_payload = build_token_payload(
        access_token="access-token-plaintext",
        refresh_token="refresh-token-plaintext",
        id_token="id-token-plaintext",
    )

    set_token_cookies(response, token_payload, settings)
    cookie_map = _extract_cookie_map(response)

    assert all("access-token-plaintext" not in value for value in cookie_map.values())
    assert all("refresh-token-plaintext" not in value for value in cookie_map.values())
    assert all("id-token-plaintext" not in value for value in cookie_map.values())
