from types import SimpleNamespace
from unittest.mock import MagicMock

from bff_app.routes import auth as auth_routes
from bff_app.services import auth as auth_service


def test_session_true_when_userinfo_ok(
    client,
    monkeypatch,
    set_auth_cookies,
    build_token_payload,
):
    # If userinfo returns 200, the session is considered valid.
    mock_get = MagicMock(return_value=SimpleNamespace(status_code=200))
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)

    set_auth_cookies(client, build_token_payload())

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": True}


def test_session_refreshes_and_recovers(
    client,
    monkeypatch,
    set_auth_cookies,
    build_token_payload,
):
    mock_get = MagicMock(side_effect=[
        SimpleNamespace(status_code=401),
        SimpleNamespace(status_code=200),
        SimpleNamespace(status_code=200, json=lambda: {"sub": "user-1"}),
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

    set_auth_cookies(client, build_token_payload())

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": True}
    assert mock_post.call_args.kwargs["timeout"] == (3.0, 30.0)
    res2 = client.get("/proxy/api/auth/userinfo")
    assert res2.status_code == 200
    auth_header = mock_get.call_args_list[-1].kwargs["headers"]["Authorization"]
    assert auth_header == "Bearer new-access-token"


def test_session_false_clears_cookie_on_failure(
    client,
    monkeypatch,
    set_auth_cookies,
    build_token_payload,
):
    # Non-200 from userinfo causes the session to be cleared.
    mock_get = MagicMock(return_value=SimpleNamespace(status_code=401))
    mock_post = MagicMock(return_value=SimpleNamespace(status_code=400))
    monkeypatch.setattr(auth_routes.requests, "get", mock_get)
    monkeypatch.setattr(auth_service.requests, "post", mock_post)

    set_auth_cookies(client, build_token_payload())

    res = client.get("/proxy/api/auth/session")

    assert res.status_code == 200
    assert res.get_json() == {"session": False}
    assert mock_post.call_args.kwargs["timeout"] == (3.0, 30.0)

    set_cookie_headers = res.headers.getlist("Set-Cookie")
    assert any(header.startswith("test-session_at=;") for header in set_cookie_headers)
    assert any(header.startswith("test-session_rt=;") for header in set_cookie_headers)
    assert any(header.startswith("test-session_it=;") for header in set_cookie_headers)
    assert any(header.startswith("test-session_meta=;") for header in set_cookie_headers)
