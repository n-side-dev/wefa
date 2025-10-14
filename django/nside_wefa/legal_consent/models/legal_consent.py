"""
Models for the nside_wefa.legal_consent app.

This module defines the LegalConsent model used to track a user's acceptance
of legal documents (e.g., privacy notice and terms of use) and provides
helpers to manage validity and automatic creation on user signup.
"""

import datetime
from typing import Any, TypedDict, cast

from django.conf import settings
from django.db import models
from django.db.models import signals


class _LegalConsentSettingsDict(TypedDict):
    VERSION: int
    EXPIRY_LIMIT: int


class _NsideWefaSettings(TypedDict):
    LEGAL_CONSENT: _LegalConsentSettingsDict


class _LegalConsentConfiguration:
    """
    Private class to handle LegalConsent configuration from Django settings.

    This class initializes itself by reading the NSIDE_WEFA.LEGAL_CONSENT setting
    and populates version and expiry_limit attributes from the settings content.
    """

    def __init__(self) -> None:
        """
        Initialize the LegalConsent configuration from Django settings.

        Note: Configuration validation is handled by Django system checks.
        """
        nside_wefa_settings = cast(_NsideWefaSettings, settings.NSIDE_WEFA)
        configuration = nside_wefa_settings["LEGAL_CONSENT"]
        self.version = configuration["VERSION"]
        self.expiry_limit = configuration["EXPIRY_LIMIT"]


class LegalConsent(models.Model):
    """
    LegalConsent model to track user consent for data processing.

    This model maintains a one-to-one relationship with Django's User model
    to store consent information such as version and consent date.

    :param user: One-to-one relationship with the user provided User model
    :param version: Version of the documents the user consented to (optional)
    :param accepted_at: When the user consented to the documents (optional)
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        help_text="User who provided legal consent",
    )
    version = models.IntegerField(
        blank=True, null=True, help_text="Version of the consented legal documents"
    )
    accepted_at = models.DateTimeField(
        blank=True, null=True, help_text="Date of the consent"
    )

    class Meta:
        verbose_name = "Legal Consent"
        verbose_name_plural = "Legal Consents"

    def __str__(self) -> str:
        return f"Legal Consent for {self.user.username}"

    def renew(self) -> None:
        """
        Renew the Legal Consent by updating to the current version and setting the consent date.

        This method updates the agreement to the current legal documents version as defined in
        Django settings and sets the accepted_at date to the current time.
        The expiry is calculated dynamically based on accepted_at + expiry_limit.
        The instance is automatically saved to the database.
        """
        configuration = _LegalConsentConfiguration()

        self.version = configuration.version
        self.accepted_at = datetime.datetime.now(tz=datetime.timezone.utc)
        self.save()

    def is_valid(self) -> bool:
        """
        Check if the LegalConsent is still valid and up to date.

        An agreement is considered valid if:
        1. The acceptance date plus expiry limit has not passed
        2. The consented legal documents version matches the legal documents version in settings

        :returns: True if the agreement is valid and current, False otherwise
        """
        configuration = _LegalConsentConfiguration()

        if not self.accepted_at or not self.version:
            return False

        expiry_date = self.accepted_at + datetime.timedelta(
            days=configuration.expiry_limit
        )
        return (
            expiry_date > datetime.datetime.now(tz=datetime.timezone.utc)
            and self.version == configuration.version
        )


def create_legal_consent(
    sender: type[models.Model], instance: Any, created: bool, **kwargs: Any
) -> None:
    """
    Signal handler that creates a LegalConsent when a new User is created.
    """
    if created:
        LegalConsent.objects.create(user=instance)


# Registers the signal to run create_legal_consent() function when a User is created.
signals.post_save.connect(
    create_legal_consent,
    sender=settings.AUTH_USER_MODEL,
    weak=False,
    dispatch_uid="models.create_legal_consent",
)
