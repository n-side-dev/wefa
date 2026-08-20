"""Model-level tests: ingest pipeline, versioning, manager helpers."""

from __future__ import annotations

import hashlib

import pytest
from django.core.exceptions import ImproperlyConfigured, ValidationError

from nside_wefa.attachments.tests.test_app.models import (
    AvatarAttachment,
    SingletonPdfAttachment,
)


pytestmark = pytest.mark.django_db


class TestUpload:
    def test_first_upload_populates_all_derived_fields(
        self, user, pdf_bytes, upload_file
    ):
        instance = SingletonPdfAttachment.upload(
            file=upload_file("contract.pdf", pdf_bytes, "application/pdf"),
            uploaded_by=user,
            owner=user,
        )
        assert instance.version == 1
        assert instance.is_current is True
        assert instance.attachment_uid is not None
        assert instance.filename == "contract.pdf"
        assert instance.content_type == "application/pdf"
        assert instance.byte_size == len(pdf_bytes)
        assert instance.file_hash == hashlib.sha256(pdf_bytes).hexdigest()
        assert instance.hash_algorithm == "sha256"
        assert instance.uploaded_by == user
        assert instance.file.name.startswith("test-singleton/")
        assert str(instance.attachment_uid) in instance.file.name
        assert "/1/" in instance.file.name

    def test_upload_rejects_unwhitelisted_mime(self, user, png_bytes, upload_file):
        with pytest.raises(ValidationError):
            SingletonPdfAttachment.upload(
                file=upload_file("img.png", png_bytes, "image/png"),
                owner=user,
            )

    def test_upload_ignores_lying_client_header(self, user, pdf_bytes, upload_file):
        """Client claims `image/png` but bytes are PDF — sniffer wins, accepted."""
        instance = SingletonPdfAttachment.upload(
            file=upload_file("evil.png", pdf_bytes, "image/png"),
            owner=user,
        )
        assert instance.content_type == "application/pdf"

    def test_upload_rejects_oversize(self, user, upload_file):
        # max_size on SingletonPdfAttachment = 5MB
        big = b"%PDF-1.4\n" + b"\x00" * (6 * 1024 * 1024)
        with pytest.raises(ValidationError):
            SingletonPdfAttachment.upload(
                file=upload_file("big.pdf", big, "application/pdf"),
                owner=user,
            )

    def test_upload_sanitises_filename(self, user, pdf_bytes, upload_file):
        instance = SingletonPdfAttachment.upload(
            file=upload_file("../../etc/passwd.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        assert instance.filename == "passwd.pdf"
        assert ".." not in instance.file.name


class TestAddVersion:
    def test_add_version_bumps_and_flips_prior(self, user, pdf_bytes, upload_file):
        v1 = SingletonPdfAttachment.upload(
            file=upload_file("v1.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        v2 = SingletonPdfAttachment.add_version(
            file=upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf"),
            parent=v1,
        )
        v1.refresh_from_db()
        assert v2.version == 2
        assert v2.is_current is True
        assert v2.attachment_uid == v1.attachment_uid
        assert v1.is_current is False
        assert v2.file_hash != v1.file_hash

    def test_add_version_by_uid_only(self, user, pdf_bytes, upload_file):
        v1 = SingletonPdfAttachment.upload(
            file=upload_file("v1.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        v2 = SingletonPdfAttachment.add_version(
            file=upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf"),
            attachment_uid=v1.attachment_uid,
        )
        assert v2.version == 2

    def test_add_version_requires_parent_or_uid(self, user, pdf_bytes, upload_file):
        with pytest.raises(ValueError):
            SingletonPdfAttachment.add_version(
                file=upload_file("v.pdf", pdf_bytes, "application/pdf"),
            )

    def test_add_version_disallowed_when_versioning_disabled(
        self, user, png_bytes, upload_file
    ):
        avatar = AvatarAttachment.upload(
            file=upload_file("a.png", png_bytes, "image/png"),
            owner=user,
        )
        with pytest.raises(NotImplementedError):
            AvatarAttachment.add_version(
                file=upload_file("a2.png", png_bytes + b"x", "image/png"),
                parent=avatar,
            )


class TestReplaceInPlace:
    def test_replace_in_place_overwrites_fields(self, user, png_bytes, upload_file):
        v1 = AvatarAttachment.upload(
            file=upload_file("a.png", png_bytes, "image/png"),
            owner=user,
        )
        original_hash = v1.file_hash
        v1.replace_in_place(
            file=upload_file("a2.png", png_bytes + b"\x00", "image/png"),
        )
        v1.refresh_from_db()
        assert v1.file_hash != original_hash
        assert v1.version == 1
        assert v1.is_current is True
        # Only one row in the table for this scope.
        assert AvatarAttachment.objects.filter(owner=user).count() == 1

    def test_replace_in_place_disallowed_when_versioning_enabled(
        self, user, pdf_bytes, upload_file
    ):
        v1 = SingletonPdfAttachment.upload(
            file=upload_file("v.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        with pytest.raises(NotImplementedError):
            v1.replace_in_place(
                file=upload_file("v2.pdf", pdf_bytes, "application/pdf")
            )


class TestManager:
    def test_current_returns_only_current_rows(self, user, pdf_bytes, upload_file):
        v1 = SingletonPdfAttachment.upload(
            file=upload_file("v1.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        SingletonPdfAttachment.add_version(
            file=upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf"),
            parent=v1,
        )
        currents = list(SingletonPdfAttachment.objects.current())
        assert len(currents) == 1
        assert currents[0].version == 2

    def test_history_orders_by_version(self, user, pdf_bytes, upload_file):
        v1 = SingletonPdfAttachment.upload(
            file=upload_file("v1.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        SingletonPdfAttachment.add_version(
            file=upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf"),
            parent=v1,
        )
        SingletonPdfAttachment.add_version(
            file=upload_file("v3.pdf", pdf_bytes + b"xx", "application/pdf"),
            parent=v1,
        )
        history = list(SingletonPdfAttachment.objects.history(v1.attachment_uid))
        assert [row.version for row in history] == [1, 2, 3]


class TestSubclassConfigurationCheck:
    def test_missing_whitelist_raises_improperly_configured(
        self, user, pdf_bytes, upload_file
    ):
        original = SingletonPdfAttachment.allowed_content_types
        SingletonPdfAttachment.allowed_content_types = []
        try:
            with pytest.raises(ImproperlyConfigured):
                SingletonPdfAttachment.upload(
                    file=upload_file("v.pdf", pdf_bytes, "application/pdf"),
                    owner=user,
                )
        finally:
            SingletonPdfAttachment.allowed_content_types = original


class TestHardDelete:
    def test_hard_delete_removes_blob(self, user, pdf_bytes, upload_file):
        v1 = SingletonPdfAttachment.upload(
            file=upload_file("v.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        storage_name = v1.file.name
        storage = v1.file.storage
        v1.hard_delete_with_blob()
        assert not storage.exists(storage_name)

    def test_hard_delete_logical_removes_all_versions(
        self, user, pdf_bytes, upload_file
    ):
        v1 = SingletonPdfAttachment.upload(
            file=upload_file("v.pdf", pdf_bytes, "application/pdf"),
            owner=user,
        )
        SingletonPdfAttachment.add_version(
            file=upload_file("v2.pdf", pdf_bytes + b"x", "application/pdf"),
            parent=v1,
        )
        deleted = SingletonPdfAttachment.hard_delete_logical(v1.attachment_uid)
        assert deleted == 2
        assert (
            SingletonPdfAttachment.objects.filter(
                attachment_uid=v1.attachment_uid
            ).count()
            == 0
        )
