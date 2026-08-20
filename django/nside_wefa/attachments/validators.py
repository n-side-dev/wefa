"""File validation, MIME sniffing, hashing, and filename sanitisation.

This module is the security perimeter of the attachments app. All upload
inputs flow through it before any storage write happens.

Design choices:

- **Whitelist-only content types.** Each subclass declares
  ``allowed_content_types`` and uploads whose sniffed MIME is not in the
  list are rejected. There is no blacklist.
- **MIME comes from the file bytes**, not the client header. python-magic
  reads the first few KB and returns the actual type.
- **Size is enforced twice**: once eagerly via ``UploadedFile.size`` and
  again as a streaming counter while the hash is computed, so a hostile
  client lying about size still hits a ceiling.
- **Filename is sanitised** but the storage key is derived from the
  attachment uid + version, so user-controlled values never become
  storage paths.
"""

from __future__ import annotations

import hashlib
import logging
import re
import unicodedata
from dataclasses import dataclass
from typing import IO, Iterable

import magic
from django.core.exceptions import ValidationError

from .settings import AttachmentsSettings

logger = logging.getLogger("nside_wefa.attachments")

# Filenames are clamped to this many characters after sanitisation. The
# Attachment model's ``filename`` field stores up to 255, but we leave a
# little headroom for storage backends that prepend their own segments.
MAX_FILENAME_LENGTH = 200

# Characters disallowed in stored filenames. Path separators and control
# characters (including NUL) are stripped outright; the result is then
# trimmed against MAX_FILENAME_LENGTH.
_FILENAME_DISALLOWED_PATTERN = re.compile(r"[\x00-\x1f/\\]")


@dataclass(frozen=True)
class SniffResult:
    """Outcome of MIME sniffing for a single file stream."""

    content_type: str
    sniffed_bytes: int


def sniff_content_type(stream: IO[bytes], sniff_bytes: int) -> SniffResult:
    """Return the MIME type as detected by libmagic from the head of ``stream``.

    Rewinds the stream when done so callers can re-read the full content.
    """
    head = stream.read(sniff_bytes)
    try:
        stream.seek(0)
    except (AttributeError, OSError):
        # Streams that don't support seek shouldn't reach this layer; log
        # loudly so the failure surfaces during development.
        logger.exception("Attachment stream is not seekable; cannot rewind after sniff")
        raise
    detected = magic.from_buffer(head, mime=True)
    return SniffResult(content_type=detected, sniffed_bytes=len(head))


def validate_content_type(
    content_type: str,
    allowed_content_types: Iterable[str],
) -> None:
    """Raise :class:`~django.core.exceptions.ValidationError` when the sniffed
    MIME is not in the whitelist.
    """
    allowed = list(allowed_content_types)
    if not allowed:
        raise ValidationError(
            "This attachment subclass has no `allowed_content_types` configured; "
            "uploads are refused.",
            code="attachments_no_whitelist",
        )
    if content_type not in allowed:
        raise ValidationError(
            f"Content type '{content_type}' is not allowed. "
            f"Allowed types: {sorted(allowed)}.",
            code="attachments_content_type_not_allowed",
        )


def validate_size(byte_size: int, max_size: int | None) -> None:
    """Raise when a known size exceeds ``max_size`` (when set)."""
    if max_size is None:
        return
    if byte_size > max_size:
        raise ValidationError(
            f"File is {byte_size} bytes which exceeds the maximum of {max_size}.",
            code="attachments_size_exceeded",
        )


def compute_file_hash(
    stream: IO[bytes],
    *,
    algorithm: str,
    max_size: int | None = None,
    chunk_size: int = 64 * 1024,
) -> tuple[str, int]:
    """Stream ``stream`` through ``hashlib.<algorithm>`` and return
    ``(hex_digest, byte_count)``.

    Enforces ``max_size`` while streaming so we don't trust an upfront size
    declaration. Rewinds the stream when done.
    """
    if algorithm not in hashlib.algorithms_guaranteed:
        raise ValueError(
            f"Hash algorithm '{algorithm}' is not in hashlib.algorithms_guaranteed."
        )
    hasher = hashlib.new(algorithm)
    total = 0
    while True:
        chunk = stream.read(chunk_size)
        if not chunk:
            break
        total += len(chunk)
        if max_size is not None and total > max_size:
            raise ValidationError(
                f"File exceeds the maximum size of {max_size} bytes while streaming.",
                code="attachments_size_exceeded",
            )
        hasher.update(chunk)
    try:
        stream.seek(0)
    except (AttributeError, OSError):
        logger.exception(
            "Attachment stream is not seekable; cannot rewind after hashing"
        )
        raise
    return hasher.hexdigest(), total


def sanitise_filename(raw: str) -> str:
    """Return a filename safe to display and to embed in a storage path.

    Strips path separators, control characters, NUL bytes, normalises
    Unicode, and clamps to :data:`MAX_FILENAME_LENGTH`. The result is *only*
    used for display and as the trailing component of the storage key; the
    leading components (attachment uid, version) come from server-side
    state.
    """
    if not raw:
        return "file"
    # Take the basename in case a client sent a full path. We do this twice
    # — once with POSIX separators and once with Windows separators — so
    # neither shape leaks through.
    basename = raw.replace("\\", "/").rsplit("/", 1)[-1]
    normalised = unicodedata.normalize("NFKC", basename)
    cleaned = _FILENAME_DISALLOWED_PATTERN.sub("", normalised).strip()
    # Reject names that resolve to traversal even after sanitisation.
    if cleaned in ("", ".", ".."):
        cleaned = "file"
    if len(cleaned) > MAX_FILENAME_LENGTH:
        # Preserve the extension when clamping.
        head, dot, ext = cleaned.rpartition(".")
        if dot and len(ext) <= 16:
            cleaned = head[: MAX_FILENAME_LENGTH - len(ext) - 1] + "." + ext
        else:
            cleaned = cleaned[:MAX_FILENAME_LENGTH]
    return cleaned


def load_settings() -> AttachmentsSettings:
    """Return the resolved settings object for the attachments app."""
    return AttachmentsSettings.load()
