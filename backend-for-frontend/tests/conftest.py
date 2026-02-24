import importlib
import sys
from pathlib import Path

import pytest


@pytest.fixture()
def bff_module(monkeypatch):
    """
    Import the bff module with predictable env vars so tests don't depend on a local .env.
    """
    # Ensure the project root is on sys.path so "import bff" resolves in pytest.
    project_root = Path(__file__).resolve().parents[1]
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

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

    # Import/reload the module after env vars are in place.
    import bff

    importlib.reload(bff)
    bff.app.config["TESTING"] = True
    return bff


@pytest.fixture()
def client(bff_module):
    return bff_module.app.test_client()
