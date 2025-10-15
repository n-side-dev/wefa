from django.conf import settings
from pathlib import Path

"""
Utilities for serving Legal Consent markdown documents.

This module provides helpers to load the Privacy Notice and Terms of Use
markdown templates, apply simple templating (e.g., application name), and
return them as plain text.
"""


def get_document_content(filename: str, locale: str = "en") -> str:
    """Load a legal document template and apply simple templating.

    The function attempts to read the specified markdown file either from a
    custom directory defined in ``NSIDE_WEFA.LEGAL_CONSENT.TEMPLATES`` or from
    the app's default templates directory. It replaces the ``{{app_name}}`` token
    with the value of ``NSIDE_WEFA.APP_NAME`` (defaults to ``"Application"``).

    :param filename: Template file name (e.g., ``"privacy_notice.md"``).
    :param locale: Locale for which to fetch the templates
    :return: The processed template content as text. If the file is not found,
        an error message indicating the missing path is returned.
    """

    # Check for LegalConsent-specific TEMPLATES setting
    legal_consent_settings = getattr(settings, "NSIDE_WEFA", {}).get(
        "LEGAL_CONSENT", {}
    )
    legal_templates = legal_consent_settings.get("TEMPLATES")

    if legal_templates:
        # Use specific template directory
        template_path = Path(legal_templates) / locale / filename
    else:
        # Use default template from the LegalConsent app
        template_path = Path(__file__).parent.parent / "templates" / locale / filename

    # Read the template content
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        # Return a default error message if template file is not found
        content = f"Error: Template file '{filename}' not found at '{template_path}'."

    # Apply templating
    app_name = getattr(settings, "NSIDE_WEFA", {}).get("APP_NAME", "Application")

    content = content.replace("{{app_name}}", app_name)

    return content
