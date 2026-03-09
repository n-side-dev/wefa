"""Backend proxy endpoint routes."""

from __future__ import annotations

import requests
from flask import Response, current_app, request
from flask_smorest import Blueprint

from bff_app.services.auth import (
    clear_session_token,
    get_session_token,
    get_settings,
    has_session_token_cookie,
    refresh_access_token,
    store_session_token,
)
from bff_app.services.token_cookies import TokenCookieTooLargeError

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
        - Injects bearer access token from encrypted auth cookies when available.
        - Retries once after token refresh when upstream returns
          ``401`` with ``invalid_token``.
        - Drops hop-by-hop and duplicate CORS headers from upstream response.
    """
    current_app.logger.debug("Handling /proxy/api/request/%s", rest_of_url)
    settings = get_settings()

    headers = _build_upstream_headers()
    payload = request.get_data()

    has_token_cookie = has_session_token_cookie()
    should_clear_token_cookies = False
    refreshed_token: dict[str, object] | None = None

    session_token = get_session_token()
    if session_token and "access_token" in session_token:
        headers["Authorization"] = f"Bearer {session_token['access_token']}"
    else:
        if has_token_cookie:
            should_clear_token_cookies = True
        current_app.logger.warning(
            "Access token missing in auth cookies for proxied request: %s",
            rest_of_url,
        )

    target_url = f"{settings.backend_endpoint.rstrip('/')}/{rest_of_url.lstrip('/')}"

    def forward_request():
        return requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            params=request.args,
            data=payload,
            timeout=(
                settings.backend_connect_timeout_seconds,
                settings.backend_read_timeout_seconds,
            ),
            allow_redirects=False,
        )

    try:
        response = forward_request()
    except requests.exceptions.RequestException as exc:
        current_app.logger.warning("REST proxy error for %s: %s", rest_of_url, exc)
        failed_response = Response("Upstream connection error", status=502)
        if should_clear_token_cookies:
            clear_session_token(failed_response)
        return failed_response

    www_authenticate = response.headers.get("www-authenticate", "")
    if response.status_code == 401 and "invalid_token" in www_authenticate:
        refreshed_token = refresh_access_token()
        if refreshed_token and "access_token" in refreshed_token:
            headers["Authorization"] = f"Bearer {refreshed_token['access_token']}"
            try:
                response = forward_request()
            except requests.exceptions.RequestException as exc:
                current_app.logger.warning(
                    "REST proxy error after token refresh for %s: %s",
                    rest_of_url,
                    exc,
                )
                failed_response = Response("Upstream connection error", status=502)
                clear_session_token(failed_response)
                return failed_response
        else:
            should_clear_token_cookies = has_token_cookie

    excluded_headers = [
        "transfer-encoding",
        "access-control-allow-origin",
    ]
    filtered_headers = [
        (k, v)
        for k, v in response.headers.items()
        if k.lower() not in excluded_headers
    ]

    proxied_response = Response(response.content, response.status_code, filtered_headers)

    if refreshed_token:
        try:
            store_session_token(proxied_response, refreshed_token)
        except TokenCookieTooLargeError as exc:
            current_app.logger.warning(
                "Refreshed token cookie %s exceeds browser size budget (%s bytes)",
                exc.cookie_name,
                exc.cookie_size_bytes,
            )
            unauthorized_response = Response("Unauthorized", status=401)
            clear_session_token(unauthorized_response)
            return unauthorized_response

    if should_clear_token_cookies:
        clear_session_token(proxied_response)

    return proxied_response
