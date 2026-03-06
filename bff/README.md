# Backend-for-Frontend (BFF)

This repo provides a Flask BFF that handles OAuth login/logout/session checks and proxies REST calls to a backend.

For more information on the BFF architecture, see:
- https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps#name-backend-for-frontend-bff
- https://auth0.com/blog/the-backend-for-frontend-pattern-bff/

**Quick Start**
1. Create `.env` from `.env.example` in the repo root (do not commit `.env`).
2. `uv sync --dev`
3. `FLASK_RUN_PORT=5022 uv run flask --app bff.py run`

**Prerequisites**
- Python 3.12.x (per `pyproject.toml` requirement: Python >=3.12,<3.13)
- `uv`

**Environment File**
- Location: repo root `.env` (same directory as `bff.py`)
- Template: `.env.example`
- Required values (validated at startup):
- `FLASK_SECRET_KEY`
- `BACKEND_ENDPOINT`
- `CORS_ALLOWED_ORIGIN`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_OIDC_SCOPE`
- `OAUTH_ENDPOINT_AUTHORIZATION`
- `OAUTH_ENDPOINT_TOKEN`
- `OAUTH_ENDPOINT_USERINFO`
- `OAUTH_ENDPOINT_LOGOUT`
- `FRONTEND_REDIRECT`
- `OAUTH_LOGIN_REDIRECT_URI`
- Session cookie configuration:
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_PATH`
- `SESSION_COOKIE_HTTPONLY`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`
- Optional values:
- `BACKEND_CONNECT_TIMEOUT_SECONDS` (default: `3`)
- `BACKEND_READ_TIMEOUT_SECONDS` (default: `30`)

**Run Locally (Flask / PyCharm)**
1. Ensure `.env` exists in the repo root.
2. Install dependencies.
```bash
uv sync --dev
```
3. Set the Flask port and run.
```bash
FLASK_RUN_PORT=5022 uv run flask --app bff.py run
```
- Why: `flask run` reads `FLASK_RUN_PORT` (not `PORT`).
- In PyCharm, set the working directory to the repo root so `.env` is picked up.
- If you prefer, you can pass `--port 5022` in the run configuration.

**Generate OpenAPI Spec**
1. Generate or refresh the spec file.
```bash
uv run python -m bff_app.openapi.generate --output bff_app/openapi/openapi.yaml
```
2. Validate that the committed spec is up to date.
```bash
uv run python -m bff_app.openapi.generate --check --output bff_app/openapi/openapi.yaml
```

**Run with Docker**
1. Ensure `.env` exists in the repo root.
2. Build and run.
```bash
docker-compose up --build
```
- Docker uses `PORT` from `.env` for the exposed port.

**Security Notes**
- Tokens, PKCE verifier, and OAuth state are stored in Flask's signed session cookie.
- This service does not currently configure Flask-Session/Redis-backed server-side session storage.
- Keep `SESSION_COOKIE_SECURE=True` and `SESSION_COOKIE_SAMESITE=Strict` in production.

**Notes / Common Pitfalls**
- If you run `bff.py` directly (not `flask run`), Flask will default to port 5000 unless you explicitly set the port in code.
- `dotenv` loads the `.env` file at process start. Startup now fails fast with a validation error if required variables are missing or blank.
