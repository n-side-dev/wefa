from types import SimpleNamespace
from unittest.mock import MagicMock

from bff_app.routes import auth as auth_routes
from bff_app.services import auth as auth_service


def test_session_true_when_userinfo_ok(client, monkeypatch):
    # If userinfo returns 200, the session is considered valid.
    mock_get = MagicMock(return_value=SimpleNamespace(status_code=200))
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "access-token"}

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": True}


def test_session_refreshes_and_recovers(client, monkeypatch):
    mock_get = MagicMock(side_effect=[
        SimpleNamespace(status_code=401),
        SimpleNamespace(status_code=200),
    ])
    mock_post = MagicMock(return_value=SimpleNamespace(
        status_code=200,
        json=lambda: {
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
        },
    ))
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)
    monkeypatch.setattr(auth_service.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["token"] = {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
        }

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": True}


def test_session_false_clears_cookie_on_failure(client, monkeypatch):
    # Non-200 from userinfo causes the session to be cleared.
    mock_get = MagicMock(return_value=SimpleNamespace(status_code=401))
    mock_post = MagicMock(return_value=SimpleNamespace(status_code=400))
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)
    monkeypatch.setattr(auth_service.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["token"] = {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
        }

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": False}

    with client.session_transaction() as sess:
        assert "token" not in sess
