"""HTTP-level tests for singleton-mode endpoints (versioned)."""

from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from nside_wefa.attachments.tests.test_app.models import SingletonPdfAttachment


pytestmark = [
    pytest.mark.django_db,
    pytest.mark.urls("nside_wefa.attachments.tests.test_app.urls"),
]


@pytest.fixture
def client(user):
    api = APIClient()
    api.force_authenticate(user=user)
    return api


def test_get_returns_404_when_no_attachment(client):
    response = client.get("/contract/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_post_creates_v1(client, user, pdf_bytes, upload_file):
    response = client.post(
        "/contract/",
        {"file": upload_file("contract.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["version"] == 1
    assert response.data["is_current"] is True
    assert response.data["content_type"] == "application/pdf"


def test_successive_post_bumps_version(client, user, pdf_bytes, upload_file):
    client.post(
        "/contract/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    response = client.post(
        "/contract/",
        {"file": upload_file("v2.pdf", pdf_bytes + b"\x00", "application/pdf")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.data["version"] == 2
    assert response.data["is_current"] is True

    rows = list(SingletonPdfAttachment.objects.filter(owner=user).order_by("version"))
    assert [r.version for r in rows] == [1, 2]
    assert rows[0].is_current is False
    assert rows[1].is_current is True


def test_versions_endpoint_returns_history(client, user, pdf_bytes, upload_file):
    for i in range(3):
        client.post(
            "/contract/",
            {
                "file": upload_file(
                    f"v{i}.pdf", pdf_bytes + bytes([i]), "application/pdf"
                )
            },
            format="multipart",
        )
    response = client.get("/contract/versions/")
    assert response.status_code == status.HTTP_200_OK
    versions = [row["version"] for row in response.data]
    assert versions == [1, 2, 3]


def test_version_detail_endpoint(client, user, pdf_bytes, upload_file):
    client.post(
        "/contract/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    client.post(
        "/contract/",
        {"file": upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf")},
        format="multipart",
    )
    response = client.get("/contract/versions/1/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["version"] == 1


def test_download_streams_current_bytes(client, user, pdf_bytes, upload_file):
    client.post(
        "/contract/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    response = client.get("/contract/download/")
    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"].startswith("application/pdf")
    assert "attachment" in response["Content-Disposition"]
    body = b"".join(response.streaming_content)
    assert body == pdf_bytes


def test_delete_removes_all_versions(client, user, pdf_bytes, upload_file):
    for i in range(2):
        client.post(
            "/contract/",
            {
                "file": upload_file(
                    f"v{i}.pdf", pdf_bytes + bytes([i]), "application/pdf"
                )
            },
            format="multipart",
        )
    response = client.delete("/contract/")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert SingletonPdfAttachment.objects.filter(owner=user).count() == 0


def test_post_without_file_returns_400(client):
    response = client.post("/contract/", {}, format="multipart")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_unauthenticated_request_blocked(pdf_bytes, upload_file):
    api = APIClient()
    response = api.post(
        "/contract/",
        {"file": upload_file("v.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    assert response.status_code in {
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    }


def test_user_isolation(client, user, other_user, pdf_bytes, upload_file):
    """Alice's contract is not visible to Bob via the queryset scope."""
    client.post(
        "/contract/",
        {"file": upload_file("v.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )

    bob_client = APIClient()
    bob_client.force_authenticate(user=other_user)
    response = bob_client.get("/contract/")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_unwhitelisted_mime_rejected(client, png_bytes, upload_file):
    response = client.post(
        "/contract/",
        {"file": upload_file("evil.pdf", png_bytes, "image/png")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
