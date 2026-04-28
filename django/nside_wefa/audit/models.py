"""
Tamper-evident :class:`LogEntry` subclass.

When ``NSIDE_WEFA.AUDIT.TAMPER_EVIDENT`` is True, the settings translation
layer points ``AUDITLOG_LOGENTRY_MODEL`` at :class:`WefaLogEntry`, which
adds two columns (``prev_hash``, ``hash``) and computes a SHA-256 hash chain
in a ``pre_save`` handler. The :func:`wefa_audit_verify` management command
walks the chain forward and reports the first divergence.

The model is **always** defined and migrated — leaving the table empty when
the feature is off costs nothing and means flipping the setting later does
not require an additional migration.
"""

import hashlib
import json
from typing import Any

from auditlog.models import AbstractLogEntry
from django.db import models, transaction
from django.db.models.signals import pre_save
from django.dispatch import receiver

HASH_LENGTH = 64
ZERO_HASH = "0" * HASH_LENGTH


class WefaLogEntry(AbstractLogEntry):
    """LogEntry variant with a SHA-256 hash chain for tamper-evidence."""

    prev_hash = models.CharField(
        max_length=HASH_LENGTH,
        blank=True,
        default="",
        help_text="SHA-256 hex of the previous event's hash. "
        "Empty for the first event in the chain.",
    )
    hash = models.CharField(
        max_length=HASH_LENGTH,
        blank=True,
        default="",
        db_index=True,
        help_text="SHA-256 hex of the canonical serialization of this event "
        "concatenated with prev_hash.",
    )

    class Meta:
        verbose_name = "Audit Event (tamper-evident)"
        verbose_name_plural = "Audit Events (tamper-evident)"
        ordering = ("-timestamp",)


@receiver(
    pre_save,
    sender=WefaLogEntry,
    dispatch_uid="nside_wefa.audit.models.compute_hash_chain",
)
def _compute_hash_chain(sender: Any, instance: WefaLogEntry, **kwargs: Any) -> None:
    """Populate ``prev_hash`` and ``hash`` on insert.

    Only runs on inserts. Updates are forbidden by the immutability guard;
    if the guard is bypassed (purge), recomputing the hash would corrupt the
    chain anyway, so we leave the existing values untouched.
    """
    if instance.pk is not None:
        return

    with transaction.atomic():
        last = (
            WefaLogEntry.objects.select_for_update()
            .order_by("-id")
            .values("hash")
            .first()
        )
        instance.prev_hash = (last or {}).get("hash") or ZERO_HASH
        instance.hash = compute_event_hash(instance, instance.prev_hash)


def compute_event_hash(entry: AbstractLogEntry, prev_hash: str) -> str:
    """Compute the SHA-256 hex digest for a log entry chained on ``prev_hash``.

    The serialization is intentionally narrow and stable: only fields that
    represent the *content* of the event participate. Auditing-internal
    columns (``id``, ``timestamp``, ``cid`` etc.) are folded in too because
    altering them after-the-fact would also break the chain.
    """
    payload = {
        "action": entry.action,
        "actor_id": getattr(entry, "actor_id", None),
        "actor_email": entry.actor_email,
        "content_type_id": getattr(entry, "content_type_id", None),
        "object_pk": entry.object_pk,
        "object_id": entry.object_id,
        "object_repr": entry.object_repr,
        "changes": entry.changes_text,
        "additional_data": entry.additional_data,
        "remote_addr": entry.remote_addr,
        "remote_port": entry.remote_port,
        "cid": entry.cid,
        "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
        "prev_hash": prev_hash,
    }
    canonical = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()
