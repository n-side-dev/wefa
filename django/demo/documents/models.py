"""Demo: how to add a versioned document store with the WeFa attachments app.

This module shows the **multi, versioned** mode of the attachments
library — appropriate when a user (or any owning entity) can attach
many distinct documents, and each document has its own revision
history.

What to look at when reading this file:

1. ``versioning_enabled = True`` (the default) makes every re-upload of
   a logical document create a new row with ``version + 1``. Prior rows
   are flipped to ``is_current = False`` so the manager's ``.current()``
   helper still returns one row per logical document.
2. The whitelist below is intentionally small. To accept additional
   spreadsheet formats (e.g. ODS), add their MIME strings — never wrap
   in wildcards or fall back to allowing "anything that isn't an
   executable". Whitelist-only validation is the security perimeter of
   the attachments app.
3. Subclasses can store any extra columns alongside the file. The
   ``title`` field is illustrative — a real product might add things
   like a description, expiry date, or signing status.
"""

from django.conf import settings
from django.db import models

from nside_wefa.attachments.models import Attachment


# MIME types a "PDF or spreadsheet" upload might legitimately match.
# Listed as a module-level constant so the whitelist can be referenced
# from tests, admin, and downstream code without re-typing it.
DOCUMENT_CONTENT_TYPES = [
    "application/pdf",
    # Modern .xlsx (zip-based, Open Office XML).
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    # Legacy .xls (OLE2 compound document).
    "application/vnd.ms-excel",
    # Some libmagic builds report legacy .xls as the generic OLE2
    # storage type. Whitelist it so legitimate .xls uploads work
    # regardless of the host's libmagic version.
    "application/x-ole-storage",
]


class Document(Attachment):
    """A versioned PDF or spreadsheet owned by a user."""

    # --- Attachment policy ------------------------------------------------
    # versioning_enabled defaults to True; left explicit here for
    # pedagogical clarity.
    versioning_enabled = True

    # Whitelist-only content types — see DOCUMENT_CONTENT_TYPES above.
    allowed_content_types = DOCUMENT_CONTENT_TYPES

    # 25 MB cap. For larger files, consider chunked uploads or storing
    # outside the request/response cycle (out of scope for this demo).
    max_size = 25 * 1024 * 1024

    # Stored under MEDIA_ROOT/documents/<uid>/<version>/<filename>.
    upload_path_prefix = "documents/"

    # --- Owning relation -------------------------------------------------
    # ForeignKey, not OneToOne — each user can have many documents.
    # ``related_name="documents"`` exposes ``user.documents`` for
    # convenient query in views and templates.
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    # --- Optional subclass-specific columns ------------------------------
    # Demonstrates that subclasses can add their own data alongside the
    # file. The serializer factory exposes these via ``extra_writable`` /
    # ``extra_read_only``; see the urls.py module for how to wire it up.
    title = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Optional human-friendly title shown in the UI.",
    )

    class Meta:
        # Sort by most-recent-first within each owner. The manager's
        # ``.current()`` helper applies on top of this.
        ordering = ("-created_at", "-id")
