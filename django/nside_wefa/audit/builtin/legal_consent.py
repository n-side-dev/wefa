"""
Audit source for ``nside_wefa.legal_consent``.

Emits ``legal_consent.renew`` whenever a user's :class:`LegalConsent` row is
saved with a populated ``accepted_at`` field that has changed since the last
save. Pairs with catalog item E3 (versioned ToU/Privacy history) once that
ships.
"""

from typing import Any

from django.db.models.signals import post_save

from .. import api


def install() -> None:
    """Connect the legal_consent signal handler."""
    from nside_wefa.legal_consent.models import LegalConsent

    post_save.connect(
        _on_consent_saved,
        sender=LegalConsent,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.legal_consent.renew",
    )


def _on_consent_saved(sender: Any, instance: Any, created: bool, **kwargs: Any) -> None:
    # Auto-creation by the legal_consent post_save signal yields a row with
    # version=None and accepted_at=None — nothing to log there.
    if created:
        return
    if instance.accepted_at is None or instance.version is None:
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
