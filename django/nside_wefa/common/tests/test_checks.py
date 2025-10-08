from django.core.checks import Error
from django.test import TestCase, override_settings
from unittest.mock import patch

from nside_wefa.common.checks import common_settings_check


class CommonChecksTest(TestCase):
    """Test cases for common settings check functionality."""

    def test_common_settings_check_missing_setting(self):
        """Test that missing NSIDE_WEFA setting raises an error."""
        from django.conf import settings

        # Mock settings to not have NSIDE_WEFA
        with patch.object(settings, "NSIDE_WEFA", None):
            with patch("django.conf.settings.NSIDE_WEFA", None, create=True):
                # Also ensure getattr returns None for missing attribute
                with patch("nside_wefa.common.checks.getattr", return_value=None):
                    errors = common_settings_check(None)

                    self.assertEqual(len(errors), 1)
                    self.assertIsInstance(errors[0], Error)
                    self.assertEqual(
                        errors[0].msg, "NSIDE_WEFA is not defined in settings.py"
                    )

    def test_common_settings_check_missing_app_name_key(self):
        """Test that missing APP_NAME key in NSIDE_WEFA raises an error."""
        with override_settings(NSIDE_WEFA={"OTHER_KEY": "value"}):
            errors = common_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg,
                "NSIDE_WEFA is not properly configured. Missing key: 'APP_NAME'.",
            )

    def test_common_settings_check_empty_dict(self):
        """Test that empty NSIDE_WEFA dict is treated as not defined."""
        with override_settings(NSIDE_WEFA={}):
            errors = common_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(errors[0].msg, "NSIDE_WEFA is not defined in settings.py")

    def test_common_settings_check_properly_configured(self):
        """Test that properly configured NSIDE_WEFA returns no errors."""
        with override_settings(NSIDE_WEFA={"APP_NAME": "Test App"}):
            errors = common_settings_check(None)

            self.assertEqual(len(errors), 0)

    def test_common_settings_check_with_additional_keys(self):
        """Test that NSIDE_WEFA with additional keys still passes validation."""
        with override_settings(
            NSIDE_WEFA={
                "APP_NAME": "Test App",
                "ADDITIONAL_KEY": "some_value",
                "LEGAL_CONSENT": {"VERSION": 1, "EXPIRY_LIMIT": 365},
            }
        ):
            errors = common_settings_check(None)

            self.assertEqual(len(errors), 0)

    def test_common_settings_check_with_none_setting(self):
        """Test that NSIDE_WEFA set to None raises an error."""
        with override_settings(NSIDE_WEFA=None):
            errors = common_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(errors[0].msg, "NSIDE_WEFA is not defined in settings.py")

    def test_common_settings_check_with_different_app_name_values(self):
        """Test that different valid values for APP_NAME work correctly."""
        test_cases = [
            "Simple App",
            "App with Numbers 123",
            "App-with-dashes",
            "App_with_underscores",
            "",  # Empty string should still be valid
        ]

        for app_name in test_cases:
            with override_settings(NSIDE_WEFA={"APP_NAME": app_name}):
                errors = common_settings_check(None)
                self.assertEqual(len(errors), 0, f"Failed for APP_NAME: '{app_name}'")

    def test_common_settings_check_app_name_none_value(self):
        """Test that APP_NAME set to None is still considered present."""
        with override_settings(NSIDE_WEFA={"APP_NAME": None}):
            errors = common_settings_check(None)

            # The check only verifies key presence, not value validity
            self.assertEqual(len(errors), 0)
