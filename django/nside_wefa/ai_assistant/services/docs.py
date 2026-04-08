"""
Loading and validation helpers for backend assistant action documentation.
"""

from __future__ import annotations

from importlib import import_module
from typing import Any

from django.conf import settings

from nside_wefa.ai_assistant.contracts import AssistantActionDoc


class AssistantDocConfigurationError(ValueError):
    """Raised when configured assistant docs are incomplete or invalid."""


DEFAULT_AI_ASSISTANT_SETTINGS = {
    "PROVIDER": "mock",
    "OPENAI_API_KEY": "",
    "OPENAI_MODEL": "gpt-4.1-mini",
    "OPENAI_CA_BUNDLE": "",
    "DOC_MODULES": [],
    "MAX_CLARIFICATION_TURNS": 3,
    "MAX_CANDIDATE_DOCS": 8,
    "PROMPT_MAX_CHARS": 3000,
    "CONVERSATION_TTL_SECONDS": 1800,
    "REQUIRE_AUTHENTICATION": False,
}

VALID_PROVIDERS = {"mock", "openai"}


def get_ai_assistant_settings() -> dict[str, Any]:
    """Return merged settings with defaults applied."""
    nside_wefa_settings: dict[str, Any] = getattr(settings, "NSIDE_WEFA", {}) or {}
    assistant_settings = nside_wefa_settings.get("AI_ASSISTANT", {}) or {}
    merged = {**DEFAULT_AI_ASSISTANT_SETTINGS, **assistant_settings}
    return merged


def iter_doc_modules(module_paths: list[str]) -> list[Any]:
    """Import and return configured assistant documentation modules."""
    modules = []
    for module_path in module_paths:
        try:
            modules.append(import_module(module_path))
        except Exception as exc:  # pragma: no cover - exercised in tests
            raise AssistantDocConfigurationError(
                f"Failed to import AI assistant docs module '{module_path}': {exc}"
            ) from exc
    return modules


def load_assistant_docs(
    module_paths: list[str] | None = None,
) -> list[AssistantActionDoc]:
    """Load docs from configured modules."""
    configured_paths = module_paths
    if configured_paths is None:
        configured_paths = list(get_ai_assistant_settings()["DOC_MODULES"])

    docs: list[AssistantActionDoc] = []
    for module in iter_doc_modules(configured_paths):
        module_docs = getattr(module, "AI_ASSISTANT_DOCS", None)
        if module_docs is None:
            raise AssistantDocConfigurationError(
                f"Module '{module.__name__}' does not define AI_ASSISTANT_DOCS."
            )
        docs.extend(module_docs)
    return docs


def validate_assistant_docs(docs: list[AssistantActionDoc]) -> list[str]:
    """Return human-readable configuration errors for invalid docs."""
    errors: list[str] = []
    seen_doc_ids: set[str] = set()

    for doc in docs:
        if not isinstance(doc, AssistantActionDoc):
            errors.append(
                "AI_ASSISTANT_DOCS entries must be AssistantActionDoc instances."
            )
            continue

        if not doc.doc_id.strip():
            errors.append("Assistant doc_id must be a non-empty string.")
        elif doc.doc_id in seen_doc_ids:
            errors.append(f"Assistant doc_id '{doc.doc_id}' is duplicated.")
        else:
            seen_doc_ids.add(doc.doc_id)

        if not doc.title.strip():
            errors.append(f"Assistant doc '{doc.doc_id}' is missing a title.")

        if not doc.summary.strip():
            errors.append(f"Assistant doc '{doc.doc_id}' is missing a summary.")

        if not doc.intents or not all(intent.strip() for intent in doc.intents):
            errors.append(
                f"Assistant doc '{doc.doc_id}' must define non-empty intents."
            )

        if not doc.examples or not all(example.strip() for example in doc.examples):
            errors.append(
                f"Assistant doc '{doc.doc_id}' must define non-empty examples."
            )

        for input_doc in [*doc.required_inputs, *doc.optional_inputs]:
            if not input_doc.name.strip() or not input_doc.label.strip():
                errors.append(
                    f"Assistant doc '{doc.doc_id}' contains an input with missing name or label."
                )

        for output_doc in doc.outputs:
            if not output_doc.name.strip() or not output_doc.description.strip():
                errors.append(
                    f"Assistant doc '{doc.doc_id}' contains an output with missing name or description."
                )

        for operation_ref in doc.operation_refs:
            if not operation_ref.method.strip() or not operation_ref.path.strip():
                errors.append(
                    f"Assistant doc '{doc.doc_id}' contains an operation ref with missing method or path."
                )

    return errors


def build_doc_map(docs: list[AssistantActionDoc]) -> dict[str, AssistantActionDoc]:
    """Build a lookup table keyed by doc_id."""
    return {doc.doc_id: doc for doc in docs}


def filter_docs_for_user(
    docs: list[AssistantActionDoc],
    user: Any,
) -> list[AssistantActionDoc]:
    """Filter docs according to Django permission requirements."""
    visible_docs: list[AssistantActionDoc] = []
    is_authenticated = bool(getattr(user, "is_authenticated", False))

    for doc in docs:
        if not doc.required_permissions:
            visible_docs.append(doc)
            continue

        if is_authenticated and user.has_perms(doc.required_permissions):
            visible_docs.append(doc)

    return visible_docs
