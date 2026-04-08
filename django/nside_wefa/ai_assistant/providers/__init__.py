"""
Provider implementations for AI assistant planning.
"""

from __future__ import annotations

from nside_wefa.ai_assistant.providers.base import (
    AssistantProvider,
    AssistantProviderError,
)
from nside_wefa.ai_assistant.providers.mock import MockAssistantProvider
from nside_wefa.ai_assistant.providers.openai import OpenAIAssistantProvider
from nside_wefa.ai_assistant.services.docs import get_ai_assistant_settings


def get_assistant_provider() -> AssistantProvider:
    """Instantiate the configured planning provider."""
    settings = get_ai_assistant_settings()
    provider_name = settings["PROVIDER"]

    if provider_name == "mock":
        return MockAssistantProvider()

    if provider_name == "openai":
        return OpenAIAssistantProvider(
            api_key=settings["OPENAI_API_KEY"],
            model=settings["OPENAI_MODEL"],
            ca_bundle=settings["OPENAI_CA_BUNDLE"],
        )

    raise AssistantProviderError(f"Unsupported assistant provider '{provider_name}'.")


__all__ = [
    "AssistantProvider",
    "AssistantProviderError",
    "MockAssistantProvider",
    "OpenAIAssistantProvider",
    "get_assistant_provider",
]
