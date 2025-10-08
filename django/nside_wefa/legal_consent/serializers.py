"""
LegalConsent Serializers Module

This module contains serializers for LegalConsent-related models and views.
Serializers are used to convert model instances to JSON representations
for clean API responses and OpenAPI schema generation.
"""

from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field, extend_schema_serializer

from nside_wefa.legal_consent.models.legal_consent import LegalConsent


@extend_schema_serializer(component_name="SingleRequestAnalysisViolatedConstraint")
class LegalConsentSerializer(serializers.ModelSerializer):
    """
    DRF Serializer for Legal Consent with OpenAPI schema support.

    This serializer is used for both GET and PATCH endpoints of
    LegalConsentView to return comprehensive agreement information
    including version, acceptance date, and validity status.

    Fields:
        version (int, nullable): Version of the legal documents the user consented to
        accepted_at (datetime, nullable): ISO formatted acceptance datetime
        is_valid (bool, read-only): Whether the user's legal consent is valid
    """

    valid = serializers.SerializerMethodField(
        help_text="Whether the user's legal consent is currently valid",
    )

    class Meta:
        model = LegalConsent
        fields = ["version", "accepted_at", "valid"]
        read_only_fields = ["valid"]
        extra_kwargs = {
            "version": {
                "help_text": "Version of the legal documents the user consented to",
                "allow_null": True,
            },
            "accepted_at": {
                "help_text": "Date and time of consent",
                "allow_null": True,
            },
        }

    @extend_schema_field(serializers.BooleanField())
    def get_valid(self, obj: LegalConsent) -> bool:
        """
        Determine whether the LegalConsent is valid.

        :param obj: The LegalConsent instance
        :returns: True if the consent is valid, False otherwise
        """
        return obj.is_valid()
