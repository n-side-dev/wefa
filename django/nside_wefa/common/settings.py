"""
Shared, typed accessor for the ``NSIDE_WEFA`` settings dictionary.

This module is the single entry point new WeFa apps should use to read their
section of the project's ``NSIDE_WEFA`` settings. It returns plain dicts (not
ad-hoc ``_Configuration`` classes) so callers can apply their own ``TypedDict``
casts when needed and so the reader stays free of any per-app coupling.

Validation of the contents is intentionally **not** done here — that lives in
each app's ``checks.py`` so configuration mistakes surface at ``manage.py
check`` time, not lazily at first-read time.
"""

from typing import Any, Mapping

from django.conf import settings


_SENTINEL: Any = object()


def get_section(section_name: str, default: Any = _SENTINEL) -> Mapping[str, Any]:
    """Return the ``NSIDE_WEFA[<section_name>]`` mapping.

    :param section_name: The subsection key under ``NSIDE_WEFA`` (e.g. ``"AUDIT"``).
    :param default: Returned when the section is absent. If omitted, an empty
        dict is returned, which is the right shape for "all keys optional"
        sections like the audit app.
    :raises KeyError: Never. Missing sections return ``default``.
    """
    nside_wefa: Any = getattr(settings, "NSIDE_WEFA", None) or {}
    section = nside_wefa.get(section_name)
    if section is None:
        return {} if default is _SENTINEL else default
    return section


def get_value(section_name: str, key: str, default: Any = None) -> Any:
    """Return ``NSIDE_WEFA[<section_name>][<key>]`` or ``default`` if absent."""
    section = get_section(section_name, default={})
    return section.get(key, default)
