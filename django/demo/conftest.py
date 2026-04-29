"""Shared pytest fixtures for the demo apps.

Fixtures are scoped to ``demo/`` — they auto-apply to any test under
this tree. The patterns shown here are the same ones a real consumer
would use when writing tests against their own ``Attachment`` subclass:

- :func:`isolated_media` redirects ``MEDIA_ROOT`` to a per-test temp
  directory so test runs never leak files into the project's persistent
  media folder.
- The byte fixtures are real magic-byte headers. python-magic relies on
  the leading bytes of the stream to determine the MIME, so synthetic
  payloads must look like the real format.
- :func:`upload_file` is a small builder that returns a Django
  :class:`SimpleUploadedFile` — what views expect on the request.
"""

from __future__ import annotations

from typing import Callable

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile


# A 1×1 transparent PNG. Just enough bytes for libmagic to identify
# the file as image/png.
PNG_HEADER = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
    b"\x00\x00\x00\rIDATx\x9cc\xfa\xcf\x00\x00\x00\x02\x00\x01\xe2!\xbc\x33"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)

# The smallest PDF that's also a valid one — enough for libmagic to
# detect application/pdf.
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
    """Redirect MEDIA_ROOT to a tmp dir so test files don't persist."""
    settings.MEDIA_ROOT = str(tmp_path / "media")
    return tmp_path / "media"


@pytest.fixture
def png_bytes() -> bytes:
    return PNG_HEADER


@pytest.fixture
def pdf_bytes() -> bytes:
    return PDF_HEADER


@pytest.fixture
def upload_file() -> Callable[..., SimpleUploadedFile]:
    """Return a builder for ``SimpleUploadedFile`` payloads.

    The third arg (``content_type``) is what the client *claims*. The
    attachments library ignores it — it sniffs the actual MIME from the
    bytes via python-magic — but the field is still useful when writing
    tests that exercise the "client lies about type" branch.
    """

    def _build(
        name: str,
        content: bytes,
        content_type: str = "application/octet-stream",
    ) -> SimpleUploadedFile:
        return SimpleUploadedFile(name=name, content=content, content_type=content_type)

    return _build


@pytest.fixture
def user(db):
    """A logged-in test user."""
    return get_user_model().objects.create_user(
        username="alice", email="alice@example.com", password="x"
    )


@pytest.fixture
def other_user(db):
    """A second user, used to assert tenant isolation."""
    return get_user_model().objects.create_user(
        username="bob", email="bob@example.com", password="x"
    )
