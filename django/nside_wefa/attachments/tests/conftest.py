"""Shared fixtures for the attachments test suite.

Redirects ``MEDIA_ROOT`` to a per-test temp directory so the suite never
writes to the demo's persistent media folder, and exposes small byte-level
fixtures for each MIME we exercise (PDF, PNG, JPEG).
"""

from __future__ import annotations

from typing import Callable

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile


# Real magic-byte headers, padded enough to make libmagic happy.
PNG_HEADER = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xfa\xcf\x00\x00\x00\x02\x00\x01\xe2!\xbc\x33"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)

JPEG_HEADER = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
    b"\xff\xdb\x00C\x00" + (b"\x08" * 64) + b"\xff\xd9"
)

PDF_HEADER = (
    b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
    b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\n"
    b"xref\n0 3\n0000000000 65535 f \n"
    b"0000000015 00000 n \n0000000060 00000 n \n"
    b"trailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n110\n%%EOF\n"
)


@pytest.fixture(autouse=True)
def isolated_media(tmp_path, settings):
    """Point ``MEDIA_ROOT`` at a tmp directory for every test."""
    settings.MEDIA_ROOT = str(tmp_path / "media")
    return tmp_path / "media"


@pytest.fixture
def png_bytes() -> bytes:
    return PNG_HEADER


@pytest.fixture
def jpeg_bytes() -> bytes:
    return JPEG_HEADER


@pytest.fixture
def pdf_bytes() -> bytes:
    return PDF_HEADER


@pytest.fixture
def upload_file() -> Callable[..., SimpleUploadedFile]:
    """Return a builder for ``SimpleUploadedFile`` values."""

    def _build(
        name: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> SimpleUploadedFile:
        return SimpleUploadedFile(name=name, content=content, content_type=content_type)

    return _build


@pytest.fixture
def user(db):
    return get_user_model().objects.create_user(
        username="alice", email="alice@example.com", password="x"
    )


@pytest.fixture
def other_user(db):
    return get_user_model().objects.create_user(
        username="bob", email="bob@example.com", password="x"
    )
