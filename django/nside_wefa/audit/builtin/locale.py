"""
Audit source for ``nside_wefa.locale``.

Emits ``locale.change`` whenever a user's :class:`UserLocale` row is saved
with a different ``code`` than what was previously stored. The auto-creation
of empty rows on user signup is silently ignored.
"""

from typing import Any

from django.db.models.signals import post_init, post_save

from .. import api

# Per-instance attribute we use to remember the last persisted code so
# post_save can compute a diff without making an extra DB call.
_SNAPSHOT_ATTR = "_wefa_audit_previous_code"


def install() -> None:
    """Connect the locale signal handlers."""
    from nside_wefa.locale.models import UserLocale

    post_init.connect(
        _snapshot_code,
        sender=UserLocale,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.locale.snapshot",
    )
    post_save.connect(
        _on_locale_saved,
        sender=UserLocale,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.locale.change",
    )


def _snapshot_code(sender: Any, instance: Any, **kwargs: Any) -> None:
    setattr(instance, _SNAPSHOT_ATTR, instance.code)


def _on_locale_saved(sender: Any, instance: Any, created: bool, **kwargs: Any) -> None:
    if created:
        # New row with an empty code: not interesting.
        if instance.code is None:
            setattr(instance, _SNAPSHOT_ATTR, instance.code)
            return

    previous = getattr(instance, _SNAPSHOT_ATTR, None)
    current = instance.code
    if previous == current:
        return

    api.log(
        "locale.change",
        actor=instance.user,
        target=instance,
        changes={"code": {"from": previous, "to": current}},
    )
    setattr(instance, _SNAPSHOT_ATTR, current)
