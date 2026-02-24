from types import SimpleNamespace
from unittest.mock import MagicMock


def test_session_true_when_userinfo_ok(client, bff_module, monkeypatch):
    # If userinfo returns 200, the session is considered valid.
    mock_get = MagicMock(return_value=SimpleNamespace(status_code=200))
    monkeypatch.setattr(bff_module.requests, "get", mock_get)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "access-token"}

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": True}


def test_session_refreshes_and_recovers(client, bff_module, monkeypatch):
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
    monkeypatch.setattr(bff_module.requests, "get", mock_get)
    monkeypatch.setattr(bff_module.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["token"] = {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
        }

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": True}


def test_session_false_clears_cookie_on_failure(client, bff_module, monkeypatch):
    # Non-200 from userinfo causes the session to be cleared.
    mock_get = MagicMock(return_value=SimpleNamespace(status_code=401))
    mock_post = MagicMock(return_value=SimpleNamespace(status_code=400))
    monkeypatch.setattr(bff_module.requests, "get", mock_get)
    monkeypatch.setattr(bff_module.requests, "post", mock_post)

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
