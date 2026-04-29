"""Admin helpers for concrete :class:`Attachment` subclasses.

Provides a thin ``ModelAdmin`` mixin that exposes the audit-relevant
columns and prevents accidental editing of server-derived fields.
"""

from django.contrib import admin


class AttachmentAdminMixin:
    """Mixin for ``ModelAdmin`` classes managing :class:`Attachment` subclasses."""

    list_display = (
        "id",
        "attachment_uid",
        "version",
        "is_current",
        "filename",
        "content_type",
        "byte_size",
        "uploaded_by",
        "created_at",
    )
    list_filter = ("is_current", "content_type")
    search_fields = ("attachment_uid", "filename", "file_hash")
    readonly_fields = (
        "attachment_uid",
        "version",
        "is_current",
        "filename",
        "content_type",
        "byte_size",
        "file_hash",
        "hash_algorithm",
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at", "-id")


__all__ = ["AttachmentAdminMixin", "admin"]
