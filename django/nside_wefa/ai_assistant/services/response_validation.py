"""
Validation helpers for provider responses.
"""

from __future__ import annotations

from nside_wefa.ai_assistant.serializers import (
    AssistantClarificationResponseSerializer,
    AssistantRecipeResponseSerializer,
    AssistantUnsupportedResponseSerializer,
)


class AssistantResponseValidationError(ValueError):
    """Raised when a provider response does not satisfy the public contract."""


def validate_provider_response(
    payload: dict,
    available_doc_ids: set[str],
) -> dict:
    """Validate a provider response against the public DRF serializers."""
    status = payload.get("status")

    if status == "recipe":
        serializer = AssistantRecipeResponseSerializer(data=payload)
    elif status == "needs_clarification":
        serializer = AssistantClarificationResponseSerializer(data=payload)
    elif status == "unsupported":
        serializer = AssistantUnsupportedResponseSerializer(data=payload)
    else:
        raise AssistantResponseValidationError(
            "Assistant provider returned an unknown status."
        )

    if not serializer.is_valid():
        raise AssistantResponseValidationError(str(serializer.errors))

    data = serializer.validated_data

    if status == "recipe":
        for step in data["steps"]:
            target = step.get("target")
            if target and target["doc_id"] not in available_doc_ids:
                raise AssistantResponseValidationError(
                    f"Assistant provider returned unknown doc_id '{target['doc_id']}'."
                )

    return data
