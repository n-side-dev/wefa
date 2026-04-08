"""
Provider interface for recipe planning backends.
"""

from __future__ import annotations

from typing import Any, Protocol

from nside_wefa.ai_assistant.contracts import AssistantActionDoc
from nside_wefa.ai_assistant.services.retrieval import AssistantRouteManifestEntry


class AssistantProviderError(RuntimeError):
    """Raised when a provider cannot generate a planning result."""


class AssistantProvider(Protocol):
    """Interface implemented by concrete planning providers."""

    def plan(
        self,
        *,
        prompt: str,
        locale: str,
        docs: list[AssistantActionDoc],
        route_manifest: list[AssistantRouteManifestEntry],
        conversation_state: dict[str, Any] | None = None,
        answers: list[str] | None = None,
    ) -> dict[str, Any]:
        """Generate a structured planning result."""
