"""Flask application factory and top-level wiring for the BFF service."""

from __future__ import annotations

from flask import Flask
from flask_cors import CORS
from flask_smorest import Api

from .routes.auth import auth_bp
from .routes.health import health_bp
from .routes.proxy import proxy_bp
from .settings import BffSettings


def create_app(settings: BffSettings) -> Flask:
    """Create and configure the Flask application.

    :param settings:
        Fully resolved runtime settings loaded from environment variables.
    :returns:
        Configured Flask application with registered blueprints and CORS.
    :rtype: flask.Flask
    """
    app = Flask(__name__)

    app.config["SECRET_KEY"] = settings.flask_secret_key
    app.config["SESSION_COOKIE_NAME"] = settings.session_cookie_name
    app.config["SESSION_COOKIE_PATH"] = settings.session_cookie_path
    app.config["SESSION_COOKIE_HTTPONLY"] = settings.session_cookie_httponly
    app.config["SESSION_COOKIE_SECURE"] = settings.session_cookie_secure
    app.config["SESSION_COOKIE_SAMESITE"] = settings.session_cookie_samesite
    app.config["API_TITLE"] = "BFF Flask API"
    app.config["API_VERSION"] = "1.0.0"
    app.config["OPENAPI_VERSION"] = "3.0.3"

    app.extensions["bff_settings"] = settings

    cors_kwargs = {"supports_credentials": True}
    if settings.cors_allowed_origin:
        cors_kwargs["origins"] = settings.cors_allowed_origin
    CORS(app, **cors_kwargs)

    api = Api(app)
    api.spec.components.security_scheme(
        "sessionCookie",
        {
            "type": "apiKey",
            "in": "cookie",
            "name": "SESSION_COOKIE_NAME",
            "description": (
                "Signed session cookie name is configured at runtime via "
                "SESSION_COOKIE_NAME in the app environment."
            ),
        },
    )
    api.register_blueprint(auth_bp)
    api.register_blueprint(proxy_bp)
    api.register_blueprint(health_bp)

    return app
