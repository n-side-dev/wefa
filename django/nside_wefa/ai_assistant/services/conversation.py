"""
Conversation token helpers for bounded clarification flows.
"""

from __future__ import annotations

from typing import Any

from django.core import signing
from django.core.signing import BadSignature, SignatureExpired


CONVERSATION_SALT = "nside_wefa.ai_assistant.conversation"


class AssistantConversationError(ValueError):
    """Raised when a conversation token cannot be trusted."""


def create_conversation_token(payload: dict[str, Any]) -> str:
    """Sign and serialize assistant conversation state."""
    return signing.dumps(payload, salt=CONVERSATION_SALT)


def read_conversation_token(token: str, max_age: int) -> dict[str, Any]:
    """Validate and deserialize assistant conversation state."""
    try:
        payload = signing.loads(token, salt=CONVERSATION_SALT, max_age=max_age)
    except SignatureExpired as exc:
        raise AssistantConversationError("Conversation token has expired.") from exc
    except BadSignature as exc:
        raise AssistantConversationError("Conversation token is invalid.") from exc

    if not isinstance(payload, dict):
        raise AssistantConversationError("Conversation token payload is invalid.")
    return payload
