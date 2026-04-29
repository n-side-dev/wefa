"""Demo: how to add a user avatar with the WeFa attachments app.

This module shows the **singleton, non-versioned** mode of the
attachments library — ideal for "one-of" media that should be replaced
on re-upload rather than kept as history (avatars, hero images, profile
banners, etc.).

What to look at when reading this file:

1. The subclass declares its policy as plain class attributes. The
   abstract :class:`Attachment` base reads them on every save, so the
   contract is fully visible at the call site — no settings file to
   chase.
2. ``versioning_enabled = False`` flips the model into replace-in-place
   semantics. Re-uploads mutate the same row and discard the previous
   blob from storage. The ``/versions/`` endpoint is automatically
   omitted from the URL set.
3. ``allowed_content_types`` is a strict whitelist of MIME strings.
   python-magic sniffs the actual MIME from the file bytes — the client
   header is logged but never trusted.
"""

from django.conf import settings
from django.db import models

from nside_wefa.attachments.models import Attachment


class Avatar(Attachment):
    """A user's avatar image.

    Singleton (one per user) with replace-in-place semantics. Re-uploads
    overwrite the existing row instead of creating a new version.
    """

    # --- Attachment policy ------------------------------------------------
    # Re-uploads replace the existing row in place — no version history.
    versioning_enabled = False

    # Whitelist of MIME types accepted on upload. python-magic reads the
    # file's first ~2 KB and the resulting MIME must be in this list.
    allowed_content_types = [
        "image/png",
        "image/jpeg",
        "image/webp",
    ]

    # Per-subclass cap, in bytes. Overrides the global
    # NSIDE_WEFA.ATTACHMENTS.MAX_FILE_SIZE for this model.
    max_size = 2 * 1024 * 1024  # 2 MB

    # Stored under MEDIA_ROOT/avatars/<uid>/<version>/<filename>. The uid
    # and version come from server-side state, so a hostile client cannot
    # influence anything beyond the trailing filename component.
    upload_path_prefix = "avatars/"

    # --- Owning relation -------------------------------------------------
    # OneToOneField makes the (User, Avatar) relationship explicit at the
    # schema level and gives you ``user.avatar`` for free in templates.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="avatar",
    )
