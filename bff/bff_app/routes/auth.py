"""Authentication endpoint routes for login, callback, logout and session checks."""

from __future__ import annotations

import requests
import secrets
from authlib.integrations.requests_client import OAuth2Session
from flask import jsonify, redirect, request, session
from flask_smorest import Blueprint

from bff_app.services.auth import get_settings, refresh_access_token

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
    print("-> /proxy/api/auth/login")
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
    :raises ValueError:
        If required callback state information is missing.
    """
    print("-> /proxy/api/auth/callback")
    settings = get_settings()

    try:
        if "state" not in session:
            raise ValueError("State not found in cookie, cookie might be missing")
        if "state" not in request.args:
            raise ValueError("State not found in request arguments, incorrect request")
        if request.args["state"] != session["state"]:
            print("State mismatch")
            return redirect(settings.frontend_redirect, code=302)

        print("State match !")
        print("Performing Code Exchange")

        client = OAuth2Session(
            settings.oauth_client_id,
            settings.oauth_client_secret,
            scope=settings.oauth_oidc_scope,
            code_challenge_method="S256",
            redirect_uri=settings.oauth_login_redirect_uri,
        )

        authorization_response = request.url
        print("Authorization Code : ", authorization_response)

        token = client.fetch_token(
            settings.oauth_endpoint_token,
            authorization_response=authorization_response,
            code_verifier=session["cv"],
        )
        session["token"] = token

        return redirect(settings.frontend_redirect, code=302)
    except Exception as exc:
        print(exc)
        raise exc


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
    print("-> /proxy/api/auth/logout")
    settings = get_settings()

    requests.post(
        settings.oauth_endpoint_logout,
        {"id_token_hint": session["token"]["id_token"]},
    )
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
    print("-> /proxy/api/auth/userinfo")
    settings = get_settings()

    userinfo = requests.get(
        settings.oauth_endpoint_userinfo,
        headers={"Authorization": f"Bearer {session['token']['access_token']}"},
    )
    return userinfo.json()


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
    print("-> /proxy/api/auth/session")
    settings = get_settings()

    is_valid_session = False

    if "token" in session:
        userinfo = requests.get(
            settings.oauth_endpoint_userinfo,
            headers={"Authorization": f"Bearer {session['token']['access_token']}"},
        )
        is_valid_session = userinfo.status_code == 200
        if not is_valid_session and refresh_access_token():
            userinfo = requests.get(
                settings.oauth_endpoint_userinfo,
                headers={"Authorization": f"Bearer {session['token']['access_token']}"},
            )
            is_valid_session = userinfo.status_code == 200

    if not is_valid_session:
        session.clear()

    return jsonify({"session": is_valid_session})
