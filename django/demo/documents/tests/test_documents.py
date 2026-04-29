"""Demo tests: documents (multi, versioned).

Each test demonstrates one shape of the multi-mode endpoint surface:
listing, creating, bumping versions, retrieving history, downloading,
and tenant isolation.
"""

from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from demo.documents.models import Document


pytestmark = pytest.mark.django_db


@pytest.fixture
def client(user):
    api = APIClient()
    api.force_authenticate(user=user)
    return api


def test_collection_starts_empty(client):
    response = client.get("/documents/")
    assert response.status_code == status.HTTP_200_OK
    assert response.data == []


def test_post_creates_a_new_logical_document(client, user, pdf_bytes, upload_file):
    """In multi-mode, two POSTs on the collection produce two
    independent logical documents — each with its own attachment_uid
    and starting at version 1.

    Re-uploading a *new revision* of the same document is a different
    verb (POST /<pk>/versions/), tested below.
    """
    first = client.post(
        "/documents/",
        {"file": upload_file("a.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    second = client.post(
        "/documents/",
        {"file": upload_file("b.pdf", pdf_bytes + b"\x00", "application/pdf")},
        format="multipart",
    )
    assert first.status_code == status.HTTP_201_CREATED
    assert second.status_code == status.HTTP_201_CREATED
    assert first.data["attachment_uid"] != second.data["attachment_uid"]
    assert first.data["version"] == 1
    assert second.data["version"] == 1


def test_post_to_versions_endpoint_bumps_specific_document(
    client, user, pdf_bytes, upload_file
):
    """POST /documents/<pk>/versions/ creates a new version of the
    document anchored by ``pk``. The new row shares its parent's
    ``attachment_uid``, gets ``version + 1``, and the parent is flipped
    to ``is_current = False`` atomically.

    Inside ``add_version`` the library inherits the parent's owning FKs
    (here, ``owner_id``) onto the new row so the constraint is satisfied
    without the caller having to repeat itself.
    """
    create = client.post(
        "/documents/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    pk = create.data["id"]

    bump = client.post(
        f"/documents/{pk}/versions/",
        {"file": upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf")},
        format="multipart",
    )
    assert bump.status_code == status.HTTP_201_CREATED
    assert bump.data["version"] == 2
    assert bump.data["attachment_uid"] == create.data["attachment_uid"]


def test_versions_endpoint_lists_history_oldest_first(
    client, user, pdf_bytes, upload_file
):
    create = client.post(
        "/documents/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    pk = create.data["id"]
    client.post(
        f"/documents/{pk}/versions/",
        {"file": upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf")},
        format="multipart",
    )
    response = client.get(f"/documents/{pk}/versions/")
    assert response.status_code == status.HTTP_200_OK
    assert [r["version"] for r in response.data] == [1, 2]


def test_collection_lists_only_current_versions(client, user, pdf_bytes, upload_file):
    """The list endpoint returns one row per logical document (the
    current version), even after several version bumps."""
    create = client.post(
        "/documents/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    pk = create.data["id"]
    client.post(
        f"/documents/{pk}/versions/",
        {"file": upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf")},
        format="multipart",
    )
    listing = client.get("/documents/")
    assert len(listing.data) == 1
    assert listing.data[0]["version"] == 2


def test_download_streams_specific_row_bytes(client, user, pdf_bytes, upload_file):
    create = client.post(
        "/documents/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    pk = create.data["id"]
    response = client.get(f"/documents/{pk}/download/")
    assert response.status_code == status.HTTP_200_OK
    assert "attachment" in response["Content-Disposition"]
    body = b"".join(response.streaming_content)
    assert body == pdf_bytes


def test_delete_removes_every_version(client, user, pdf_bytes, upload_file):
    """DELETE on a row hard-deletes the entire logical document — every
    historical row plus its blob in storage. Use with care."""
    create = client.post(
        "/documents/",
        {"file": upload_file("v1.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    pk = create.data["id"]
    client.post(
        f"/documents/{pk}/versions/",
        {"file": upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf")},
        format="multipart",
    )
    response = client.delete(f"/documents/{pk}/")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Document.objects.filter(owner=user).count() == 0


def test_image_is_rejected_by_whitelist(client, png_bytes, upload_file):
    """Documents accept PDFs and Excel files only — a PNG is refused
    even with a credible filename."""
    response = client.post(
        "/documents/",
        {"file": upload_file("looks-like-a-doc.pdf", png_bytes, "application/pdf")},
        format="multipart",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_users_cannot_see_each_others_documents(
    client, user, other_user, pdf_bytes, upload_file
):
    """Same scoping pattern as the avatar app: every endpoint runs
    through the ``queryset`` callable, which restricts to
    ``Document.objects.filter(owner=request.user)``."""
    create = client.post(
        "/documents/",
        {"file": upload_file("alice.pdf", pdf_bytes, "application/pdf")},
        format="multipart",
    )
    pk = create.data["id"]

    bob = APIClient()
    bob.force_authenticate(user=other_user)
    assert bob.get("/documents/").data == []
    assert bob.get(f"/documents/{pk}/").status_code == status.HTTP_404_NOT_FOUND
    # Bob cannot bump Alice's document either — the queryset hides it.
    bump = bob.post(
        f"/documents/{pk}/versions/",
        {"file": upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf")},
        format="multipart",
    )
    assert bump.status_code == status.HTTP_404_NOT_FOUND
