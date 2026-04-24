"""
Models for the nside_wefa.locale app.

This module defines the UserLocale model used to persist each user's
preferred locale code and provides a signal to automatically create a row on
user creation.
"""

from typing import Any, List, TypedDict, cast

from django.conf import settings
from django.db import models
from django.db.models import signals


class _LocaleSettingsDict(TypedDict):
    AVAILABLE: List[str]
    DEFAULT: str


class _NsideWefaSettings(TypedDict):
    LOCALE: _LocaleSettingsDict


class _LocaleConfiguration:
    """
    Private class to handle Locale configuration from Django settings.

    This class initializes itself by reading the NSIDE_WEFA.LOCALE setting
    and populates ``available`` and ``default`` attributes from the section.
    """

    def __init__(self) -> None:
        """Initialize the Locale configuration from Django settings.

        Note: Configuration validation is handled by Django system checks.
        """
        nside_wefa_settings = cast(_NsideWefaSettings, settings.NSIDE_WEFA)
        configuration = nside_wefa_settings["LOCALE"]
        self.available = list(configuration["AVAILABLE"])
        self.default = configuration["DEFAULT"]


class UserLocale(models.Model):
    """
    UserLocale model to track each user's preferred locale.

    This model maintains a one-to-one relationship with Django's User model
    so that a single locale code is stored per user. ``code`` is nullable
    because a user may not yet have made a choice; resolution logic on the
    frontend falls back to browser/default behaviour in that case.

    :param user: One-to-one relationship with the configured User model
    :param code: BCP-47 style locale code (e.g. ``"en"``, ``"fr-BE"``)
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        help_text="User whose preferred locale is tracked.",
    )
    code = models.CharField(
        max_length=16,
        blank=True,
        null=True,
        help_text="BCP-47 style locale code (e.g. 'en', 'fr-BE').",
    )

    class Meta:
        verbose_name = "User Locale"
        verbose_name_plural = "User Locales"

    def __str__(self) -> str:
        return f"User Locale for {self.user.username}"


def create_user_locale(
    sender: type[models.Model], instance: Any, created: bool, **kwargs: Any
) -> None:
    """Signal handler that creates a UserLocale row when a new User is created."""
    if created:
        UserLocale.objects.create(user=instance)


# Registers the signal to run create_user_locale() when a User is created.
signals.post_save.connect(
    create_user_locale,
    sender=settings.AUTH_USER_MODEL,
    weak=False,
    dispatch_uid="models.create_user_locale",
)
