import sys
from http.cookies import SimpleCookie
from pathlib import Path

import pytest

# Ensure the project root is on sys.path so local imports resolve in pytest.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture()
def app(monkeypatch):
    """
    Build a Flask app with predictable env vars so tests don't depend on a local .env.
    """
    # Core Flask config
    monkeypatch.setenv("FLASK_SECRET_KEY", "test-secret")
    monkeypatch.setenv(
        "TOKEN_COOKIE_ENCRYPTION_KEY",
        "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY",
    )
    monkeypatch.setenv("SESSION_COOKIE_NAME", "test-session")
    monkeypatch.setenv("SESSION_COOKIE_PATH", "/")
    monkeypatch.setenv("SESSION_COOKIE_HTTPONLY", "True")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "False")
    monkeypatch.setenv("SESSION_COOKIE_SAMESITE", "Lax")
    monkeypatch.setenv("CORS_ALLOWED_ORIGIN", "http://example.test")

    # Backend proxy configuration
    monkeypatch.setenv("BACKEND_ENDPOINT", "http://backend.test/api")

    # OAuth config
    monkeypatch.setenv("OAUTH_CLIENT_ID", "client-id")
    monkeypatch.setenv("OAUTH_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("OAUTH_OIDC_SCOPE", "openid profile")
    monkeypatch.setenv("OAUTH_ENDPOINT_AUTHORIZATION", "http://auth.test/authorize")
    monkeypatch.setenv("OAUTH_ENDPOINT_TOKEN", "http://auth.test/token")
    monkeypatch.setenv("OAUTH_ENDPOINT_USERINFO", "http://auth.test/userinfo")
    monkeypatch.setenv("OAUTH_ENDPOINT_LOGOUT", "http://auth.test/logout")
    monkeypatch.setenv("OAUTH_LOGIN_REDIRECT_URI", "http://app.test/proxy/api/auth/callback")
    monkeypatch.setenv("FRONTEND_REDIRECT", "http://frontend.test")

    from bff_app import create_app
    from bff_app.settings import load_settings_from_env

    flask_app = create_app(load_settings_from_env())
    flask_app.config["TESTING"] = True
    return flask_app


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def build_token_payload():
    def _build_token_payload(**overrides):
        payload = {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "id_token": "id-token",
            "expires_in": 300,
            "refresh_expires_in": 1800,
            "token_type": "Bearer",
            "scope": "openid profile",
            "expires_at": 1773046864,
        }
        payload.update(overrides)
        return payload

    return _build_token_payload


@pytest.fixture()
def set_auth_cookies(app):
    from bff_app.services.token_cookies import set_token_cookies

    settings = app.extensions["bff_settings"]

    def _set_auth_cookies(client, token_payload):
        response = app.response_class()
        set_token_cookies(response, token_payload, settings)

        parsed = SimpleCookie()
        for set_cookie_header in response.headers.getlist("Set-Cookie"):
            parsed.load(set_cookie_header)

        for morsel in parsed.values():
            client.set_cookie(
                key=morsel.key,
                value=morsel.value,
                path=morsel["path"] or "/",
            )

    return _set_auth_cookies
