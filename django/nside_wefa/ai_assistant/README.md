# WeFa AI Assistant App

The `nside_wefa.ai_assistant` app provides a structured recipe-planning endpoint
for frontend assistants such as the WeFa command palette `Ask` mode.

## Overview

The app is designed around a backend-owned documentation registry keyed by
stable `doc_id` values. Frontends provide a compact route manifest containing
those same `doc_id` values, and the backend uses richer action documentation to:

- filter actions by permissions
- retrieve the most relevant actions for a prompt
- ask clarifying questions when needed
- generate a structured recipe that points back to frontend routes

## Installation

1. Add the app to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    "rest_framework",
    "nside_wefa.common",
    "nside_wefa.ai_assistant",
]
```

2. Include the URLs:

```python
from django.urls import include, path

urlpatterns = [
    path("ai-assistant/", include("nside_wefa.ai_assistant.urls")),
]
```

3. Configure the app under `NSIDE_WEFA`:

```python
NSIDE_WEFA = {
    "APP_NAME": "My Product",
    "AI_ASSISTANT": {
        "PROVIDER": "mock",
        "DOC_MODULES": ["my_project.ai_docs"],
        "OPENAI_API_KEY": "",
        "OPENAI_MODEL": "gpt-4.1-mini",
        "OPENAI_CA_BUNDLE": "",
        "MAX_CLARIFICATION_TURNS": 3,
        "MAX_CANDIDATE_DOCS": 8,
        "PROMPT_MAX_CHARS": 3000,
        "CONVERSATION_TTL_SECONDS": 1800,
        "REQUIRE_AUTHENTICATION": False,
    },
}
```

## Defining backend action docs

Each configured module must expose `AI_ASSISTANT_DOCS`, a list of
`AssistantActionDoc` entries:

```python
from nside_wefa.ai_assistant.contracts import AssistantActionDoc

AI_ASSISTANT_DOCS = [
    AssistantActionDoc(
        doc_id="catalog.product.create",
        title="Create product",
        summary="Open the product creation flow.",
        intents=["create a product", "add a product"],
        examples=["Create a new bottle product"],
    ),
]
```

Completeness is validated through Django system checks.

## Runtime contract

The frontend sends:

- the user prompt
- the current route
- a route manifest keyed by `doc_id`
- an optional signed clarification token

The backend returns one of:

- `recipe`
- `needs_clarification`
- `unsupported`

All responses are structured JSON suitable for UI rendering.

## Providers

- `mock`: deterministic provider for tests, CI, and local development
- `openai`: calls the OpenAI Chat Completions API with structured outputs

If `PROVIDER` is `openai`, the app fails Django system checks when
`OPENAI_API_KEY` is missing.

If your machine or company proxy uses a custom root certificate, configure
`OPENAI_CA_BUNDLE` with the path to a PEM bundle. When it is not set, the
provider falls back to `SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE`, and then the
bundled `certifi` certificate store.

The OpenAI provider uses an internal strict schema that stays within the
Structured Outputs subset supported by the API, then normalizes the result back
to the public WeFa response contract.
