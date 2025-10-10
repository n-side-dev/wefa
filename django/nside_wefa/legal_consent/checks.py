"""
System checks for the nside_wefa.legal_consent app.

This module registers Django system checks to validate:

- Application load order (``nside_wefa.common`` before ``nside_wefa.legal_consent``)
- Presence and structure of the ``NSIDE_WEFA.LEGAL_CONSENT`` settings
- Availability of required legal document templates when a custom templates
  directory is configured

See also
- Django system check framework: https://docs.djangoproject.com/en/stable/topics/checks/
"""

from typing import Any
from pathlib import Path
from django.conf import settings
from django.core.checks import Error, register

from nside_wefa.common.apps import CommonConfig
from nside_wefa.legal_consent.apps import LegalConsentConfig
from utils.checks import check_nside_wefa_settings, check_apps_dependencies_order


@register()
def wefa_apps_dependencies_check(app_configs, **kwargs) -> list[Error]:
    """Validate app dependency order in ``INSTALLED_APPS`` for LegalConsent.

    Ensures that ``nside_wefa.common`` is listed before ``nside_wefa.legal_consent``
    in the Django ``INSTALLED_APPS`` setting.

    :param app_configs: Iterable of Django app configs provided by the
        check framework. Unused in this implementation.
    :type app_configs: Iterable[django.apps.AppConfig] | None
    :param kwargs: Additional keyword arguments provided by Django. Unused.
    :return: A list of errors describing missing apps or ordering violations.
    :rtype: list[django.core.checks.Error]
    """
    dependencies = [CommonConfig.name, LegalConsentConfig.name]
    return check_apps_dependencies_order(dependencies)


@register()
def legal_consent_settings_check(app_configs, **kwargs) -> list[Error]:
    """Validate the ``NSIDE_WEFA.LEGAL_CONSENT`` settings section.

    Delegates to :func:`utils.checks.check_nside_wefa_settings` to ensure that
    the section exists and contains required keys: ``VERSION`` and ``EXPIRY_LIMIT``.

    :param app_configs: Iterable of Django app configs provided by the check
        framework. Unused in this implementation.
    :type app_configs: Iterable[django.apps.AppConfig] | None
    :param kwargs: Additional keyword arguments provided by Django. Unused.
    :return: A list of configuration errors. Empty if properly configured.
    :rtype: list[django.core.checks.Error]
    """
    return check_nside_wefa_settings(
        section_name="LEGAL_CONSENT", required_keys=["VERSION", "EXPIRY_LIMIT"]
    )


@register()
def legal_templates_files_check(app_configs, **kwargs) -> list[Error]:
    """Ensure required legal template files exist when a custom directory is set.

    When ``NSIDE_WEFA.LEGAL_CONSENT.TEMPLATES`` points to a directory, this
    check verifies that both ``privacy_notice.md`` and ``terms_of_use.md`` exist
    in that directory.

    :param app_configs: Iterable of Django app configs provided by the check
        framework. Unused in this implementation.
    :type app_configs: Iterable[django.apps.AppConfig] | None
    :param kwargs: Additional keyword arguments provided by Django. Unused.
    :return: A list of errors for missing required template files.
    :rtype: list[django.core.checks.Error]
    """
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
