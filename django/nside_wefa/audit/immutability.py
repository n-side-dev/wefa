"""
Immutability guard for ``auditlog.models.LogEntry``.

Audit events should be append-only. Auditlog leaves enforcement to convention
— WeFa adds belt-and-suspenders guards that raise loudly on any attempt to
update or delete an existing event. The retention purge command (and any
future tooling that legitimately needs to delete rows) sets a per-call
``_wefa_purge`` flag to bypass the guard.

Operators of regulated deployments are still encouraged to ``REVOKE UPDATE,
DELETE`` at the database level; this is documented in the README.
"""

from contextlib import contextmanager
from typing import Any, Iterator

from django.db.models.signals import pre_delete, pre_save


class AuditEventImmutableError(RuntimeError):
    """Raised when code attempts to mutate or delete an existing audit event."""


# Module-level flag flipped by the purge context manager. Module scope means a
# concurrent purge in another thread would also bypass — acceptable because
# the management command runs in a single process.
_purge_in_progress = False


@contextmanager
def allow_purge() -> Iterator[None]:
    """Context manager used by ``wefa_audit_purge`` to permit deletion."""
    global _purge_in_progress
    previous = _purge_in_progress
    _purge_in_progress = True
    try:
        yield
    finally:
        _purge_in_progress = previous


def install_guards() -> None:
    """Connect the pre_save / pre_delete handlers.

    Called once from ``AuditConfig.ready()``. Idempotent because Django's
    signal connect uses a ``dispatch_uid``. The guards are installed on every
    concrete subclass of ``AbstractLogEntry`` so they apply to the
    tamper-evident :class:`~nside_wefa.audit.models.WefaLogEntry` too.
    """
    from auditlog.models import AbstractLogEntry

    senders = [
        cls
        for cls in _all_concrete_subclasses(AbstractLogEntry)
        if cls is not AbstractLogEntry
    ]
    for sender in senders:
        pre_save.connect(
            _forbid_update,
            sender=sender,
            weak=False,
            dispatch_uid=f"nside_wefa.audit.immutability.forbid_update.{sender.__name__}",
        )
        pre_delete.connect(
            _forbid_delete,
            sender=sender,
            weak=False,
            dispatch_uid=f"nside_wefa.audit.immutability.forbid_delete.{sender.__name__}",
        )


def _all_concrete_subclasses(cls):
    """Walk the subclass tree, yielding concrete subclasses."""
    for sub in cls.__subclasses__():
        if not getattr(sub._meta, "abstract", False):
            yield sub
        yield from _all_concrete_subclasses(sub)


def _forbid_update(sender: Any, instance: Any, **kwargs: Any) -> None:
    if instance.pk is not None and not _purge_in_progress:
        raise AuditEventImmutableError(
            "Audit events are append-only; updating an existing LogEntry is forbidden."
        )


def _forbid_delete(sender: Any, instance: Any, **kwargs: Any) -> None:
    if not _purge_in_progress:
        raise AuditEventImmutableError(
            "Audit events are append-only; deleting a LogEntry is forbidden "
            "outside of `wefa_audit_purge`."
        )
