"""Backend proxy endpoint routes."""

from __future__ import annotations

import requests
from flask import Response, request, session
from flask_smorest import Blueprint

from bff_app.services.auth import get_settings, refresh_access_token

proxy_bp = Blueprint(
    "proxy",
    __name__,
    description="Backend passthrough proxy endpoints.",
)

HOP_BY_HOP_REQUEST_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-connection",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
}
SENSITIVE_REQUEST_HEADERS = {
    "cookie",
}


def _build_upstream_headers() -> dict[str, str]:
    """Filter incoming request headers before forwarding upstream."""
    connection_header = request.headers.get("Connection", "")
    connection_scoped_headers = {
        header_name.strip().lower()
        for header_name in connection_header.split(",")
        if header_name.strip()
    }
    excluded_headers = (
        HOP_BY_HOP_REQUEST_HEADERS
        | SENSITIVE_REQUEST_HEADERS
        | {"host"}
        | connection_scoped_headers
    )
    return {
        key: value
        for key, value in request.headers
        if key.lower() not in excluded_headers
    }


@proxy_bp.route(
    "/proxy/api/request/<path:rest_of_url>",
    methods=["OPTIONS"],
)
@proxy_bp.doc(
    summary="REST preflight",
    responses={"204": {"description": "Preflight response."}},
)
def proxy_preflight(rest_of_url: str):
    """Handle CORS preflight for the proxy endpoint."""
    _ = rest_of_url
    return Response(status=204)


@proxy_bp.route(
    "/proxy/api/request/<path:rest_of_url>",
    methods=["DELETE", "GET", "HEAD", "PATCH", "POST", "PUT"],
)
@proxy_bp.doc(
    summary="Proxy REST request",
    description="Forward the incoming request to BACKEND_ENDPOINT with auth token passthrough.",
    security=[{"sessionCookie": []}],
    responses={
        "200": {
            "description": "Proxied response from REST backend.",
            "content": {
                "*/*": {"schema": {"type": "string", "format": "binary"}},
            },
        },
        "502": {"description": "Upstream connection error."},
    },
)
def proxy_request(rest_of_url: str):
    """Forward an incoming request to the configured backend API.

    :param rest_of_url:
        Path segment appended to ``BACKEND_ENDPOINT`` to build the target URL.
    :type rest_of_url: str
    :returns:
        Upstream response body/status/headers adapted for the frontend client.
    :rtype: flask.Response

    Behavior:
        - Handles CORS preflight by returning ``204`` on ``OPTIONS``.
        - Removes sensitive/hop-by-hop request headers before forwarding upstream.
        - Injects bearer access token from session when available.
        - Retries once after token refresh when upstream returns
          ``401`` with ``invalid_token``.
        - Drops hop-by-hop and duplicate CORS headers from upstream response.
    """
    print("-> /proxy/api/request/" + rest_of_url)
    settings = get_settings()

    headers = _build_upstream_headers()
    payload = request.get_data()

    if "token" in session and "access_token" in session["token"]:
        headers["Authorization"] = f"Bearer {session['token']['access_token']}"
    else:
        print("ACCESS TOKEN IS MISSING")

    target_url = f"{settings.backend_endpoint.rstrip('/')}/{rest_of_url.lstrip('/')}"

    def forward_request():
        return requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.args,
            data=payload,
            allow_redirects=False,
        )

    try:
        response = forward_request()
    except requests.exceptions.RequestException as exc:
        print(f"REST proxy error: {exc}")
        return Response("Upstream connection error", status=502)

    www_authenticate = response.headers.get("www-authenticate", "")
    if response.status_code == 401 and "invalid_token" in www_authenticate:
        if refresh_access_token():
            headers["Authorization"] = f"Bearer {session['token']['access_token']}"
            try:
                response = forward_request()
            except requests.exceptions.RequestException as exc:
                print(f"REST proxy error after refresh: {exc}")
                return Response("Upstream connection error", status=502)

    excluded_headers = [
        "transfer-encoding",
        "access-control-allow-origin",
    ]
    filtered_headers = [
        (k, v)
        for k, v in response.headers.items()
        if k.lower() not in excluded_headers
    ]

    return Response(response.content, response.status_code, filtered_headers)
