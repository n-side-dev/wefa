from typing import Any
from pathlib import Path
from django.conf import settings
from django.core.checks import Error, register

from nside_wefa.common.apps import CommonConfig
from nside_wefa.legal_consent.apps import LegalConsentConfig
from utils.checks import check_nside_wefa_settings, check_apps_dependencies_order


@register()
def wefa_apps_dependencies_check(app_configs, **kwargs) -> list[Error]:
    # Check INSTALLED_APPS ordering - common must come before gdpr
    dependencies = [CommonConfig.name, LegalConsentConfig.name]
    return check_apps_dependencies_order(dependencies)


@register()
def legal_consent_settings_check(app_configs, **kwargs) -> list[Error]:
    return check_nside_wefa_settings(
        section_name="LEGAL_CONSENT", required_keys=["VERSION", "EXPIRY_LIMIT"]
    )


@register()
def legal_templates_files_check(app_configs, **kwargs) -> list[Error]:
    """Check that required markdown files exist when TEMPLATES setting is present."""
    errors: list[Error] = []

    nside_wefa_settings: Any = getattr(settings, "NSIDE_WEFA", None)
    legal_consent_settings: Any = (
        nside_wefa_settings.get("LEGAL_CONSENT") if nside_wefa_settings else None
    )

    if legal_consent_settings:
        # If LEGAL_CONSENT settings don't exist, this will be caught by legal_consent_settings_check
        legal_templates = legal_consent_settings.get("TEMPLATES")

        if legal_templates:
            # TEMPLATES setting is present, check for required files
            template_dir = Path(legal_templates)
            required_files = ["privacy_notice.md", "terms_of_use.md"]

            for filename in required_files:
                file_path = template_dir / filename
                if not file_path.exists():
                    errors.append(
                        Error(
                            f"Required legal template file '{filename}' not found at '{file_path}'. "
                            f"When NSIDE_WEFA.LEGAL_CONSENT.TEMPLATES is set to '{legal_templates}', "
                            f"both 'privacy_notice.md' and 'terms_of_use.md' must be present.",
                        )
                    )

    return errors
