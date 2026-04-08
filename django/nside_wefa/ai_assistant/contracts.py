"""
Contracts used by the AI assistant module.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class AssistantInputDoc:
    """Structured description of a user input needed by an action."""

    name: str
    label: str
    description: str
    data_type: str = "string"


@dataclass(frozen=True)
class AssistantOutputDoc:
    """Structured description of an output produced by an action."""

    name: str
    description: str
    data_type: str = "string"


@dataclass(frozen=True)
class OperationRef:
    """Reference to a backend API operation relevant to an action."""

    method: str
    path: str
    summary: str = ""


@dataclass(frozen=True)
class AssistantActionDoc:
    """Reusable backend-side documentation block for a route/action."""

    doc_id: str
    title: str
    summary: str
    intents: list[str]
    examples: list[str]
    when_to_use: list[str] = field(default_factory=list)
    required_permissions: list[str] = field(default_factory=list)
    required_inputs: list[AssistantInputDoc] = field(default_factory=list)
    optional_inputs: list[AssistantInputDoc] = field(default_factory=list)
    outputs: list[AssistantOutputDoc] = field(default_factory=list)
    preconditions: list[str] = field(default_factory=list)
    frontend_notes: list[str] = field(default_factory=list)
    operation_refs: list[OperationRef] = field(default_factory=list)
