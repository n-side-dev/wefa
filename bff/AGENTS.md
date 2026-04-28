# WeFa BFF – Agent Guide

Flask Backend-for-Frontend that handles OAuth login/logout/session for the Vue SPA and proxies REST calls to the Django backend. Read alongside the repo-wide [`../AGENTS.md`](../AGENTS.md). Setup, env vars, and security model live in [`README.md`](README.md); this file captures conventions, the quality gate, and gotchas.

## Layout

- **Entrypoint**: [`bff.py`](bff.py) — loads `.env` and calls `bff_app.create_app()`.
- **App factory**: [`bff_app/__init__.py`](bff_app/__init__.py) — wires CORS, smorest API, blueprints.
- **Routes** (Flask blueprints): [`bff_app/routes/auth.py`](bff_app/routes/auth.py), [`bff_app/routes/proxy.py`](bff_app/routes/proxy.py), [`bff_app/routes/health.py`](bff_app/routes/health.py).
- **Services**: [`bff_app/services/auth.py`](bff_app/services/auth.py) (Authlib + PKCE), [`bff_app/services/token_cookies.py`](bff_app/services/token_cookies.py) (encrypted HttpOnly cookies).
- **Settings**: [`bff_app/settings.py`](bff_app/settings.py) — fail-fast env validation; required keys listed in `README.md`.
- **OpenAPI**: [`bff_app/openapi/generate.py`](bff_app/openapi/generate.py) emits the static spec at `bff_app/openapi/openapi.yaml`.
- **Tests**: `tests/` (one file per route + service).

## Conventions

- **Blueprint per concern**; register in `bff_app/__init__.py` only. Don't add routes to existing blueprints if they don't fit the concern (e.g. don't put proxy logic into `auth_bp`).
- **`flask-smorest`** for schema-validated routes — define schemas in the same file as the blueprint unless they're shared.
- **OAuth state lives in Flask's signed session cookie**; tokens live in separate encrypted cookies (`<SESSION_COOKIE_NAME>_at`, `_rt`, `_it`, `_meta`). Don't store tokens in the session. **`SESSION_COOKIE_SECURE=True` and `SESSION_COOKIE_SAMESITE=Strict` are mandatory in production** — the BFF doesn't enforce this; the deployment does.
- **PKCE**: every login flow generates a verifier; the callback validates state + verifier before token exchange. See `bff_app/services/auth.py`.
- **Failure redirects**: callback errors redirect to `FRONTEND_REDIRECT?error=<code>`. Add new error codes to the documented list in `README.md` when introducing them. Current codes: `auth_state_missing`, `auth_state_mismatch`, `auth_provider_error`, `auth_callback_incomplete`, `auth_token_exchange_failed`, `auth_invalid_token`, `auth_cookie_too_large`.
- **Settings module is fail-fast**: missing required env vars raise at app startup. Add new required vars to both `bff_app/settings.py` validation and the `README.md` env reference. **`dotenv` loads once at process start** — adding a var to `.env.example` only is not enough.
- **Encrypted-cookie code is security-sensitive**: don't bypass key validation, don't introduce new cookie names without coordinating with the frontend. **Existing signed-session token payloads are not migrated** when the cookie scheme changes (encrypted cookies were a recent rollout). Document any further format change in the PR body so deployers know to clear sessions.

## Quality gate

CWD is `bff/`.

```bash
uv sync --dev                                                                            # install + dev deps
FLASK_RUN_PORT=5022 uv run flask --app bff.py run                                        # local server
uv run pytest                                                                            # full suite
uv run python -m bff_app.openapi.generate --output bff_app/openapi/openapi.yaml          # regenerate spec
uv run python -m bff_app.openapi.generate --check  --output bff_app/openapi/openapi.yaml # CI: spec is current
docker-compose up --build                                                                # parity with the published image
```

The BFF has no ruff/mypy gate today; adding one is a good first issue.

## Tests

- **Conftest** (`tests/conftest.py`) sets up the Flask test client with a known set of env vars; mirror its pattern when adding tests so the OAuth/PKCE state is deterministic.
- Mock the upstream IdP and the upstream Django backend via `requests` patching — never hit real endpoints.
- Encrypted cookies are exercised with a known `TOKEN_COOKIE_ENCRYPTION_KEY`; reuse the conftest fixture rather than rolling a new key per test.
- The OpenAPI spec is regression-tested in `tests/test_openapi_generation.py` — run it after touching any route schema.

## Cross-workspace coordination

- **Vue** consumes the BFF cookies and the proxied Django responses. When you change cookie names, redirect targets, or error codes, update the corresponding flows in `vue/` and notify the frontend on the PR.
- **Django** is the upstream backend. When the BFF proxy touches a new endpoint, confirm the Django route exists and is documented in the relevant `nside_wefa/<app>/README.md`.
- The BFF sits at the boundary; rather than expand BFF surface area, prefer pushing logic to Django (where it can be unit-tested + system-checked) or to Vue (where the user owns the state).

## Docker / release

- The BFF is shipped as a Docker image to GHCR on every GitHub release: `ghcr.io/n-side-dev/wefa/bff:<release-tag>` (and `:latest` for non-prerelease tags). See repo root `README.md`.
- **Port env vars differ by entrypoint**: `flask run` reads `FLASK_RUN_PORT`, Docker reads `PORT`, and `python bff.py` defaults to 5000 unless code overrides it. Always set `FLASK_RUN_PORT` for `flask run` and `PORT` for Docker.
- Don't change `pyproject.toml` Python ceiling (`>=3.12,<3.13`) without coordinating; some downstream Docker tooling pins 3.12.

## Open follow-ups

- **No central log correlation yet.** When the request-ID middleware tracked in [`../docs/agent-roadmap.md`](../docs/agent-roadmap.md) ships, the BFF should forward `X-Request-ID` so logs correlate end-to-end.
