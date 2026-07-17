"""Tests for the attachments system checks."""

from __future__ import annotations

from django.test import override_settings

from nside_wefa.attachments.checks import (
    attachments_apps_dependencies_check,
    attachments_settings_check,
)


class TestAttachmentsSettingsCheck:
    def test_default_settings_pass(self):
        # The demo settings declare a valid ATTACHMENTS section.
        assert attachments_settings_check(None) == []

    @override_settings(NSIDE_WEFA={"ATTACHMENTS": {"STORAGE": "missing-alias"}})
    def test_unknown_storage_alias_errors(self):
        errors = attachments_settings_check(None)
        assert any("missing-alias" in e.msg for e in errors)

    @override_settings(NSIDE_WEFA={"ATTACHMENTS": {"HASH_ALGORITHM": "rot13"}})
    def test_unknown_hash_algorithm_errors(self):
        errors = attachments_settings_check(None)
        assert any("HASH_ALGORITHM" in e.msg for e in errors)

    @override_settings(NSIDE_WEFA={"ATTACHMENTS": {"CONTENT_TYPE_SNIFF_BYTES": 0}})
    def test_non_positive_sniff_bytes_errors(self):
        errors = attachments_settings_check(None)
        assert any("CONTENT_TYPE_SNIFF_BYTES" in e.msg for e in errors)

    @override_settings(NSIDE_WEFA={"ATTACHMENTS": {"MAX_FILE_SIZE": -1}})
    def test_non_positive_max_size_errors(self):
        errors = attachments_settings_check(None)
        assert any("MAX_FILE_SIZE" in e.msg for e in errors)


class TestAppsDependencyCheck:
    def test_correct_order_passes(self):
        # demo/settings.py installs common before attachments.
        assert attachments_apps_dependencies_check(None) == []

    @override_settings(
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
            "nside_wefa.attachments",
            "nside_wefa.common",
        ]
    )
    def test_reversed_order_errors(self):
        errors = attachments_apps_dependencies_check(None)
        assert errors
