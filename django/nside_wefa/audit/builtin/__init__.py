"""
Built-in audit event sources for the rest of the WeFa toolkit.

Each source lives in its own submodule and is gated on:
1. its source app being in ``INSTALLED_APPS`` (so the audit app stays
   installable standalone), and
2. its name being listed in ``NSIDE_WEFA.AUDIT.BUILTIN_SOURCES`` (default:
   all of them).

Adding a new source is a two-line change: define an ``install()`` function in
a new submodule and add its name to :data:`KNOWN_SOURCES`.
"""

import importlib
import logging
from typing import Tuple

from django.apps import apps as django_apps

from nside_wefa.common.settings import get_section

logger = logging.getLogger("nside_wefa.audit")

# Source name → (Django app label that must be installed, importable submodule).
KNOWN_SOURCES: dict[str, Tuple[str, str]] = {
    "auth": ("auth", "nside_wefa.audit.builtin.auth"),
    "legal_consent": (
        "nside_wefa.legal_consent",
        "nside_wefa.audit.builtin.legal_consent",
    ),
    "locale": ("nside_wefa.locale", "nside_wefa.audit.builtin.locale"),
}

# Default value used when ``NSIDE_WEFA.AUDIT.BUILTIN_SOURCES`` is not set.
_DEFAULT_SOURCES = list(KNOWN_SOURCES)


def install_builtin_sources() -> None:
    """Wire the configured built-in sources.

    Called once from :meth:`AuditConfig.ready`. Sources whose source app is
    not installed are silently skipped so audit can be installed standalone
    without forcing the rest of the toolkit on consumers.
    """
    section = get_section("AUDIT", default={})
    requested = section.get("BUILTIN_SOURCES", _DEFAULT_SOURCES)

    for source_name in requested:
        try:
            required_app, module_path = KNOWN_SOURCES[source_name]
        except KeyError:
            # Should be caught by audit_settings_check but stay defensive.
            logger.warning("Unknown WeFa audit source %r, skipping.", source_name)
            continue

        if not _is_app_installed(required_app):
            continue

        try:
            module = importlib.import_module(module_path)
        except ImportError as exc:
            logger.warning(
                "Could not import audit source %r (%s): %s",
                source_name,
                module_path,
                exc,
            )
            continue

        installer = getattr(module, "install", None)
        if installer is None:
            logger.warning("Audit source %r has no install() entry point.", source_name)
            continue
        installer()


def _is_app_installed(app_label_or_name: str) -> bool:
    """Return True if Django knows about ``app_label_or_name``.

    Accepts either the dotted name (``"nside_wefa.locale"``) or the short
    label (``"locale"``) so the source registry can use whichever is more
    natural.
    """
    try:
        django_apps.get_app_config(app_label_or_name.split(".")[-1])
        return True
    except LookupError:
        return any(
            cfg.name == app_label_or_name for cfg in django_apps.get_app_configs()
        )
