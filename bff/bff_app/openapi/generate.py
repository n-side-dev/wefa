"""Generate OpenAPI spec from flask-smorest decorators."""

from __future__ import annotations

import argparse
from pathlib import Path

import yaml

from bff_app import create_app
from bff_app.settings import BffSettings


def _spec_settings() -> BffSettings:
    """Build deterministic settings for spec export."""
    return BffSettings(
        flask_secret_key="openapi-generator",
        token_cookie_encryption_key=b"0123456789abcdef0123456789abcdef",
        session_cookie_name="SESSION_COOKIE_NAME",
        session_cookie_path="/",
        session_cookie_httponly=True,
        session_cookie_secure=True,
        session_cookie_samesite="Strict",
        cors_allowed_origin="http://frontend.example",
        backend_endpoint="http://backend.example/api",
        oauth_client_id="client-id",
        oauth_client_secret="client-secret",
        oauth_oidc_scope="openid",
        oauth_endpoint_authorization="http://auth.example/authorize",
        oauth_endpoint_token="http://auth.example/token",
        oauth_endpoint_userinfo="http://auth.example/userinfo",
        oauth_endpoint_logout="http://auth.example/logout",
        oauth_login_redirect_uri="http://localhost:5022/proxy/api/auth/callback",
        frontend_redirect="http://localhost:5178",
    )


def build_openapi_document() -> dict:
    """Export OpenAPI document from route decorators."""
    app = create_app(settings=_spec_settings())
    api = app.extensions["flask-smorest"]["apis"][""]["ext_obj"]
    document = api.spec.to_dict()
    document.setdefault("servers", [{"url": "/"}])
    return document


def dump_openapi_yaml(document: dict) -> str:
    """Serialize OpenAPI document to deterministic YAML."""
    return yaml.safe_dump(
        document,
        sort_keys=False,
        default_flow_style=False,
        allow_unicode=False,
    )


def generate_openapi(output: Path, check: bool) -> int:
    """Generate OpenAPI YAML and write or compare against output path."""
    document = build_openapi_document()
    rendered = dump_openapi_yaml(document)

    if check:
        if not output.exists():
            print(f"OpenAPI file not found: {output}")
            return 1
        current = output.read_text(encoding="utf-8")
        if current != rendered:
            print(
                "OpenAPI spec is out of date. Run:\n"
                "uv run python -m bff_app.openapi.generate --output openapi.yaml"
            )
            return 1
        print("OpenAPI spec is up to date.")
        return 0

    output.write_text(rendered, encoding="utf-8")
    print(f"Wrote OpenAPI spec to {output}")
    return 0


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint for OpenAPI generation."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default="openapi.yaml",
        help="Path of the generated OpenAPI YAML file.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check if output file is up to date instead of rewriting it.",
    )
    args = parser.parse_args(argv)
    return generate_openapi(output=Path(args.output), check=args.check)


if __name__ == "__main__":
    raise SystemExit(main())
