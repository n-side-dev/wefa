"""HTTP-level tests for multi-mode endpoints."""

from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from nside_wefa.attachments.tests.test_app.models import MultiImageAttachment


pytestmark = [
    pytest.mark.django_db,
    pytest.mark.urls("nside_wefa.attachments.tests.test_app.urls"),
]


@pytest.fixture
def client(user):
    api = APIClient()
    api.force_authenticate(user=user)
    return api


def test_collection_starts_empty(client):
    response = client.get("/images/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data == []


def test_post_creates_new_logical_attachment(client, user, png_bytes, upload_file):
    r1 = client.post(
        "/images/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    r2 = client.post(
        "/images/",
        {"file": upload_file("b.png", png_bytes + b"\x00", "image/png")},
        format="multipart",
    )
    assert r1.status_code == status.HTTP_201_CREATED
    assert r2.status_code == status.HTTP_201_CREATED
    assert r1.data["attachment_uid"] != r2.data["attachment_uid"]
    assert r1.data["version"] == 1 and r2.data["version"] == 1

    listing = client.get("/images/").data
    assert len(listing) == 2


def test_post_versions_bumps_specific_logical(client, user, png_bytes, upload_file):
    create = client.post(
        "/images/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    pk = create.data["id"]
    bump = client.post(
        f"/images/{pk}/versions/",
        {"file": upload_file("a2.png", png_bytes + b"\x00", "image/png")},
        format="multipart",
    )
    assert bump.status_code == status.HTTP_201_CREATED
    assert bump.data["version"] == 2
    assert bump.data["attachment_uid"] == create.data["attachment_uid"]


def test_versions_endpoint_returns_history(client, user, png_bytes, upload_file):
    create = client.post(
        "/images/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    pk = create.data["id"]
    client.post(
        f"/images/{pk}/versions/",
        {"file": upload_file("a2.png", png_bytes + b"\x00", "image/png")},
        format="multipart",
    )
    response = client.get(f"/images/{pk}/versions/")
    assert response.status_code == status.HTTP_200_OK
    assert [r["version"] for r in response.data] == [1, 2]


def test_detail_endpoint_returns_specific_row(client, user, png_bytes, upload_file):
    create = client.post(
        "/images/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    pk = create.data["id"]
    response = client.get(f"/images/{pk}/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == pk


def test_delete_removes_all_versions(client, user, png_bytes, upload_file):
    create = client.post(
        "/images/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    pk = create.data["id"]
    client.post(
        f"/images/{pk}/versions/",
        {"file": upload_file("a2.png", png_bytes + b"\x00", "image/png")},
        format="multipart",
    )
    response = client.delete(f"/images/{pk}/")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert MultiImageAttachment.objects.filter(owner=user).count() == 0


def test_user_isolation(client, user, other_user, png_bytes, upload_file):
    create = client.post(
        "/images/",
        {"file": upload_file("a.png", png_bytes, "image/png")},
        format="multipart",
    )
    pk = create.data["id"]

    bob = APIClient()
    bob.force_authenticate(user=other_user)
    assert bob.get("/images/").data == []
    assert (
        bob.get(f"/images/{pk}/").status_code
        == status.HTTP_404_NOT_FOUND
    )
