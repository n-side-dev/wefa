"""
Utility helpers for nside_wefa.authentication.

This module contains small helpers used by the authentication app, including
accessors for project settings.
"""

from django.conf import settings


def get_authentication_types():
    """Return the configured authentication types.

    Reads ``NSIDE_WEFA.AUTHENTICATION.TYPES`` from Django settings, which
    controls which authentication endpoints are exposed by the app.

    :return: A list of enabled authentication type identifiers (e.g., ``["TOKEN", "JWT"]``).
    """
    return settings.NSIDE_WEFA.get("AUTHENTICATION").get("TYPES")
