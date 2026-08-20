"""Storage alias resolution tests."""

from __future__ import annotations

import pytest
from django.core.files.storage import FileSystemStorage

from nside_wefa.attachments.storage import get_attachment_storage


def test_default_alias_resolves(settings):
    storage = get_attachment_storage(None)
    assert isinstance(storage, FileSystemStorage)


def test_explicit_alias_overrides_default(settings, tmp_path):
    settings.STORAGES = {
        **settings.STORAGES,
        "alt": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
            "OPTIONS": {"location": str(tmp_path / "alt")},
        },
    }
    # Reload the storages registry so the new alias is visible.
    from django.core.files.storage import storages

    storages._storages.clear()
    storage = get_attachment_storage("alt")
    assert isinstance(storage, FileSystemStorage)
    assert storage.location.endswith("/alt")


def test_unknown_alias_raises(settings):
    from django.core.files.storage import storages

    storages._storages.clear()
    with pytest.raises(Exception):
        get_attachment_storage("does-not-exist")
