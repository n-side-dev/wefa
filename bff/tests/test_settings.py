import pytest

from bff_app.settings import SettingsValidationError, load_settings_from_env


def _set_required_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("FLASK_SECRET_KEY", "test-secret")
    monkeypatch.setenv("SESSION_COOKIE_NAME", "test-session")
    monkeypatch.setenv("SESSION_COOKIE_PATH", "/")
    monkeypatch.setenv("SESSION_COOKIE_HTTPONLY", "True")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "False")
    monkeypatch.setenv("SESSION_COOKIE_SAMESITE", "Lax")
    monkeypatch.setenv("CORS_ALLOWED_ORIGIN", "http://frontend.test")
    monkeypatch.setenv("BACKEND_ENDPOINT", "http://backend.test/api")
    monkeypatch.setenv("OAUTH_CLIENT_ID", "client-id")
    monkeypatch.setenv("OAUTH_CLIENT_SECRET", "client-secret")
    monkeypatch.setenv("OAUTH_OIDC_SCOPE", "openid profile")
    monkeypatch.setenv("OAUTH_ENDPOINT_AUTHORIZATION", "http://auth.test/authorize")
    monkeypatch.setenv("OAUTH_ENDPOINT_TOKEN", "http://auth.test/token")
    monkeypatch.setenv("OAUTH_ENDPOINT_USERINFO", "http://auth.test/userinfo")
    monkeypatch.setenv("OAUTH_ENDPOINT_LOGOUT", "http://auth.test/logout")
    monkeypatch.setenv(
        "OAUTH_LOGIN_REDIRECT_URI",
        "http://app.test/proxy/api/auth/callback",
    )
    monkeypatch.setenv("FRONTEND_REDIRECT", "http://frontend.test")


def test_load_settings_from_env_requires_all_vars(monkeypatch: pytest.MonkeyPatch):
    _set_required_env(monkeypatch)
    monkeypatch.delenv("OAUTH_ENDPOINT_TOKEN", raising=False)

    with pytest.raises(SettingsValidationError, match="OAUTH_ENDPOINT_TOKEN"):
        load_settings_from_env()


def test_load_settings_from_env_rejects_blank_values(
    monkeypatch: pytest.MonkeyPatch,
):
    _set_required_env(monkeypatch)
    monkeypatch.setenv("FRONTEND_REDIRECT", " ")

    with pytest.raises(SettingsValidationError, match="FRONTEND_REDIRECT"):
        load_settings_from_env()


def test_load_settings_from_env_returns_validated_settings(
    monkeypatch: pytest.MonkeyPatch,
):
    _set_required_env(monkeypatch)

    settings = load_settings_from_env()

    assert settings.flask_secret_key == "test-secret"
    assert settings.session_cookie_name == "test-session"
    assert settings.session_cookie_path == "/"
    assert settings.session_cookie_httponly is True
    assert settings.session_cookie_secure is False
    assert settings.session_cookie_samesite == "Lax"
    assert settings.cors_allowed_origin == "http://frontend.test"
    assert settings.backend_endpoint == "http://backend.test/api"
    assert settings.oauth_client_id == "client-id"
    assert settings.oauth_client_secret == "client-secret"
    assert settings.oauth_oidc_scope == "openid profile"
    assert settings.oauth_endpoint_authorization == "http://auth.test/authorize"
    assert settings.oauth_endpoint_token == "http://auth.test/token"
    assert settings.oauth_endpoint_userinfo == "http://auth.test/userinfo"
    assert settings.oauth_endpoint_logout == "http://auth.test/logout"
    assert settings.oauth_login_redirect_uri == "http://app.test/proxy/api/auth/callback"
    assert settings.frontend_redirect == "http://frontend.test"
    assert settings.backend_connect_timeout_seconds == 3.0
    assert settings.backend_read_timeout_seconds == 30.0


def test_load_settings_from_env_accepts_custom_backend_timeouts(
    monkeypatch: pytest.MonkeyPatch,
):
    _set_required_env(monkeypatch)
    monkeypatch.setenv("BACKEND_CONNECT_TIMEOUT_SECONDS", "1.5")
    monkeypatch.setenv("BACKEND_READ_TIMEOUT_SECONDS", "12")

    settings = load_settings_from_env()

    assert settings.backend_connect_timeout_seconds == 1.5
    assert settings.backend_read_timeout_seconds == 12.0


def test_load_settings_from_env_rejects_invalid_backend_timeouts(
    monkeypatch: pytest.MonkeyPatch,
):
    _set_required_env(monkeypatch)
    monkeypatch.setenv("BACKEND_CONNECT_TIMEOUT_SECONDS", "0")

    with pytest.raises(
        SettingsValidationError,
        match="BACKEND_CONNECT_TIMEOUT_SECONDS must be greater than 0",
    ):
        load_settings_from_env()
