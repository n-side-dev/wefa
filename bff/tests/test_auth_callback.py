import logging
from unittest.mock import MagicMock

from bff_app.routes import auth as auth_routes


def _fake_oauth_session(state="state-123", token=None):
    """
    Build a fake OAuth2 session with deterministic responses.
    """
    token = token or {
        "access_token": "access-token",
        "refresh_token": "refresh-token",
        "id_token": "id-token",
    }
    fake = MagicMock()
    fake.create_authorization_url.return_value = ("http://auth.test/login", state)
    fake.fetch_token.return_value = token
    return fake


def test_login_callback_exchanges_code_and_redirects(client, monkeypatch, app, caplog):
    # Mock the token exchange so we don't call the real auth server.
    fake_oauth = _fake_oauth_session(
        token={
            "access_token": "tok",
            "refresh_token": "rtok",
            "id_token": "id",
            "expires_in": 300,
        }
    )
    monkeypatch.setattr(auth_routes, "OAuth2Session", lambda *args, **kwargs: fake_oauth)

    # Pre-populate session with state and PKCE verifier to match the callback request.
    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    with caplog.at_level(logging.INFO, logger=app.logger.name):
        res = client.get("/proxy/api/auth/callback?state=state-123&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test"
    assert (
        "OAuth callback succeeded; returning response with status=302 "
        "location=http://frontend.test"
    ) in caplog.text
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=") for header in set_cookie_headers)
    assert any(header.startswith("test-session_rt=") for header in set_cookie_headers)
    assert any(header.startswith("test-session_it=") for header in set_cookie_headers)
    assert any(header.startswith("test-session_meta=") for header in set_cookie_headers)

    with client.session_transaction() as sess:
        assert "token" not in sess
        assert "state" not in sess
        assert "cv" not in sess


def test_login_callback_state_mismatch_redirects(
    client,
    set_auth_cookies,
    build_token_payload,
):
    # State mismatch short-circuits without token exchange.
    set_auth_cookies(client, build_token_payload())
    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=wrong&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test?error=auth_state_mismatch"
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_missing_state_redirects_and_clears_session(
    client,
    set_auth_cookies,
    build_token_payload,
):
    set_auth_cookies(client, build_token_payload())
    with client.session_transaction() as sess:
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test?error=auth_state_missing"
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_missing_code_redirects_and_clears_session(
    client,
    set_auth_cookies,
    build_token_payload,
):
    set_auth_cookies(client, build_token_payload())
    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test?error=auth_callback_incomplete"
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_provider_error_redirects_with_error(
    client,
    set_auth_cookies,
    build_token_payload,
):
    set_auth_cookies(client, build_token_payload())
    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123&error=access_denied")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test?error=auth_provider_error"
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_token_exchange_error_redirects_without_500(
    client,
    monkeypatch,
    set_auth_cookies,
    build_token_payload,
):
    fake_oauth = _fake_oauth_session()
    fake_oauth.fetch_token.side_effect = RuntimeError("boom")
    monkeypatch.setattr(auth_routes, "OAuth2Session", lambda *args, **kwargs: fake_oauth)

    set_auth_cookies(client, build_token_payload())
    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test?error=auth_token_exchange_failed"
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_cookie_too_large_redirects_with_error(client, monkeypatch):
    large_access_token = "a" * 7000
    fake_oauth = _fake_oauth_session(
        token={
            "access_token": large_access_token,
            "refresh_token": "refresh-token",
            "id_token": "id-token",
        }
    )
    monkeypatch.setattr(auth_routes, "OAuth2Session", lambda *args, **kwargs: fake_oauth)

    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test?error=auth_cookie_too_large"
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)


def test_login_callback_invalid_token_payload_redirects_with_error(client, monkeypatch):
    fake_oauth = _fake_oauth_session(
        token={
            "access_token": "tok",
            "refresh_token": "rtok",
        }
    )
    monkeypatch.setattr(auth_routes, "OAuth2Session", lambda *args, **kwargs: fake_oauth)

    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test?error=auth_invalid_token"
    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0
