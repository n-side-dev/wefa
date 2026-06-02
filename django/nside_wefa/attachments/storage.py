"""Storage resolution for the attachments app.

Looks up a Django 5+ ``STORAGES`` alias and returns the underlying
:class:`~django.core.files.storage.Storage` instance. Subclasses of
:class:`~nside_wefa.attachments.models.Attachment` may override the
``storage_alias`` class attribute to use a non-default backend.
"""

from typing import Optional

from django.core.files.storage import Storage, storages

from .settings import AttachmentsSettings


def get_attachment_storage(alias: Optional[str] = None) -> Storage:
    """Return the configured storage backend for attachments.

    :param alias: Explicit ``STORAGES`` alias. When ``None`` (the default),
        falls back to ``NSIDE_WEFA.ATTACHMENTS.STORAGE``.
    """
    resolved_alias = alias or AttachmentsSettings.load().storage
    return storages[resolved_alias]
