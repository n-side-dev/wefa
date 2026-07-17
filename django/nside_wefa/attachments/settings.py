"""Typed accessor for the ``NSIDE_WEFA.ATTACHMENTS`` settings section.

Reads from :func:`nside_wefa.common.settings.get_section` and applies
documented defaults. All callers in this app should go through
:class:`AttachmentsSettings` rather than touching ``settings.NSIDE_WEFA``
directly, so defaults stay in one place.
"""

from dataclasses import dataclass

from nside_wefa.common.settings import get_section


DEFAULT_STORAGE_ALIAS = "default"
DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024
DEFAULT_UPLOAD_PATH_PREFIX = "attachments/"
DEFAULT_HASH_ALGORITHM = "sha256"
DEFAULT_CONTENT_TYPE_SNIFF_BYTES = 2048


@dataclass(frozen=True)
class AttachmentsSettings:
    """Resolved configuration for the attachments app."""

    storage: str
    max_file_size: int | None
    upload_path_prefix: str
    hash_algorithm: str
    content_type_sniff_bytes: int

    @classmethod
    def load(cls) -> "AttachmentsSettings":
        section = get_section("ATTACHMENTS", default={})
        return cls(
            storage=section.get("STORAGE", DEFAULT_STORAGE_ALIAS),
            max_file_size=section.get("MAX_FILE_SIZE", DEFAULT_MAX_FILE_SIZE),
            upload_path_prefix=section.get(
                "UPLOAD_PATH_PREFIX", DEFAULT_UPLOAD_PATH_PREFIX
            ),
            hash_algorithm=section.get("HASH_ALGORITHM", DEFAULT_HASH_ALGORITHM),
            content_type_sniff_bytes=section.get(
                "CONTENT_TYPE_SNIFF_BYTES", DEFAULT_CONTENT_TYPE_SNIFF_BYTES
            ),
        )
