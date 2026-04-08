"""
System checks for the nside_wefa.ai_assistant app.
"""

from __future__ import annotations

from pathlib import Path

from django.core.checks import Error, register

from nside_wefa.ai_assistant.apps import AIAssistantConfig
from nside_wefa.ai_assistant.services.docs import (
    VALID_PROVIDERS,
    get_ai_assistant_settings,
    load_assistant_docs,
    validate_assistant_docs,
)
from nside_wefa.common.apps import CommonConfig
from nside_wefa.utils.checks import (
    check_apps_dependencies_order,
    check_nside_wefa_settings,
)


@register()
def wefa_ai_assistant_dependencies_check(app_configs, **kwargs) -> list[Error]:
    """Ensure common is loaded before the assistant app."""
    del app_configs, kwargs
    return check_apps_dependencies_order([CommonConfig.name, AIAssistantConfig.name])


def validate_provider_name(provider_name: str) -> list[Error]:
    """Validate the configured provider name."""
    if provider_name not in VALID_PROVIDERS:
        return [
            Error(
                f"NSIDE_WEFA.AI_ASSISTANT.PROVIDER must be one of {sorted(VALID_PROVIDERS)}."
            )
        ]
    return []


@register()
def ai_assistant_settings_check(app_configs, **kwargs) -> list[Error]:
    """Validate the AI assistant settings section and provider-specific requirements."""
    del app_configs, kwargs
    errors = check_nside_wefa_settings(
        section_name="AI_ASSISTANT",
        required_keys=["PROVIDER", "DOC_MODULES"],
        custom_validators={"PROVIDER": validate_provider_name},
    )

    assistant_settings = get_ai_assistant_settings()
    if (
        assistant_settings["PROVIDER"] == "openai"
        and not assistant_settings["OPENAI_API_KEY"]
    ):
        errors.append(
            Error(
                "NSIDE_WEFA.AI_ASSISTANT.OPENAI_API_KEY must be configured when PROVIDER is 'openai'."
            )
        )

    if (
        assistant_settings["PROVIDER"] == "openai"
        and not assistant_settings["OPENAI_MODEL"]
    ):
        errors.append(
            Error(
                "NSIDE_WEFA.AI_ASSISTANT.OPENAI_MODEL must be configured when PROVIDER is 'openai'."
            )
        )

    ca_bundle = str(assistant_settings.get("OPENAI_CA_BUNDLE", "")).strip()
    if ca_bundle and not Path(ca_bundle).expanduser().exists():
        errors.append(
            Error(
                "NSIDE_WEFA.AI_ASSISTANT.OPENAI_CA_BUNDLE points to a file that does not exist."
            )
        )

    return errors


@register()
def ai_assistant_docs_check(app_configs, **kwargs) -> list[Error]:
    """Validate configured documentation modules and doc completeness."""
    del app_configs, kwargs
    errors: list[Error] = []
    try:
        docs = load_assistant_docs()
    except Exception as exc:  # pragma: no cover - exercised by tests
        return [Error(str(exc))]

    for message in validate_assistant_docs(docs):
        errors.append(Error(message))

    return errors
