from unittest.mock import MagicMock

from bff_app.routes import auth as auth_routes


def _fake_oauth_session(state="state-123", token=None):
    """
    Build a fake OAuth2 session with deterministic responses.
    """
    token = token or {"access_token": "access-token", "id_token": "id-token"}
    fake = MagicMock()
    fake.create_authorization_url.return_value = ("http://auth.test/login", state)
    fake.fetch_token.return_value = token
    return fake


def test_login_callback_exchanges_code_and_redirects(client, monkeypatch):
    # Mock the token exchange so we don't call the real auth server.
    fake_oauth = _fake_oauth_session(token={"access_token": "tok", "id_token": "id"})
    monkeypatch.setattr(auth_routes, "OAuth2Session", lambda *args, **kwargs: fake_oauth)

    # Pre-populate session with state and PKCE verifier to match the callback request.
    with client.session_transaction() as sess:
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test"

    # Token should be saved to the session after the code exchange.
    with client.session_transaction() as sess:
        assert sess["token"]["access_token"] == "tok"
        assert "state" not in sess
        assert "cv" not in sess


def test_login_callback_state_mismatch_redirects(client):
    # State mismatch short-circuits without token exchange.
    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "old"}
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=wrong&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test"
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_missing_state_redirects_and_clears_session(client):
    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "old"}
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test"
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_missing_code_redirects_and_clears_session(client):
    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "old"}
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test"
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_login_callback_token_exchange_error_redirects_without_500(client, monkeypatch):
    fake_oauth = _fake_oauth_session()
    fake_oauth.fetch_token.side_effect = RuntimeError("boom")
    monkeypatch.setattr(auth_routes, "OAuth2Session", lambda *args, **kwargs: fake_oauth)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "old"}
        sess["state"] = "state-123"
        sess["cv"] = "cv-hex"

    res = client.get("/proxy/api/auth/callback?state=state-123&code=abc")

    assert res.status_code == 302
    assert res.headers["Location"] == "http://frontend.test"
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0
