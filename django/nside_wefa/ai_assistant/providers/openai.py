"""
OpenAI-backed provider for structured recipe planning.
"""

from __future__ import annotations

import json
import os
import ssl
from pathlib import Path
from typing import Any
from urllib import error, request

import certifi

from nside_wefa.ai_assistant.contracts import AssistantActionDoc
from nside_wefa.ai_assistant.providers.base import (
    AssistantProvider,
    AssistantProviderError,
)
from nside_wefa.ai_assistant.services.retrieval import AssistantRouteManifestEntry


OPENAI_RECIPE_SCHEMA = {
    "name": "wefa_assistant_recipe",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "$defs": {
            "named_value": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "key": {"type": "string"},
                    "value": {"type": "string"},
                },
                "required": ["key", "value"],
            }
        },
        "properties": {
            "status": {
                "type": "string",
                "enum": ["recipe", "needs_clarification", "unsupported"],
            },
            "summary": {"type": "string"},
            "message": {"type": "string"},
            "warnings": {"type": "array", "items": {"type": "string"}},
            "questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "id": {"type": "string"},
                        "text": {"type": "string"},
                    },
                    "required": ["id", "text"],
                },
            },
            "steps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "id": {"type": "string"},
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "action_label": {"type": "string"},
                        "depends_on_step_ids": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "target": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "doc_id": {"type": "string"},
                                "params": {
                                    "type": "array",
                                    "items": {"$ref": "#/$defs/named_value"},
                                },
                                "query": {
                                    "type": "array",
                                    "items": {"$ref": "#/$defs/named_value"},
                                },
                            },
                            "required": ["doc_id", "params", "query"],
                        },
                    },
                    "required": [
                        "id",
                        "title",
                        "description",
                        "action_label",
                        "depends_on_step_ids",
                        "target",
                    ],
                },
            },
        },
        "required": ["status", "summary", "message", "warnings", "questions", "steps"],
    },
}


class OpenAIAssistantProvider(AssistantProvider):
    """Provider that calls the OpenAI Chat Completions API."""

    def __init__(self, api_key: str, model: str, ca_bundle: str = "") -> None:
        self.api_key = api_key
        self.model = model
        self.ca_bundle = ca_bundle.strip()

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
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": self._build_system_prompt()},
                {
                    "role": "user",
                    "content": self._build_user_prompt(
                        prompt=prompt,
                        locale=locale,
                        docs=docs,
                        route_manifest=route_manifest,
                        conversation_state=conversation_state,
                        answers=answers or [],
                    ),
                },
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": OPENAI_RECIPE_SCHEMA,
            },
        }

        req = request.Request(
            url="https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
        )

        try:
            with request.urlopen(
                req,
                timeout=30,
                context=self._build_ssl_context(),
            ) as response:
                raw_payload = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise AssistantProviderError(
                f"OpenAI request failed with status {exc.code}: {body}"
            ) from exc
        except error.URLError as exc:
            if isinstance(exc.reason, ssl.SSLError):
                raise AssistantProviderError(
                    "OpenAI TLS verification failed. Configure "
                    "NSIDE_WEFA.AI_ASSISTANT.OPENAI_CA_BUNDLE or the demo "
                    ".env OPENAI_CA_BUNDLE if your machine or proxy requires "
                    "a custom CA bundle. "
                    f"Original error: {exc.reason}"
                ) from exc
            raise AssistantProviderError(
                f"OpenAI request failed: {exc.reason}"
            ) from exc

        try:
            content = raw_payload["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as exc:
            raise AssistantProviderError(
                "OpenAI response did not contain a valid structured payload."
            ) from exc

        parsed = self._normalize_structured_response(parsed)

        if conversation_state:
            parsed["state"] = conversation_state
        return parsed

    def _build_ssl_context(self) -> ssl.SSLContext:
        """Build an SSL context using the configured or default CA bundle."""
        return ssl.create_default_context(cafile=self._resolve_ca_bundle())

    def _resolve_ca_bundle(self) -> str:
        """Resolve the CA bundle path used for OpenAI HTTPS requests."""
        if self.ca_bundle:
            return str(Path(self.ca_bundle).expanduser())

        for env_var_name in ("OPENAI_CA_BUNDLE", "SSL_CERT_FILE", "REQUESTS_CA_BUNDLE"):
            env_value = os.environ.get(env_var_name, "").strip()
            if env_value:
                return str(Path(env_value).expanduser())

        return certifi.where()

    @staticmethod
    def _normalize_structured_response(payload: dict[str, Any]) -> dict[str, Any]:
        """Convert OpenAI-specific array encodings back to the public response contract."""
        if payload.get("status") != "recipe":
            return payload

        normalized_steps: list[dict[str, Any]] = []
        for step in payload.get("steps", []):
            normalized_step = dict(step)
            target = normalized_step.get("target")
            if target:
                normalized_target = dict(target)
                normalized_target["params"] = OpenAIAssistantProvider._pairs_to_mapping(
                    target.get("params", [])
                )
                normalized_target["query"] = OpenAIAssistantProvider._pairs_to_mapping(
                    target.get("query", [])
                )
                normalized_step["target"] = normalized_target
            normalized_steps.append(normalized_step)

        payload["steps"] = normalized_steps
        return payload

    @staticmethod
    def _pairs_to_mapping(pairs: list[dict[str, str]]) -> dict[str, str]:
        """Convert a list of structured key/value objects into a mapping."""
        mapping: dict[str, str] = {}
        for pair in pairs:
            key = str(pair.get("key", "")).strip()
            if not key:
                continue
            mapping[key] = str(pair.get("value", ""))
        return mapping

    @staticmethod
    def _build_system_prompt() -> str:
        return (
            "You are a workflow planner for a web application. "
            "Return only structured JSON matching the provided schema. "
            "Never invent doc_id values. "
            "Use only the provided route manifest and backend action docs. "
            "When a step opens a data-entry page and the request already contains usable field values, "
            "include them in target.query using the exact input names documented for that action. "
            "Use target.params only for route params and target.query for prefilled form values. "
            "If information is missing, return status='needs_clarification' with targeted questions. "
            "If the request cannot be mapped to supported actions, return status='unsupported'."
        )

    @staticmethod
    def _build_user_prompt(
        *,
        prompt: str,
        locale: str,
        docs: list[AssistantActionDoc],
        route_manifest: list[AssistantRouteManifestEntry],
        conversation_state: dict[str, Any] | None,
        answers: list[str],
    ) -> str:
        docs_payload = [
            {
                "doc_id": doc.doc_id,
                "title": doc.title,
                "summary": doc.summary,
                "intents": doc.intents,
                "examples": doc.examples,
                "required_inputs": [
                    {
                        "name": input_doc.name,
                        "label": input_doc.label,
                        "description": input_doc.description,
                        "data_type": input_doc.data_type,
                    }
                    for input_doc in doc.required_inputs
                ],
                "optional_inputs": [
                    {
                        "name": input_doc.name,
                        "label": input_doc.label,
                        "description": input_doc.description,
                        "data_type": input_doc.data_type,
                    }
                    for input_doc in doc.optional_inputs
                ],
                "outputs": [
                    {
                        "name": output_doc.name,
                        "description": output_doc.description,
                        "data_type": output_doc.data_type,
                    }
                    for output_doc in doc.outputs
                ],
                "preconditions": doc.preconditions,
                "frontend_notes": doc.frontend_notes,
                "operation_refs": [
                    {
                        "method": operation_ref.method,
                        "path": operation_ref.path,
                        "summary": operation_ref.summary,
                    }
                    for operation_ref in doc.operation_refs
                ],
            }
            for doc in docs
        ]
        routes_payload = [
            {
                "doc_id": entry.doc_id,
                "route_name": entry.route_name,
                "path_template": entry.path_template,
                "label": entry.label,
                "section": entry.section,
            }
            for entry in route_manifest
        ]
        conversation_payload = conversation_state or {}

        return json.dumps(
            {
                "locale": locale,
                "prompt": prompt,
                "answers": answers,
                "conversation_state": conversation_payload,
                "route_manifest": routes_payload,
                "action_docs": docs_payload,
            },
            indent=2,
        )
