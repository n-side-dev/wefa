from types import SimpleNamespace
from unittest.mock import MagicMock


def test_proxy_request_forwards_to_backend(client, bff_module, monkeypatch):
    # Mock backend response so we avoid a real HTTP call.
    backend_response = SimpleNamespace(
        content=b'{"ok":true}',
        status_code=200,
        headers={
            "content-type": "application/json",
            "transfer-encoding": "chunked",
            "access-control-allow-origin": "*",
        },
    )
    mock_request = MagicMock(return_value=backend_response)
    monkeypatch.setattr(bff_module.requests, "request", mock_request)

    with client.session_transaction() as sess:
        sess["token"] = {"access_token": "access-token"}

    res = client.post("/proxy/api/request/widgets?limit=5", data=b'{"x":1}')

    assert res.status_code == 200
    assert res.data == b'{"ok":true}'
    # Ensure the upstream call targeted the configured backend base URL.
    assert mock_request.call_args.kwargs["url"] == "http://backend.test/api/widgets"
    assert dict(mock_request.call_args.kwargs["params"]) == {"limit": "5"}
    # Flask should drop hop-by-hop headers from the upstream response.
    assert "transfer-encoding" not in res.headers
    # CORS header should be set by flask_cors, not forwarded from upstream.
    assert res.headers["Access-Control-Allow-Origin"] == "http://example.test"


def test_proxy_request_options_short_circuits(client):
    # Preflight request should return 204 without calling the backend.
    res = client.open("/proxy/api/request/widgets", method="OPTIONS")
    assert res.status_code == 204


def test_proxy_request_retries_on_invalid_token(client, bff_module, monkeypatch):
    backend_response = SimpleNamespace(
        content=b'{"ok":true}',
        status_code=200,
        headers={
            "content-type": "application/json",
        },
    )
    unauthorized_response = SimpleNamespace(
        content=b'{"error":"invalid_token"}',
        status_code=401,
        headers={"www-authenticate": 'Bearer error="invalid_token"'},
    )
    mock_request = MagicMock(side_effect=[unauthorized_response, backend_response])
    monkeypatch.setattr(bff_module.requests, "request", mock_request)

    mock_post = MagicMock(return_value=SimpleNamespace(
        status_code=200,
        json=lambda: {
            "access_token": "new-access-token",
            "refresh_token": "new-refresh-token",
        },
    ))
    monkeypatch.setattr(bff_module.requests, "post", mock_post)

    with client.session_transaction() as sess:
        sess["token"] = {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
        }

    res = client.get("/proxy/api/request/widgets")

    assert res.status_code == 200
    assert res.data == b'{"ok":true}'
    assert mock_request.call_count == 2
