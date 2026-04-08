"""
High-level orchestration for assistant recipe planning.
"""

from __future__ import annotations

from typing import Any

from nside_wefa.ai_assistant.providers import get_assistant_provider
from nside_wefa.ai_assistant.providers.base import AssistantProviderError
from nside_wefa.ai_assistant.services.conversation import (
    AssistantConversationError,
    create_conversation_token,
    read_conversation_token,
)
from nside_wefa.ai_assistant.services.docs import (
    build_doc_map,
    filter_docs_for_user,
    get_ai_assistant_settings,
    load_assistant_docs,
)
from nside_wefa.ai_assistant.services.prefill import enrich_recipe_prefills
from nside_wefa.ai_assistant.services.response_validation import (
    AssistantResponseValidationError,
    validate_provider_response,
)
from nside_wefa.ai_assistant.services.retrieval import (
    AssistantRouteManifestEntry,
    select_candidate_docs,
)


class AssistantPlanningServiceError(RuntimeError):
    """Raised when planning fails before a response can be generated."""


class AssistantPlanningUpstreamError(AssistantPlanningServiceError):
    """Raised when the external provider fails or returns an invalid payload."""


def plan_recipe(
    *,
    prompt: str,
    locale: str,
    route_manifest: list[dict[str, Any]],
    current_route: dict[str, Any] | None,
    user: Any,
    conversation_token: str,
    answers: list[str],
) -> dict[str, Any]:
    """Generate a recipe or clarification response for the frontend."""
    del current_route
    assistant_settings = get_ai_assistant_settings()

    manifest_entries = [
        AssistantRouteManifestEntry(
            doc_id=entry["doc_id"],
            route_name=entry.get("route_name", ""),
            path_template=entry["path_template"],
            label=entry["label"],
            section=entry.get("section", ""),
        )
        for entry in route_manifest
    ]
    manifest_by_doc_id = {entry.doc_id: entry for entry in manifest_entries}

    configured_docs = load_assistant_docs()
    docs_by_id = build_doc_map(configured_docs)
    route_docs = [
        docs_by_id[doc_id] for doc_id in manifest_by_doc_id if doc_id in docs_by_id
    ]
    visible_docs = filter_docs_for_user(route_docs, user)
    candidate_docs = select_candidate_docs(
        prompt=prompt,
        docs=visible_docs,
        manifest_by_doc_id=manifest_by_doc_id,
        max_candidates=assistant_settings["MAX_CANDIDATE_DOCS"],
    )

    conversation_state: dict[str, Any] | None = None
    if conversation_token:
        conversation_state = read_conversation_token(
            conversation_token,
            max_age=assistant_settings["CONVERSATION_TTL_SECONDS"],
        )

    provider = get_assistant_provider()

    try:
        raw_response = provider.plan(
            prompt=prompt,
            locale=locale,
            docs=candidate_docs,
            route_manifest=[manifest_by_doc_id[doc.doc_id] for doc in candidate_docs],
            conversation_state=conversation_state,
            answers=answers,
        )
    except AssistantProviderError as exc:
        raise AssistantPlanningUpstreamError(str(exc)) from exc
    except AssistantConversationError as exc:
        raise AssistantPlanningServiceError(str(exc)) from exc

    raw_response = enrich_recipe_prefills(
        raw_response,
        prompt=prompt,
        docs_by_id={doc.doc_id: doc for doc in visible_docs},
        conversation_state=conversation_state,
        answers=answers,
    )

    if raw_response.get("status") == "needs_clarification":
        next_state = raw_response.get("state") or {}
        next_state["turn_count"] = (
            int(conversation_state.get("turn_count", 0)) + 1
            if conversation_state
            else 1
        )
        if next_state["turn_count"] > assistant_settings["MAX_CLARIFICATION_TURNS"]:
            return {
                "status": "unsupported",
                "message": "The assistant could not resolve the request within the clarification limit.",
            }

        raw_response["conversation_token"] = create_conversation_token(next_state)

    try:
        validated_response = validate_provider_response(
            raw_response,
            available_doc_ids={doc.doc_id for doc in visible_docs},
        )
    except AssistantResponseValidationError as exc:
        raise AssistantPlanningUpstreamError(str(exc)) from exc

    if validated_response["status"] == "needs_clarification":
        return validated_response

    if validated_response.get("conversation_token") == "":
        validated_response.pop("conversation_token", None)

    return validated_response
