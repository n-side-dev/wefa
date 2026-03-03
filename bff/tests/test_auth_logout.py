from types import SimpleNamespace
from unittest.mock import MagicMock

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

    # Session should be empty after logout.
    with client.session_transaction() as sess:
        assert "token" not in sess
