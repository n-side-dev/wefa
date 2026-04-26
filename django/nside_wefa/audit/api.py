"""
Public Python API for emitting audit events.

Two surfaces:

- :func:`log` — write an explicit event (login attempts, business actions,
  permission denials, anything not tied to a model save).
- :func:`set_actor` — re-export of auditlog's context manager so consumers
  can attribute events written outside a request, e.g. inside Celery tasks.

The :class:`Outcome` enum is stored in ``LogEntry.additional_data["outcome"]``
so login successes, failures, and permission denials can co-exist in the
same table.

Failure handling is governed by ``NSIDE_WEFA.AUDIT.RAISE_ON_FAILURE`` (default
``False``): write errors are caught, logged as a warning, and :func:`log`
returns ``None``. Set the flag to ``True`` in tests to surface regressions.
"""

import enum
import logging
from typing import Any, Dict, Optional

from auditlog.context import set_actor as _auditlog_set_actor
from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.db import models

from nside_wefa.common.settings import get_section

from .settings_translation import DEFAULT_REDACT_FIELDS

logger = logging.getLogger("nside_wefa.audit")

# Sentinel distinct from ``None`` so callers can pass ``actor=None`` explicitly
# to mark a system / anonymous action.
_UNSET: Any = object()


class Outcome(str, enum.Enum):
    """Coarse-grained outcome label stored alongside each event."""

    SUCCESS = "success"
    FAILURE = "failure"
    DENIED = "denied"


class AuditWriteError(RuntimeError):
    """Raised when ``NSIDE_WEFA.AUDIT.RAISE_ON_FAILURE`` is True and a write fails."""


def set_actor(actor: Any, remote_addr: Any = None, remote_port: Any = None):
    """Re-export of :func:`auditlog.context.set_actor`.

    Importing it here means consumers don't have to import from auditlog
    directly. Used as a context manager.
    """
    return _auditlog_set_actor(actor, remote_addr=remote_addr, remote_port=remote_port)


def log(
    action: str,
    *,
    actor: Any = _UNSET,
    target: Optional[models.Model] = None,
    changes: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    outcome: Outcome = Outcome.SUCCESS,
) -> Optional[LogEntry]:
    """Write an audit event and return the resulting :class:`LogEntry`.

    :param action: Free-form action identifier, conventionally
        ``"<domain>.<verb>"`` (``"auth.login"``, ``"order.cancel"``).
    :param actor: User performing the action. Pass ``actor=None`` explicitly
        for anonymous / system actions. Omit to auto-resolve from
        ``set_actor`` / ``AuditlogMiddleware``.
    :param target: Model instance the action concerns (optional).
    :param changes: JSON-serializable dict of deltas. Sensitive keys are
        redacted via ``NSIDE_WEFA.AUDIT.REDACT_FIELDS``.
    :param metadata: Free-form JSON-serializable dict, stored under
        ``additional_data`` alongside the outcome label.
    :param outcome: One of :class:`Outcome`. Default :attr:`Outcome.SUCCESS`.
    :returns: The created :class:`LogEntry` row, or ``None`` if the write was
        soft-failed under ``RAISE_ON_FAILURE=False``.
    :raises AuditWriteError: when ``RAISE_ON_FAILURE=True`` and the write
        cannot be persisted.
    """
    section = get_section("AUDIT", default={})
    redact_fields = list(section.get("REDACT_FIELDS", DEFAULT_REDACT_FIELDS))
    raise_on_failure = bool(section.get("RAISE_ON_FAILURE", False))

    redacted_changes = _redact(changes, redact_fields) if changes else None
    redacted_metadata = _redact(metadata, redact_fields) if metadata else {}

    additional_data: Dict[str, Any] = {
        "outcome": outcome.value,
        "action": action,
    }
    if redacted_metadata:
        additional_data["metadata"] = redacted_metadata

    create_kwargs: Dict[str, Any] = {
        "action": LogEntry.Action.UPDATE,
        "additional_data": additional_data,
    }

    # The LogEntry.action column is an int enum, not the free-form string we
    # use across the WeFa surface; ``additional_data["action"]`` carries the
    # WeFa-shaped identifier for consumers and the REST API.
    if changes is not None:
        create_kwargs["changes"] = redacted_changes

    resolved_actor = _resolve_actor(actor)
    if resolved_actor is not None:
        create_kwargs["actor"] = resolved_actor

    # auditlog.LogEntry has non-nullable content_type / object_pk / object_repr.
    # When the caller doesn't supply a target, fall back through:
    # 1. the actor (the user is the implicit subject of their own action),
    # 2. a system sentinel that points at the LogEntry table itself with
    #    object_pk="0" — filterable as target_type="auditlog.logentry".
    effective_target = target if target is not None else resolved_actor
    if effective_target is not None:
        create_kwargs["content_type"] = ContentType.objects.get_for_model(
            effective_target
        )
        pk_value = effective_target.pk
        create_kwargs["object_pk"] = str(pk_value) if pk_value is not None else ""
        create_kwargs["object_id"] = pk_value if isinstance(pk_value, int) else None
        create_kwargs["object_repr"] = str(effective_target)
    else:
        # Neither target nor actor: a true system / anonymous event.
        create_kwargs["content_type"] = ContentType.objects.get_for_model(LogEntry)
        create_kwargs["object_pk"] = "0"
        create_kwargs["object_id"] = 0
        create_kwargs["object_repr"] = "system"

    try:
        return LogEntry.objects.create(**create_kwargs)
    except Exception as exc:  # noqa: BLE001 — by design; see RAISE_ON_FAILURE
        if raise_on_failure:
            raise AuditWriteError(
                f"Failed to write audit event {action!r}: {exc}"
            ) from exc
        logger.warning(
            "audit.log: failed to persist event %r (target=%r): %s",
            action,
            create_kwargs.get("object_repr"),
            exc,
        )
        return None


def _resolve_actor(actor: Any) -> Any:
    """Resolve the actor argument.

    - ``_UNSET``: defer to auditlog's middleware-set context, which is read
      at LogEntry creation time. Returning ``None`` here means "don't pass
      ``actor`` explicitly" so auditlog's own resolution kicks in.
    - ``None``: explicit "system" actor.
    - Anything else: passed through.
    """
    if actor is _UNSET:
        return None
    if actor is None:
        return None
    if not getattr(actor, "is_authenticated", True):
        # Anonymous request user: treat as system.
        return None
    return actor


def _redact(payload: Dict[str, Any], redact_fields: list) -> Dict[str, Any]:
    """Return a shallow copy of ``payload`` with sensitive values masked.

    Keys are matched case-insensitively. Nested dicts are walked recursively
    but lists and other containers are left alone — keep the surface small
    and predictable.
    """
    if not isinstance(payload, dict):
        return payload
    redact_lower = {f.lower() for f in redact_fields}
    out: Dict[str, Any] = {}
    for key, value in payload.items():
        if isinstance(key, str) and key.lower() in redact_lower:
            out[key] = "[REDACTED]"
        elif isinstance(value, dict):
            out[key] = _redact(value, redact_fields)
        else:
            out[key] = value
    return out
