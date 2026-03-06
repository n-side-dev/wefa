"""Authentication endpoint routes for login, callback, logout and session checks."""

from __future__ import annotations

import requests
import secrets
from authlib.integrations.requests_client import OAuth2Session
from flask import current_app, jsonify, redirect, request, session
from flask_smorest import Blueprint

from bff_app.services.auth import (
    get_session_token,
    get_settings,
    refresh_access_token,
    store_session_token,
)

auth_bp = Blueprint(
    "auth",
    __name__,
    description="Authentication endpoints for login, callback, logout and session checks.",
    url_prefix="/proxy/api/auth",
)


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
    description="Exchanges the authorization code for tokens and stores them in the session.",
    responses={
        "302": {
            "description": "Redirects to frontend after successful or failed state check."
        }
    },
)
def login_cb():
    """Handle OAuth callback and exchange authorization code for tokens.

    Request query parameters:
        ``state`` and ``code`` as returned by the OAuth provider.

    Side effects:
        Validates CSRF ``state`` and writes token payload to
        ``session["token"]`` on success.

    :returns:
        Redirect response to the configured frontend URL.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /proxy/api/auth/callback")
    settings = get_settings()

    request_state = request.args.get("state")
    session_state = session.get("state")
    authorization_code = request.args.get("code")
    code_verifier = session.get("cv")

    if not session_state or not request_state:
        current_app.logger.warning("Missing OAuth state during callback")
        session.clear()
        return redirect(settings.frontend_redirect, code=302)
    if request_state != session_state:
        current_app.logger.warning("OAuth callback state mismatch")
        session.clear()
        return redirect(settings.frontend_redirect, code=302)
    if not authorization_code or not code_verifier:
        current_app.logger.warning(
            "Missing authorization code or PKCE verifier during callback"
        )
        session.clear()
        return redirect(settings.frontend_redirect, code=302)

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
        session.clear()
        return redirect(settings.frontend_redirect, code=302)

    store_session_token(token)
    session.pop("cv", None)
    session.pop("state", None)
    return redirect(settings.frontend_redirect, code=302)


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
        current_app.logger.debug("No id_token in session; skipping upstream logout call")

    session.clear()
    return jsonify({"message": "logout successful"})


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
        ``session["token"]["access_token"]`` to be present.

    :returns:
        JSON object returned by the upstream userinfo endpoint.
    :rtype: dict
    """
    current_app.logger.debug("Handling /proxy/api/auth/userinfo")
    settings = get_settings()

    token = get_session_token()
    access_token = token.get("access_token") if isinstance(token, dict) else None
    if not access_token:
        session.clear()
        return jsonify({"message": "Unauthorized"}), 401

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
        session.clear()
        return jsonify({"message": "Unauthorized"}), userinfo.status_code

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
        4. Clear session when no valid auth state remains.

    :returns:
        JSON object containing ``{"session": <bool>}``.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /proxy/api/auth/session")
    settings = get_settings()

    is_valid_session = False

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
        if not is_valid_session and refresh_access_token():
            refreshed_token = get_session_token()
            if not refreshed_token or "access_token" not in refreshed_token:
                session.clear()
                return jsonify({"session": False})
            userinfo = requests.get(
                settings.oauth_endpoint_userinfo,
                headers={"Authorization": f"Bearer {refreshed_token['access_token']}"},
                timeout=(
                    settings.backend_connect_timeout_seconds,
                    settings.backend_read_timeout_seconds,
                ),
            )
            is_valid_session = userinfo.status_code == 200

    if not is_valid_session:
        session.clear()

    return jsonify({"session": is_valid_session})
