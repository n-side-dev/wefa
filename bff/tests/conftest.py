import sys
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
