"""
Simple deterministic retrieval for assistant planning.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from nside_wefa.ai_assistant.contracts import AssistantActionDoc


@dataclass(frozen=True)
class AssistantRouteManifestEntry:
    """Compact frontend route metadata used during backend retrieval."""

    doc_id: str
    route_name: str
    path_template: str
    label: str
    section: str


TOKEN_PATTERN = re.compile(r"[a-z0-9]{3,}")


def _tokenize(value: str) -> set[str]:
    return set(TOKEN_PATTERN.findall(value.lower()))


def _score_doc(
    prompt_terms: set[str], doc: AssistantActionDoc, route_label: str
) -> int:
    haystack = " ".join(
        [
            doc.title,
            doc.summary,
            route_label,
            *doc.intents,
            *doc.examples,
            *doc.when_to_use,
            *doc.frontend_notes,
            *(input_doc.name for input_doc in doc.required_inputs),
            *(input_doc.label for input_doc in doc.required_inputs),
            *(input_doc.name for input_doc in doc.optional_inputs),
            *(input_doc.label for input_doc in doc.optional_inputs),
        ]
    ).lower()
    title_terms = _tokenize(doc.title)
    return sum(
        2 if term in title_terms else 1 for term in prompt_terms if term in haystack
    )


def select_candidate_docs(
    prompt: str,
    docs: list[AssistantActionDoc],
    manifest_by_doc_id: dict[str, AssistantRouteManifestEntry],
    max_candidates: int,
) -> list[AssistantActionDoc]:
    """Return the most relevant visible docs for a prompt."""
    prompt_terms = _tokenize(prompt)
    scored_docs = sorted(
        docs,
        key=lambda doc: (
            _score_doc(prompt_terms, doc, manifest_by_doc_id[doc.doc_id].label),
            doc.title.lower(),
        ),
        reverse=True,
    )
    return scored_docs[:max_candidates]
