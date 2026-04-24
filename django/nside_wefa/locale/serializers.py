"""
Locale Serializers Module

This module contains serializers for Locale-related models and views.
Serializers are used to convert model instances to JSON representations
for clean API responses and OpenAPI schema generation.
"""

from typing import Any

from rest_framework import serializers
from drf_spectacular.utils import extend_schema_serializer

from nside_wefa.locale.models.user_locale import UserLocale, _LocaleConfiguration


@extend_schema_serializer(component_name="UserLocale")
class UserLocaleSerializer(serializers.ModelSerializer):
    """
    DRF Serializer for UserLocale with OpenAPI schema support.

    This serializer is used for both GET and PATCH endpoints of
    :class:`nside_wefa.locale.views.UserLocaleView`. It exposes the single
    ``code`` field and rejects values that are not members of
    ``NSIDE_WEFA.LOCALE.AVAILABLE``.
    """

    class Meta:
        model = UserLocale
        fields = ["code"]
        extra_kwargs = {
            "code": {
                "help_text": "Preferred locale code for the authenticated user. "
                "Must be one of the codes listed in NSIDE_WEFA.LOCALE.AVAILABLE.",
                "allow_null": True,
            },
        }

    def validate_code(self, value: Any) -> Any:
        """Ensure the submitted ``code`` is one of the configured locales."""
        if value is None:
            return value

        configuration = _LocaleConfiguration()
        if value not in configuration.available:
            raise serializers.ValidationError(
                f"'{value}' is not a supported locale. "
                f"Expected one of {configuration.available}."
            )
        return value


@extend_schema_serializer(component_name="AvailableLocales")
class AvailableLocalesSerializer(serializers.Serializer):
    """Serializer describing the response of ``GET /locale/available/``."""

    available = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of locale codes supported by this project.",
    )
    default = serializers.CharField(
        help_text="Default locale code used when no user preference is known.",
    )
