from unittest.mock import MagicMock


def _fake_oauth_session(expected_auth_url="http://auth.test/login", state="state-123"):
    """
    Build a fake OAuth2 session with deterministic responses.
    """
    fake = MagicMock()
    fake.create_authorization_url.return_value = (expected_auth_url, state)
    return fake


def test_login_sets_session_and_returns_redirect(client, bff_module, monkeypatch):
    # Mock OAuth flow so we don't hit a real auth server.
    fake_oauth = _fake_oauth_session()
    monkeypatch.setattr(bff_module, "OAuth2Session", lambda *args, **kwargs: fake_oauth)
    monkeypatch.setattr(bff_module.secrets, "token_hex", lambda n: "cv-hex")

    res = client.get("/proxy/api/auth/login")

    assert res.status_code == 200
    assert res.get_json() == {"redirect": "http://auth.test/login"}

    # Ensure the PKCE verifier and state are stored in the signed session cookie.
    with client.session_transaction() as sess:
        assert sess["cv"] == "cv-hex"
        assert sess["state"] == "state-123"
