from django.conf import settings
from pathlib import Path


def get_document_content(filename: str, locale: str = "en") -> str:
    """Load and process the document content with templating and locale support.

    The function looks for the markdown file under a locale subfolder, e.g.:
    - <custom_templates>/<locale>/<filename>
    - <app_templates>/<locale>/<filename>
    Default locale is 'en'.
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
