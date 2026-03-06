from types import SimpleNamespace
from unittest.mock import MagicMock

import requests

from bff_app.routes import auth as auth_routes


def test_logout_revokes_tokens_and_clears_session(client, monkeypatch):
    # Mock the auth server logout call.
    mock_post = MagicMock(return_value=SimpleNamespace(status_code=200))
    monkeypatch.setattr(auth_routes.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["token"] = {"id_token": "id-token"}

    res = client.get("/proxy/api/auth/logout")

    assert res.status_code == 200
    assert res.get_json() == {"message": "logout successful"}
    mock_post.assert_called_once()
    assert mock_post.call_args.args[0] == "http://auth.test/logout"
    assert mock_post.call_args.args[1] == {"id_token_hint": "id-token"}
    assert mock_post.call_args.kwargs["timeout"] == (3.0, 30.0)

    # Session should be empty after logout.
    with client.session_transaction() as sess:
        assert "token" not in sess


def test_logout_without_token_still_clears_session(client, monkeypatch):
    mock_post = MagicMock()
    monkeypatch.setattr(auth_routes.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["state"] = "stale-state"

    res = client.get("/proxy/api/auth/logout")

    assert res.status_code == 200
    assert res.get_json() == {"message": "logout successful"}
    mock_post.assert_not_called()
    with client.session_transaction() as sess:
        assert len(sess.keys()) == 0


def test_logout_handles_upstream_timeout_and_still_clears_session(client, monkeypatch):
    mock_post = MagicMock(side_effect=requests.exceptions.Timeout("timeout"))
    monkeypatch.setattr(auth_routes.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["token"] = {"id_token": "id-token"}

    res = client.get("/proxy/api/auth/logout")

    assert res.status_code == 200
    assert res.get_json() == {"message": "logout successful"}
    mock_post.assert_called_once()
    assert mock_post.call_args.kwargs["timeout"] == (3.0, 30.0)
    with client.session_transaction() as sess:
        assert "token" not in sess
