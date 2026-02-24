from types import SimpleNamespace
from unittest.mock import MagicMock


def test_logout_revokes_tokens_and_clears_session(client, bff_module, monkeypatch):
    # Mock the auth server logout call.
    mock_post = MagicMock(return_value=SimpleNamespace(status_code=200))
    monkeypatch.setattr(bff_module.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["token"] = {"id_token": "id-token"}

    res = client.get("/proxy/api/auth/logout")

    assert res.status_code == 200
    assert res.get_json() == {"message": "logout successful"}
    mock_post.assert_called_once()

    # Session should be empty after logout.
    with client.session_transaction() as sess:
        assert "token" not in sess
