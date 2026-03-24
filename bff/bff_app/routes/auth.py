"""Authentication endpoint routes for login, callback, logout and session checks."""

from __future__ import annotations

import secrets
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests
from authlib.integrations.requests_client import OAuth2Session
from flask import current_app, jsonify, redirect, request, session
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

auth_bp = Blueprint(
    "auth",
    __name__,
    description="Authentication endpoints for login, callback, logout and session checks.",
    url_prefix="/proxy/api/auth",
)


def _build_redirect_with_error(frontend_redirect: str, error_code: str) -> str:
    """Append deterministic error query parameter to the frontend redirect URL."""
    parsed = urlsplit(frontend_redirect)
    query_items = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key != "error"
    ]
    query_items.append(("error", error_code))

    return urlunsplit(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            urlencode(query_items),
            parsed.fragment,
        )
    )


def _redirect_to_frontend(frontend_redirect: str, error_code: str | None = None) -> object:
    """Build a frontend redirect response with an optional error code."""
    redirect_target = frontend_redirect
    if error_code is not None:
        redirect_target = _build_redirect_with_error(frontend_redirect, error_code)
    return redirect(redirect_target, code=302)


def _clear_auth_state(response: object) -> None:
    """Clear both Flask session state and encrypted auth token cookies."""
    session.clear()
    clear_session_token(response)


@auth_bp.route("/login", methods=["GET"])
@auth_bp.doc(
    summary="Start login flow",
    description=(
        "Creates a PKCE authorization URL and stores verifier/state in the session cookie."
    ),
    responses={
        "200": {
            "description": "Auth server redirect URL.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {"redirect": {"type": "string"}},
                        "required": ["redirect"],
                    }
                }
            },
        }
    },
)
def login():
    """Start OAuth login by generating authorization URL and PKCE values.

    Side effects:
        Stores the generated PKCE code verifier and OAuth state in the signed
        Flask session cookie.

    :returns:
        JSON payload containing the authorization redirect URL under
        ``redirect`` key.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /proxy/api/auth/login")
    settings = get_settings()

    client = OAuth2Session(
        settings.oauth_client_id,
        settings.oauth_client_secret,
        scope=settings.oauth_oidc_scope,
        code_challenge_method="S256",
        redirect_uri=settings.oauth_login_redirect_uri,
    )

    code_verifier = secrets.token_hex(64)
    uri, state = client.create_authorization_url(
        settings.oauth_endpoint_authorization,
        code_verifier=code_verifier,
    )

    session["cv"] = code_verifier
    session["state"] = state

    return jsonify({"redirect": uri})


@auth_bp.route("/callback", methods=["GET"])
@auth_bp.doc(
    summary="OAuth callback",
    description="Exchanges the authorization code for tokens and stores encrypted token cookies.",
    responses={
        "302": {
            "description": (
                "Redirects to the frontend. Failed callbacks append an error query "
                "parameter."
            )
        }
    },
)
def login_cb():
    """Handle OAuth callback and exchange authorization code for tokens.

    Request query parameters:
        ``state``, ``code`` and optional ``error`` as returned by the OAuth provider.

    Side effects:
        Validates CSRF ``state`` and writes token payload to encrypted
        HttpOnly cookies on success. Clears the Flask session and auth cookies on
        failure.

    :returns:
        Redirect response to the configured frontend URL. Failed callbacks append a
        deterministic ``error`` query parameter.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /proxy/api/auth/callback")
    settings = get_settings()

    request_state = request.args.get("state")
    session_state = session.get("state")
    authorization_error = request.args.get("error")
    authorization_code = request.args.get("code")
    code_verifier = session.get("cv")

    if not session_state or not request_state:
        current_app.logger.warning("Missing OAuth state during callback")
        response = _redirect_to_frontend(
            settings.frontend_redirect,
            error_code="auth_state_missing",
        )
        _clear_auth_state(response)
        return response
    if request_state != session_state:
        current_app.logger.warning("OAuth callback state mismatch")
        response = _redirect_to_frontend(
            settings.frontend_redirect,
            error_code="auth_state_mismatch",
        )
        _clear_auth_state(response)
        return response
    if authorization_error:
        current_app.logger.warning(
            "OAuth provider returned callback error: %s",
            authorization_error,
        )
        response = _redirect_to_frontend(
            settings.frontend_redirect,
            error_code="auth_provider_error",
        )
        _clear_auth_state(response)
        return response
    if not authorization_code or not code_verifier:
        current_app.logger.warning(
            "Missing authorization code or PKCE verifier during callback"
        )
        response = _redirect_to_frontend(
            settings.frontend_redirect,
            error_code="auth_callback_incomplete",
        )
        _clear_auth_state(response)
        return response

    current_app.logger.debug("OAuth callback state validated")
    current_app.logger.debug("Performing OAuth code exchange")

    client = OAuth2Session(
        settings.oauth_client_id,
        settings.oauth_client_secret,
        scope=settings.oauth_oidc_scope,
        code_challenge_method="S256",
        redirect_uri=settings.oauth_login_redirect_uri,
    )

    authorization_response = request.url
    current_app.logger.debug("OAuth authorization response received")

    try:
        token = client.fetch_token(
            settings.oauth_endpoint_token,
            authorization_response=authorization_response,
            code_verifier=code_verifier,
        )
    except Exception as exc:
        current_app.logger.warning("OAuth token exchange failed: %s", exc)
        response = _redirect_to_frontend(
            settings.frontend_redirect,
            error_code="auth_token_exchange_failed",
        )
        _clear_auth_state(response)
        return response

    response = _redirect_to_frontend(settings.frontend_redirect)
    try:
        store_session_token(response, token)
    except TokenCookieTooLargeError as exc:
        current_app.logger.warning(
            "OAuth callback token cookie %s exceeds browser size budget (%s bytes)",
            exc.cookie_name,
            exc.cookie_size_bytes,
        )
        response = _redirect_to_frontend(
            settings.frontend_redirect,
            error_code="auth_cookie_too_large",
        )
        _clear_auth_state(response)
        return response
    except ValueError as exc:
        current_app.logger.warning("OAuth token payload is invalid: %s", exc)
        response = _redirect_to_frontend(
            settings.frontend_redirect,
            error_code="auth_invalid_token",
        )
        _clear_auth_state(response)
        return response

    session.pop("cv", None)
    session.pop("state", None)
    return response


@auth_bp.route("/logout", methods=["GET"])
@auth_bp.doc(
    summary="Logout and revoke tokens",
    description="Log out from auth server and clear local session data.",
    security=[{"sessionCookie": []}],
    responses={
        "200": {
            "description": "Logout successful.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {"message": {"type": "string"}},
                        "required": ["message"],
                    }
                }
            },
        }
    },
)
def logout():
    """Log out from the auth server and clear local session data.

    :returns:
        JSON payload confirming logout success.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /proxy/api/auth/logout")
    settings = get_settings()

    token = get_session_token()
    id_token = token.get("id_token") if isinstance(token, dict) else None

    if id_token:
        try:
            response = requests.post(
                settings.oauth_endpoint_logout,
                {"id_token_hint": id_token},
                timeout=(
                    settings.backend_connect_timeout_seconds,
                    settings.backend_read_timeout_seconds,
                ),
            )
            if response.status_code >= 400:
                current_app.logger.warning(
                    "Logout endpoint returned status %s",
                    response.status_code,
                )
        except requests.exceptions.RequestException as exc:
            current_app.logger.warning("Logout request failed: %s", exc)
    else:
        current_app.logger.debug(
            "No id_token in token cookies; skipping upstream logout call"
        )

    response = jsonify({"message": "logout successful"})
    _clear_auth_state(response)
    return response


@auth_bp.route("/userinfo", methods=["GET"])
@auth_bp.doc(
    summary="Fetch user info",
    description="Proxy userinfo endpoint for the authenticated session.",
    security=[{"sessionCookie": []}],
    responses={
        "200": {
            "description": "User info from the auth server.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "email": {"type": "string"},
                            "email_verified": {"type": "boolean"},
                            "family_name": {"type": "string"},
                            "given_name": {"type": "string"},
                            "name": {"type": "string"},
                            "preferred_username": {"type": "string"},
                            "sub": {"type": "string"},
                        },
                        "required": [
                            "email",
                            "email_verified",
                            "family_name",
                            "given_name",
                            "name",
                            "preferred_username",
                            "sub",
                        ],
                    },
                    "examples": {
                        "default": {
                            "value": {
                                "email": "olivia.diaz@embergenpower.demo",
                                "email_verified": True,
                                "family_name": "Diaz",
                                "given_name": "Olivia",
                                "name": "Olivia Diaz",
                                "preferred_username": "olivia.diaz@embergenpower.demo",
                                "sub": "8b8135af-4555-455c-bf84-567f99ff9e96",
                            }
                        }
                    },
                }
            },
        }
    },
)
def auth_userinfo():
    """Proxy the OAuth userinfo endpoint for the authenticated session.

    Requires:
        ``access_token`` to be present in encrypted auth cookies.

    :returns:
        JSON object returned by the upstream userinfo endpoint.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /proxy/api/auth/userinfo")
    settings = get_settings()

    token = get_session_token()
    has_token_cookie = has_session_token_cookie()

    access_token = token.get("access_token") if isinstance(token, dict) else None
    if not access_token:
        response = jsonify({"message": "Unauthorized"})
        response.status_code = 401
        session.clear()
        if has_token_cookie:
            clear_session_token(response)
        return response

    try:
        userinfo = requests.get(
            settings.oauth_endpoint_userinfo,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=(
                settings.backend_connect_timeout_seconds,
                settings.backend_read_timeout_seconds,
            ),
        )
    except requests.exceptions.RequestException as exc:
        current_app.logger.warning("Userinfo request failed: %s", exc)
        return jsonify({"message": "Upstream connection error"}), 502

    if userinfo.status_code in {401, 403}:
        response = jsonify({"message": "Unauthorized"})
        response.status_code = userinfo.status_code
        _clear_auth_state(response)
        return response

    if userinfo.status_code != 200:
        current_app.logger.warning(
            "Userinfo request rejected with status %s",
            userinfo.status_code,
        )
        return jsonify({"message": "Failed to fetch user info"}), 502

    try:
        return jsonify(userinfo.json())
    except ValueError:
        current_app.logger.warning("Userinfo response was not valid JSON")
        return jsonify({"message": "Invalid upstream response"}), 502


@auth_bp.route("/session", methods=["GET"])
@auth_bp.doc(
    summary="Check session validity",
    description="Validate whether the current browser session is still authenticated.",
    security=[{"sessionCookie": []}],
    responses={
        "200": {
            "description": "Session state.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {"session": {"type": "boolean"}},
                        "required": ["session"],
                    }
                }
            },
        }
    },
)
def check_session():
    """Validate whether the current browser session is still authenticated.

    Flow:
        1. Call the userinfo endpoint with the stored access token.
        2. If token is invalid, attempt refresh via refresh token.
        3. Re-check userinfo after successful refresh.
        4. Clear auth state when no valid auth state remains.

    :returns:
        JSON object containing ``{"session": <bool>}``.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /proxy/api/auth/session")
    settings = get_settings()

    has_token_cookie = has_session_token_cookie()
    is_valid_session = False
    refreshed_token: dict[str, object] | None = None

    token = get_session_token()
    if token and "access_token" in token:
        userinfo = requests.get(
            settings.oauth_endpoint_userinfo,
            headers={"Authorization": f"Bearer {token['access_token']}"},
            timeout=(
                settings.backend_connect_timeout_seconds,
                settings.backend_read_timeout_seconds,
            ),
        )
        is_valid_session = userinfo.status_code == 200
        if not is_valid_session:
            refreshed_token = refresh_access_token()
            if refreshed_token and "access_token" in refreshed_token:
                userinfo = requests.get(
                    settings.oauth_endpoint_userinfo,
                    headers={
                        "Authorization": f"Bearer {refreshed_token['access_token']}"
                    },
                    timeout=(
                        settings.backend_connect_timeout_seconds,
                        settings.backend_read_timeout_seconds,
                    ),
                )
                is_valid_session = userinfo.status_code == 200

    response = jsonify({"session": is_valid_session})

    if is_valid_session and refreshed_token:
        try:
            store_session_token(response, refreshed_token)
        except TokenCookieTooLargeError as exc:
            current_app.logger.warning(
                "Refreshed token cookie %s exceeds browser size budget (%s bytes)",
                exc.cookie_name,
                exc.cookie_size_bytes,
            )
            response = jsonify({"session": False})
            _clear_auth_state(response)
            return response

    if not is_valid_session:
        session.clear()
        if has_token_cookie:
            clear_session_token(response)

    return response
