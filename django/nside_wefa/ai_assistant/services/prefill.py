"""
Deterministic prefill helpers used to stabilize provider output.
"""

from __future__ import annotations

import re
from typing import Any

from nside_wefa.ai_assistant.contracts import AssistantActionDoc


def enrich_recipe_prefills(
    payload: dict[str, Any],
    *,
    prompt: str,
    docs_by_id: dict[str, AssistantActionDoc],
    conversation_state: dict[str, Any] | None = None,
    answers: list[str] | None = None,
) -> dict[str, Any]:
    """Backfill obvious form-prefill values when the provider omits them."""
    if payload.get("status") != "recipe":
        return payload

    extracted_inputs = extract_known_inputs(
        prompt=prompt,
        conversation_state=conversation_state,
        answers=answers or [],
    )
    if not extracted_inputs:
        return payload

    for step in payload.get("steps", []):
        target = step.get("target")
        if not isinstance(target, dict):
            continue

        doc_id = str(target.get("doc_id", "")).strip()
        action_doc = docs_by_id.get(doc_id)
        if not action_doc:
            continue

        allowed_input_names = {
            input_doc.name
            for input_doc in [*action_doc.required_inputs, *action_doc.optional_inputs]
        }
        if not allowed_input_names:
            continue

        query = target.get("query")
        if not isinstance(query, dict):
            query = {}

        normalized_query = {
            str(key): str(value) for key, value in query.items() if str(value).strip()
        }
        for input_name, input_value in extracted_inputs.items():
            if input_name not in allowed_input_names:
                continue
            if input_name in normalized_query:
                continue
            normalized_query[input_name] = input_value

        target["query"] = normalized_query

    return payload


def extract_known_inputs(
    *,
    prompt: str,
    conversation_state: dict[str, Any] | None,
    answers: list[str],
) -> dict[str, str]:
    """Extract common form values directly from the prompt and clarifications."""
    extracted: dict[str, str] = {}

    for input_name in (
        "name",
        "product",
        "category",
        "price",
        "stock",
        "quantity",
        "description",
    ):
        input_value = _extract_input_value(prompt, input_name)
        if input_value:
            extracted[input_name] = input_value

    if "name" in extracted and "product" not in extracted:
        extracted["product"] = extracted["name"]

    if conversation_state and conversation_state.get("kind") == "product_category":
        product_name = str(conversation_state.get("product_name", "")).strip()
        if product_name and "name" not in extracted:
            extracted["name"] = product_name

        clarified_category = answers[0].strip() if answers else ""
        if clarified_category and "category" not in extracted:
            extracted["category"] = clarified_category

    return extracted


def _extract_input_value(prompt: str, input_name: str) -> str:
    """Extract a known input value from a natural-language prompt."""
    patterns_by_input = {
        "name": (
            r"(?:named|called)\s+[\"']?(?P<value>.+?)[\"']?(?=(?:\s+(?:with|in|for|that|which|category|priced|price|stock|description|and|then)\b)|[.!,]|$)",
        ),
        "product": (
            r"(?:add|put|place|buy|get)\s+(?P<value>.+?)(?=\s+(?:with\s+(?:a\s+)?quantity|quantity|qty|to|into|in)\b)",
        ),
        "category": (
            r"(?:in\s+category|category(?:\s+(?:being|is|of))?)\s+[\"']?(?P<value>.+?)[\"']?(?=(?:\s+(?:with|for|priced|price|stock|description|and|then)\b)|[.!,]|$)",
        ),
        "price": (
            r"(?:priced\s+at|price(?:\s+is)?|costing)\s+[\"']?(?P<value>.+?)[\"']?(?=(?:\s+(?:with|for|stock|description|and|then)\b)|[.!,]|$)",
        ),
        "stock": (
            r"(?:stock(?:\s+of)?|inventory(?:\s+of)?)\s+[\"']?(?P<value>.+?)[\"']?(?=(?:\s+(?:with|for|description|and|then)\b)|[.!,]|$)",
        ),
        "quantity": (
            r"(?:quantity|qty)\s+(?:of\s+)?[\"']?(?P<value>\d+)[\"']?(?=(?:\s+(?:for|and|then|to)\b)|[.!,]|$)",
        ),
        "description": (
            r"(?:description(?:\s+is)?|described\s+as)\s+[\"']?(?P<value>.+?)[\"']?(?=(?:\s+(?:with|for|and|then)\b)|[.!,]|$)",
        ),
    }

    for pattern in patterns_by_input.get(input_name, ()):
        match = re.search(pattern, prompt, re.IGNORECASE)
        if not match:
            continue

        return _clean_extracted_value(match.group("value"))

    return ""


def _clean_extracted_value(value: str) -> str:
    """Normalize a regex-extracted prompt value."""
    normalized_value = value.strip().strip("\"'").strip().rstrip(".,!?:;")
    return re.sub(r"^(?:a|an|the)\s+", "", normalized_value, flags=re.IGNORECASE)
