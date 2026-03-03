from types import SimpleNamespace
from unittest.mock import MagicMock

from bff_app.routes import auth as auth_routes


def test_userinfo_proxies_to_auth_server(client, monkeypatch):
    # Mock userinfo response from auth server.
    mock_get = MagicMock(return_value=SimpleNamespace(json=lambda: {"sub": "user-1"}))
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "access-token"}

    res = client.get("/proxy/api/auth/userinfo")

    assert res.status_code == 200
    assert res.get_json() == {"sub": "user-1"}
    mock_get.assert_called_once()
