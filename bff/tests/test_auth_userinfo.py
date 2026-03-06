from types import SimpleNamespace
from unittest.mock import MagicMock

import requests

from bff_app.routes import auth as auth_routes


def test_userinfo_proxies_to_auth_server(client, monkeypatch):
    # Mock userinfo response from auth server.
    mock_get = MagicMock(
        return_value=SimpleNamespace(
            status_code=200,
            json=lambda: {"sub": "user-1"},
        )
    )
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "access-token"}

    res = client.get("/proxy/api/auth/userinfo")

    assert res.status_code == 200
    assert res.get_json() == {"sub": "user-1"}
    mock_get.assert_called_once()
    assert mock_get.call_args.kwargs["timeout"] == (3.0, 30.0)


def test_userinfo_missing_session_token_returns_401(client, monkeypatch):
    mock_get = MagicMock()
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)

    res = client.get("/proxy/api/auth/userinfo")

    assert res.status_code == 401
    assert res.get_json() == {"message": "Unauthorized"}
    mock_get.assert_not_called()


def test_userinfo_handles_upstream_request_errors(client, monkeypatch):
    mock_get = MagicMock(side_effect=requests.exceptions.Timeout("timeout"))
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "access-token"}

    res = client.get("/proxy/api/auth/userinfo")

    assert res.status_code == 502
    assert res.get_json() == {"message": "Upstream connection error"}


def test_userinfo_clears_session_on_upstream_401(client, monkeypatch):
    mock_get = MagicMock(
        return_value=SimpleNamespace(
            status_code=401,
            json=lambda: {"error": "invalid_token"},
        )
    )
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "access-token"}

    res = client.get("/proxy/api/auth/userinfo")

    assert res.status_code == 401
    assert res.get_json() == {"message": "Unauthorized"}
    with client.session_transaction() as sess:
        assert "token" not in sess
