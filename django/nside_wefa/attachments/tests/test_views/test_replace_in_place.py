"""HTTP-level tests for singleton-mode endpoints when ``versioning_enabled=False``.

The avatar test fixture exercises this branch.
"""

from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from nside_wefa.attachments.tests.test_app.models import AvatarAttachment


pytestmark = [
    pytest.mark.django_db,
    pytest.mark.urls("nside_wefa.attachments.tests.test_app.urls"),
]


@pytest.fixture
def client(user):
    api = APIClient()
    api.force_authenticate(user=user)
    return api


def test_post_creates_avatar(client, user, png_bytes, upload_file):
    response = client.post(
        "/avatar/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["version"] == 1
    assert AvatarAttachment.objects.filter(owner=user).count() == 1


def test_successive_post_replaces_in_place(client, user, png_bytes, upload_file):
    client.post(
        "/avatar/",
        {"file": upload_file("a1.png", png_bytes, "image/png")},
        format="multipart",
    )
    response = client.post(
        "/avatar/",
        {"file": upload_file("a2.png", png_bytes + b"\x00", "image/png")},
        format="multipart",
    )
    assert response.status_code in {
        status.HTTP_200_OK,
        status.HTTP_201_CREATED,
    }
    # Single row regardless of how many uploads happened.
    assert AvatarAttachment.objects.filter(owner=user).count() == 1


def test_versions_endpoint_is_not_registered(client):
    """When versioning_enabled=False the URL set omits /versions/."""
    response = client.get("/avatar/versions/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_returns_current(client, user, png_bytes, upload_file):
    client.post(
        "/avatar/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    response = client.get("/avatar/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["content_type"] == "image/png"


def test_pdf_rejected_for_image_avatar(client, pdf_bytes, upload_file):
    response = client.post(
        "/avatar/",
        {"file": upload_file("a.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
