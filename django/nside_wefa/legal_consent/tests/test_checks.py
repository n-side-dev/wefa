import tempfile
from pathlib import Path
from django.core.checks import Error
from django.test import TestCase, override_settings

from nside_wefa.legal_consent.checks import (
    legal_consent_settings_check,
    legal_templates_files_check,
)


class LegalConsentChecksTest(TestCase):
    """Test cases for LegalConsent settings check functionality."""

    def test_legal_consent_settings_check_missing_setting(self):
        """Test that missing NSIDE_WEFA.LEGAL_CONSENT setting raises an error."""
        from django.conf import settings
        from unittest.mock import patch

        # Mock settings to not have NSIDE_WEFA
        with patch.object(settings, "NSIDE_WEFA", None):
            with patch("django.conf.settings.NSIDE_WEFA", None, create=True):
                # Also ensure getattr returns None for missing attribute
                with patch(
                    "nside_wefa.legal_consent.checks.getattr", return_value=None
                ):
                    errors = legal_consent_settings_check(None)

                    self.assertEqual(len(errors), 1)
                    self.assertIsInstance(errors[0], Error)
                    self.assertEqual(
                        errors[0].msg,
                        "NSIDE_WEFA.LEGAL_CONSENT is not defined in settings.py",
                    )

    def test_legal_consent_settings_check_missing_version_key(self):
        """Test that missing VERSION key in NSIDE_WEFA.LEGAL_CONSENT raises an error."""
        with override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {"EXPIRY_LIMIT": 365}}):
            errors = legal_consent_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg,
                "NSIDE_WEFA.LEGAL_CONSENT is not properly configured. Missing key: 'VERSION'.",
            )

    def test_legal_consent_settings_check_missing_expiry_limit_key(self):
        """Test that missing EXPIRY_LIMIT key in NSIDE_WEFA.LEGAL_CONSENT raises an error."""
        with override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 1}}):
            errors = legal_consent_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg,
                "NSIDE_WEFA.LEGAL_CONSENT is not properly configured. Missing key: 'EXPIRY_LIMIT'.",
            )

    def test_legal_consent_settings_check_empty_dict(self):
        """Test that empty NSIDE_WEFA.LEGAL_CONSENT dict is treated as not defined."""
        with override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {}}):
            errors = legal_consent_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg, "NSIDE_WEFA.LEGAL_CONSENT is not defined in settings.py"
            )

    def test_legal_consent_settings_check_missing_both_keys(self):
        """Test that missing both VERSION and EXPIRY_LIMIT keys raises multiple errors."""
        with override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {"OTHER_KEY": "value"}}):
            errors = legal_consent_settings_check(None)

            self.assertEqual(len(errors), 2)
            self.assertIsInstance(errors[0], Error)
            self.assertIsInstance(errors[1], Error)

            error_messages = [error.msg for error in errors]
            self.assertIn(
                "NSIDE_WEFA.LEGAL_CONSENT is not properly configured. Missing key: 'VERSION'.",
                error_messages,
            )
            self.assertIn(
                "NSIDE_WEFA.LEGAL_CONSENT is not properly configured. Missing key: 'EXPIRY_LIMIT'.",
                error_messages,
            )

    def test_legal_consent_settings_check_properly_configured(self):
        """Test that properly configured NSIDE_WEFA.LEGAL_CONSENT returns no errors."""
        with override_settings(
            NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 1, "EXPIRY_LIMIT": 365}}
        ):
            errors = legal_consent_settings_check(None)

            self.assertEqual(len(errors), 0)

    def test_legal_consent_settings_check_with_additional_keys(self):
        """Test that NSIDE_WEFA.LEGAL_CONSENT with additional keys still passes validation."""
        with override_settings(
            NSIDE_WEFA={
                "LEGAL_CONSENT": {
                    "VERSION": 2,
                    "EXPIRY_LIMIT": 730,
                    "ADDITIONAL_KEY": "some_value",
                }
            }
        ):
            errors = legal_consent_settings_check(None)

            self.assertEqual(len(errors), 0)

    def test_legal_consent_settings_check_with_none_setting(self):
        """Test that NSIDE_WEFA.LEGAL_CONSENT set to None raises an error."""
        with override_settings(NSIDE_WEFA={"LEGAL_CONSENT": None}):
            errors = legal_consent_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg, "NSIDE_WEFA.LEGAL_CONSENT is not defined in settings.py"
            )

    def test_legal_consent_settings_check_with_different_values(self):
        """Test that different valid values for VERSION and EXPIRY_LIMIT work correctly."""
        test_cases = [
            {"VERSION": 0, "EXPIRY_LIMIT": 0},
            {"VERSION": 10, "EXPIRY_LIMIT": 1000},
            {"VERSION": "1", "EXPIRY_LIMIT": "365"},  # String values should also work
        ]

        for config in test_cases:
            with override_settings(NSIDE_WEFA={"LEGAL_CONSENT": config}):
                errors = legal_consent_settings_check(None)
                self.assertEqual(len(errors), 0, f"Failed for config: {config}")


class LegalConsentTemplatesFilesChecksTest(TestCase):
    """Test cases for LegalConsent templates files check functionality."""

    def test_legal_templates_files_check_no_templates_setting(self):
        """Test that no TEMPLATES setting returns no errors."""
        with override_settings(
            NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 1, "EXPIRY_LIMIT": 365}}
        ):
            errors = legal_templates_files_check(None)
            self.assertEqual(len(errors), 0)

    def test_legal_templates_files_check_no_legal_consent_settings(self):
        """Test that missing LegalConsent settings returns no errors (handled by other checks)."""
        with override_settings(NSIDE_WEFA={}):
            errors = legal_templates_files_check(None)
            self.assertEqual(len(errors), 0)

    def test_legal_templates_files_check_both_files_exist(self):
        """Test that existing both required files returns no errors."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create both required files
            (Path(temp_dir) / "privacy_notice.md").write_text("Privacy Notice")
            (Path(temp_dir) / "terms_of_use.md").write_text("Terms of Use")

            with override_settings(
                NSIDE_WEFA={
                    "LEGAL_CONSENT": {
                        "VERSION": 1,
                        "EXPIRY_LIMIT": 365,
                        "TEMPLATES": temp_dir,
                    }
                }
            ):
                errors = legal_templates_files_check(None)
                self.assertEqual(len(errors), 0)

    def test_legal_templates_files_check_privacy_notice_missing(self):
        """Test that missing privacy_notice.md file raises an error."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create only terms_of_use.md
            (Path(temp_dir) / "terms_of_use.md").write_text("Terms of Use")

            with override_settings(
                NSIDE_WEFA={
                    "LEGAL_CONSENT": {
                        "VERSION": 1,
                        "EXPIRY_LIMIT": 365,
                        "TEMPLATES": temp_dir,
                    }
                }
            ):
                errors = legal_templates_files_check(None)
                self.assertEqual(len(errors), 1)
                self.assertIsInstance(errors[0], Error)
                self.assertIn("privacy_notice.md", errors[0].msg)
                self.assertIn("not found", errors[0].msg)

    def test_legal_templates_files_check_terms_of_use_missing(self):
        """Test that missing terms_of_use.md file raises an error."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create only privacy_notice.md
            (Path(temp_dir) / "privacy_notice.md").write_text("Privacy Notice")

            with override_settings(
                NSIDE_WEFA={
                    "LEGAL_CONSENT": {
                        "VERSION": 1,
                        "EXPIRY_LIMIT": 365,
                        "TEMPLATES": temp_dir,
                    }
                }
            ):
                errors = legal_templates_files_check(None)
                self.assertEqual(len(errors), 1)
                self.assertIsInstance(errors[0], Error)
                self.assertIn("terms_of_use.md", errors[0].msg)
                self.assertIn("not found", errors[0].msg)

    def test_legal_templates_files_check_both_files_missing(self):
        """Test that missing both required files raises two errors."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Don't create any files

            with override_settings(
                NSIDE_WEFA={
                    "LEGAL_CONSENT": {
                        "VERSION": 1,
                        "EXPIRY_LIMIT": 365,
                        "TEMPLATES": temp_dir,
                    }
                }
            ):
                errors = legal_templates_files_check(None)
                self.assertEqual(len(errors), 2)
                self.assertIsInstance(errors[0], Error)
                self.assertIsInstance(errors[1], Error)

                error_messages = [error.msg for error in errors]
                self.assertTrue(
                    any("privacy_notice.md" in msg for msg in error_messages)
                )
                self.assertTrue(any("terms_of_use.md" in msg for msg in error_messages))

    def test_legal_templates_files_check_nonexistent_directory(self):
        """Test that non-existent TEMPLATES directory raises errors for both files."""
        nonexistent_dir = "/path/that/does/not/exist"

        with override_settings(
            NSIDE_WEFA={
                "LEGAL_CONSENT": {
                    "VERSION": 1,
                    "EXPIRY_LIMIT": 365,
                    "TEMPLATES": nonexistent_dir,
                }
            }
        ):
            errors = legal_templates_files_check(None)
            self.assertEqual(len(errors), 2)
            self.assertIsInstance(errors[0], Error)
            self.assertIsInstance(errors[1], Error)

            error_messages = [error.msg for error in errors]
            self.assertTrue(any("privacy_notice.md" in msg for msg in error_messages))
            self.assertTrue(any("terms_of_use.md" in msg for msg in error_messages))
