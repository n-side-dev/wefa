# WeFa BFF - Agent Guide

## Scope

This file applies to the Flask backend-for-frontend in `bff/`. The service handles OAuth login/logout/session checks, encrypted token cookies, health endpoints, OpenAPI generation, and proxying backend REST calls.

Read [README.md](/Users/ala/N-SIDE/wefa/bff/README.md) before changing environment contracts, auth/session behavior, OpenAPI output, Docker behavior, or deployment-facing docs.

## Security And Configuration Rules

- Never commit `.env`, OAuth credentials, token values, cookie encryption keys, or local IDE/cache artifacts.
- Keep `.env.example` and README documentation in sync with required and optional settings.
- Required settings should fail fast at startup when missing or blank.
- Preserve production security defaults unless explicitly directed otherwise: HttpOnly token cookies, secure cookie settings, strict SameSite behavior, PKCE verifier/state handling, and explicit callback error handling.
- Token cookies are derived from `SESSION_COOKIE_NAME`; changes to names, payload split behavior, encryption, or expiry semantics need tests and rollout notes.
- Callback failures redirect to `FRONTEND_REDIRECT?error=<code>`; new error codes must be documented and coordinated with Vue flows.
- Do not add broad proxy fallbacks that hide backend failures. Surface upstream errors consistently with existing route behavior.

## Implementation Rules

- Keep route handlers in `bff_app/routes/` and reusable behavior in `bff_app/services/` or `bff_app/settings.py`.
- Use `flask-smorest` patterns already present in the workspace for schema-validated routes.
- Preserve the OpenAPI generator as the source of truth for `bff_app/openapi/openapi.yaml`.
- Use `uv` for dependency and command execution in this workspace.
- Update Docker and README instructions together when runtime ports, environment variables, or startup commands change.

## Tests And OpenAPI

- Add or update tests under `tests/` for auth redirects, callback errors, session behavior, token-cookie behavior, proxying, settings validation, and OpenAPI generation.
- Mock the upstream IdP and backend rather than calling real services.
- Regenerate OpenAPI intentionally, then check for drift.
- Use narrow pytest runs while iterating, then the CI-equivalent checks before handoff when feasible.

## Validation Commands

Run from `bff/` unless noted:

```bash
uv sync --dev
uv run pytest -q
uv run python -m bff_app.openapi.generate --check --output bff_app/openapi/openapi.yaml
uvx pysentry-rs --config .pysentry.toml .
```

For manual local validation:

```bash
FLASK_RUN_PORT=5022 uv run flask --app bff.py run
docker-compose up --build
```

Only run server or Docker commands when manual behavior verification is needed.
