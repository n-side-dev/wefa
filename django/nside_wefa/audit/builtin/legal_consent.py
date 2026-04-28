"""
Audit source for ``nside_wefa.legal_consent``.

Emits ``legal_consent.renew`` only when a user's :class:`LegalConsent` row is
saved with a ``(version, accepted_at)`` pair that differs from what was
previously persisted. Saving the same row twice (or just touching unrelated
fields) does not produce a duplicate event. Pairs with catalog item E3
(versioned ToU/Privacy history) once that ships.
"""

from typing import Any

from django.db.models.signals import post_init, post_save

from .. import api

# Per-instance attribute used to remember the last-loaded (version, accepted_at)
# tuple so post_save can compute a diff without an extra DB call.
_SNAPSHOT_ATTR = "_wefa_audit_previous_consent"


def install() -> None:
    """Connect the legal_consent signal handlers."""
    from nside_wefa.legal_consent.models import LegalConsent

    post_init.connect(
        _snapshot_consent,
        sender=LegalConsent,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.legal_consent.snapshot",
    )
    post_save.connect(
        _on_consent_saved,
        sender=LegalConsent,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.legal_consent.renew",
    )


def _snapshot_consent(sender: Any, instance: Any, **kwargs: Any) -> None:
    setattr(instance, _SNAPSHOT_ATTR, (instance.version, instance.accepted_at))


def _on_consent_saved(sender: Any, instance: Any, created: bool, **kwargs: Any) -> None:
    # Auto-creation by the legal_consent post_save signal yields a row with
    # version=None and accepted_at=None — nothing to log there.
    if instance.accepted_at is None or instance.version is None:
        setattr(instance, _SNAPSHOT_ATTR, (instance.version, instance.accepted_at))
        return

    previous = getattr(instance, _SNAPSHOT_ATTR, (None, None))
    current = (instance.version, instance.accepted_at)
    if previous == current:
        return

    api.log(
        "legal_consent.renew",
        actor=instance.user,
        target=instance,
        metadata={
            "version": instance.version,
            "accepted_at": instance.accepted_at.isoformat(),
        },
    )
    setattr(instance, _SNAPSHOT_ATTR, current)
