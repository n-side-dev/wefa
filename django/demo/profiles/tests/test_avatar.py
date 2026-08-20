"""Demo tests: avatar (singleton, non-versioned).

These exercise the public HTTP surface of the avatar endpoints — the
same surface a real consumer's frontend or mobile app would call. Each
test is short and intentionally readable as documentation.

Why HTTP-level tests instead of model-level ones? The model unit tests
already live with the abstract :class:`Attachment` class. The job of a
consumer's test suite is to assert that the *wiring* is correct: URL
routing, queryset scoping, FK binding, permission classes. Re-testing
sniffing or hashing here would just duplicate the library's coverage.
"""

from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from demo.profiles.models import Avatar


pytestmark = pytest.mark.django_db


@pytest.fixture
def client(user):
    """An APIClient already authenticated as the ``user`` fixture."""
    api = APIClient()
    api.force_authenticate(user=user)
    return api


def test_no_avatar_returns_404(client):
    """Before any upload, GET on the singleton URL is a 404 — there is
    nothing to return for this user yet."""
    response = client.get("/me/avatar/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_post_creates_avatar(client, user, png_bytes, upload_file):
    """POST on the collection URL creates the avatar in singleton mode."""
    response = client.post(
        "/me/avatar/",
        {"file": upload_file("me.png", png_bytes, "image/png")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_201_CREATED
    # Server-derived fields are populated on the response so the client
    # can immediately render the new avatar without a follow-up GET.
    assert response.data["content_type"] == "image/png"
    assert response.data["version"] == 1
    assert Avatar.objects.filter(user=user).count() == 1


def test_repeat_post_replaces_in_place(client, user, png_bytes, upload_file):
    """Because ``versioning_enabled = False``, re-uploading mutates the
    existing row instead of creating a new version. The user always has
    exactly one avatar row."""
    client.post(
        "/me/avatar/",
        {"file": upload_file("first.png", png_bytes, "image/png")},
        format="multipart",
    )
    client.post(
        "/me/avatar/",
        {"file": upload_file("second.png", png_bytes + b"\x00", "image/png")},
        format="multipart",
    )
    # Single row, even after multiple uploads.
    assert Avatar.objects.filter(user=user).count() == 1


def test_versions_endpoint_is_not_registered(client):
    """The /versions/ route is omitted automatically when the subclass
    sets ``versioning_enabled = False`` — there's no history to list."""
    response = client.get("/me/avatar/versions/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_returns_current_avatar(client, png_bytes, upload_file):
    client.post(
        "/me/avatar/",
        {"file": upload_file("me.png", png_bytes, "image/png")},
        format="multipart",
    )
    response = client.get("/me/avatar/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["content_type"] == "image/png"


def test_download_streams_image_bytes(client, png_bytes, upload_file):
    client.post(
        "/me/avatar/",
        {"file": upload_file("me.png", png_bytes, "image/png")},
        format="multipart",
    )
    response = client.get("/me/avatar/download/")
    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"].startswith("image/png")
    body = b"".join(response.streaming_content)
    assert body == png_bytes


def test_pdf_is_rejected_by_whitelist(client, pdf_bytes, upload_file):
    """The avatar whitelist accepts PNG/JPEG/WebP — a PDF must be
    rejected even if the client *claims* it is an image."""
    response = client.post(
        "/me/avatar/",
        {"file": upload_file("me.png", pdf_bytes, "image/png")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_unauthenticated_request_is_rejected(png_bytes, upload_file):
    """Permissions are enforced via the ``permissions=[IsAuthenticated]``
    argument to register_attachment_endpoints."""
    api = APIClient()
    response = api.post(
        "/me/avatar/",
        {"file": upload_file("me.png", png_bytes, "image/png")},
        format="multipart",
    )
    assert response.status_code in {
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    }


def test_users_cannot_see_each_others_avatars(
    client, user, other_user, png_bytes, upload_file
):
    """The ``queryset`` callable on the URL registration filters every
    endpoint to ``Avatar.objects.filter(user=request.user)``, so Bob
    cannot see Alice's avatar even by guessing the URL."""
    client.post(
        "/me/avatar/",
        {"file": upload_file("alice.png", png_bytes, "image/png")},
        format="multipart",
    )

    bob = APIClient()
    bob.force_authenticate(user=other_user)
    assert bob.get("/me/avatar/").status_code == status.HTTP_404_NOT_FOUND
