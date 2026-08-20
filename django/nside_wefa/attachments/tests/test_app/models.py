"""Concrete :class:`Attachment` subclasses used by the attachments test suite.

Three flavours, each exercising a different configuration:

- :class:`SingletonPdfAttachment` — singleton + versioned (contract-style).
- :class:`MultiImageAttachment` — multi + versioned (issue-style).
- :class:`AvatarAttachment` — singleton + non-versioned (avatar-style).
"""

from django.conf import settings
from django.db import models

from nside_wefa.attachments.models import Attachment


class SingletonPdfAttachment(Attachment):
    """Singleton, versioned PDF — exercises the contract path."""

    versioning_enabled = True
    allowed_content_types = ["application/pdf"]
    max_size = 5 * 1024 * 1024
    upload_path_prefix = "test-singleton/"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="+",
    )


class MultiImageAttachment(Attachment):
    """Multi, versioned image — exercises the issue path."""

    versioning_enabled = True
    allowed_content_types = ["image/png", "image/jpeg"]
    max_size = 2 * 1024 * 1024
    upload_path_prefix = "test-multi/"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="+",
    )


class AvatarAttachment(Attachment):
    """Singleton, non-versioned image — exercises replace-in-place."""

    versioning_enabled = False
    allowed_content_types = ["image/png", "image/jpeg"]
    max_size = 2 * 1024 * 1024
    upload_path_prefix = "test-avatars/"

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="test_avatar",
    )
