# MMS Backend-for-Frontend (BFF)

This repo provides a Flask BFF that handles OAuth login/logout/session checks and proxies REST calls to a backend.

**Quick Start**
1. Create `.env` from `.env.example` in the repo root (do not commit `.env`).
2. `uv sync --dev`
3. `FLASK_RUN_PORT=5022 uv run flask --app bff.py run`

**Prerequisites**
- Python 3.x
- `uv`

**Environment File**
- Location: repo root `.env` (same directory as `bff.py`)
- Template: `.env.example`
- Required values from your OAuth server:
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_ENDPOINT_AUTHORIZATION`
- `OAUTH_ENDPOINT_TOKEN`
- `OAUTH_ENDPOINT_USERINFO`
- Required values from your frontend:
- `FRONTEND_REDIRECT`
- `OAUTH_LOGIN_REDIRECT_URI`
- Session cookie configuration:
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`

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
uv run python -m bff_app.openapi.generate --output openapi.yaml
```
2. Validate that the committed spec is up to date.
```bash
uv run python -m bff_app.openapi.generate --check --output openapi.yaml
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
- `dotenv` loads the `.env` file at process start. If the `.env` is missing or the working directory is wrong, defaults will be used.
