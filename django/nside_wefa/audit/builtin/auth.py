"""
Audit source for ``django.contrib.auth``.

Logs login successes, login failures, and logouts as audit events. Hooks are
installed on Django's built-in ``user_logged_in`` / ``user_logged_out`` /
``user_login_failed`` signals so any auth backend (DRF token, JWT, session)
that emits them is covered automatically.
"""

from typing import Any

from django.contrib.auth.signals import (
    user_logged_in,
    user_logged_out,
    user_login_failed,
)

from .. import api


def install() -> None:
    """Connect the auth signal handlers."""
    user_logged_in.connect(
        _on_login,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.auth.login",
    )
    user_logged_out.connect(
        _on_logout,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.auth.logout",
    )
    user_login_failed.connect(
        _on_login_failed,
        weak=False,
        dispatch_uid="nside_wefa.audit.builtin.auth.login_failed",
    )


def _on_login(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    api.log("auth.login", actor=user, target=user, outcome=api.Outcome.SUCCESS)


def _on_logout(sender: Any, request: Any, user: Any, **kwargs: Any) -> None:
    api.log("auth.logout", actor=user, target=user, outcome=api.Outcome.SUCCESS)


def _on_login_failed(sender: Any, credentials: Any, **kwargs: Any) -> None:
    # ``credentials`` is the raw login dict; never log its values — even the
    # username may be sensitive in some deployments. Stick to a count-only
    # event with the supplied username (truncated) in metadata.
    username = ""
    if isinstance(credentials, dict):
        username = str(credentials.get("username", ""))[:150]
    api.log(
        "auth.login_failed",
        actor=None,
        outcome=api.Outcome.FAILURE,
        metadata={"username": username} if username else None,
    )
