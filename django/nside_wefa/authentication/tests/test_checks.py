from unittest.mock import patch
from django.core.checks import Error
from django.test import TestCase, override_settings

from nside_wefa.authentication.checks import (
    wefa_apps_dependencies_check,
    authentication_settings_check,
)


class AuthenticationAppsChecksTest(TestCase):
    """Test cases for authentication apps dependencies check functionality."""

    def test_wefa_apps_dependencies_check_correct_order(self):
        """Test that correct app ordering passes validation."""
        with override_settings(
            INSTALLED_APPS=[
                "rest_framework",
                "rest_framework.authtoken",
                "rest_framework_simplejwt",
                "nside_wefa.common",
                "nside_wefa.authentication",
            ]
        ):
            errors = wefa_apps_dependencies_check(None)
            self.assertEqual(len(errors), 0)

    def test_wefa_apps_dependencies_check_wrong_order(self):
        """Test that wrong app ordering raises an error."""
        with override_settings(
            INSTALLED_APPS=[
                "rest_framework",
                "rest_framework.authtoken",
                "rest_framework_simplejwt",
                "nside_wefa.authentication",
                "nside_wefa.common",
            ]
        ):
            errors = wefa_apps_dependencies_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertIn("must be listed before", errors[0].msg)
            self.assertIn("nside_wefa.common", errors[0].msg)
            self.assertIn("nside_wefa.authentication", errors[0].msg)

    def test_wefa_apps_dependencies_check_missing_common(self):
        """Test that missing common app raises an error."""
        with override_settings(
            INSTALLED_APPS=[
                "rest_framework",
                "rest_framework.authtoken",
                "rest_framework_simplejwt",
                "nside_wefa.authentication",
            ]
        ):
            errors = wefa_apps_dependencies_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg,
                "'nside_wefa.common' is required in INSTALLED_APPS when using 'nside_wefa.authentication'.",
            )

    def test_wefa_apps_dependencies_check_missing_authentication(self):
        """Test that missing authentication app doesn't raise error (app not loaded)."""
        with override_settings(
            INSTALLED_APPS=[
                "rest_framework",
                "rest_framework.authtoken",
                "rest_framework_simplejwt",
                "nside_wefa.common",
            ]
        ):
            errors = wefa_apps_dependencies_check(None)
            self.assertEqual(len(errors), 0)


class AuthenticationSettingsChecksTest(TestCase):
    """Test cases for authentication settings check functionality."""

    def test_authentication_settings_check_missing_nside_wefa(self):
        """Test that missing NSIDE_WEFA setting raises an error."""
        from django.conf import settings

        with patch.object(settings, "NSIDE_WEFA", None):
            with patch("django.conf.settings.NSIDE_WEFA", None, create=True):
                with patch(
                    "nside_wefa.authentication.checks.getattr", return_value=None
                ):
                    errors = authentication_settings_check(None)

                    self.assertEqual(len(errors), 1)
                    self.assertIsInstance(errors[0], Error)
                    self.assertEqual(
                        errors[0].msg,
                        "NSIDE_WEFA.AUTHENTICATION is not defined in settings.py",
                    )

    def test_authentication_settings_check_missing_authentication_key(self):
        """Test that missing AUTHENTICATION key in NSIDE_WEFA raises an error."""
        with override_settings(NSIDE_WEFA={"OTHER_KEY": "value"}):
            errors = authentication_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg, "NSIDE_WEFA.AUTHENTICATION is not defined in settings.py"
            )

    def test_authentication_settings_check_none_authentication(self):
        """Test that NSIDE_WEFA.AUTHENTICATION set to None raises an error."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": None}):
            errors = authentication_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg, "NSIDE_WEFA.AUTHENTICATION is not defined in settings.py"
            )

    def test_authentication_settings_check_missing_types_key(self):
        """Test that missing TYPES key in NSIDE_WEFA.AUTHENTICATION raises an error."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"OTHER_KEY": "value"}}):
            errors = authentication_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg,
                "NSIDE_WEFA.AUTHENTICATION is not properly configured. Missing key: 'TYPES'.",
            )

    def test_authentication_settings_check_invalid_authentication_type(self):
        """Test that invalid authentication type raises an error."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["INVALID_TYPE"]}}
        ):
            errors = authentication_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertIn("INVALID_TYPE is not in", errors[0].msg)
            self.assertIn("['TOKEN', 'JWT']", errors[0].msg)

    def test_authentication_settings_check_multiple_invalid_types(self):
        """Test that multiple invalid authentication types raise multiple errors."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["INVALID1", "INVALID2"]}}
        ):
            errors = authentication_settings_check(None)

            self.assertEqual(len(errors), 2)
            self.assertIsInstance(errors[0], Error)
            self.assertIsInstance(errors[1], Error)

    def test_authentication_settings_check_valid_token_type(self):
        """Test that valid TOKEN authentication type passes validation."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN"]}}):
            errors = authentication_settings_check(None)
            self.assertEqual(len(errors), 0)

    def test_authentication_settings_check_valid_jwt_type(self):
        """Test that valid JWT authentication type passes validation."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["JWT"]}}):
            errors = authentication_settings_check(None)
            self.assertEqual(len(errors), 0)

    def test_authentication_settings_check_valid_both_types(self):
        """Test that both valid authentication types pass validation."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]}}
        ):
            errors = authentication_settings_check(None)
            self.assertEqual(len(errors), 0)

    def test_authentication_settings_check_with_additional_keys(self):
        """Test that NSIDE_WEFA.AUTHENTICATION with additional keys still passes validation."""
        with override_settings(
            NSIDE_WEFA={
                "AUTHENTICATION": {
                    "TYPES": ["TOKEN", "JWT"],
                    "ADDITIONAL_KEY": "some_value",
                }
            }
        ):
            errors = authentication_settings_check(None)
            self.assertEqual(len(errors), 0)

    def test_authentication_settings_check_mixed_valid_invalid_types(self):
        """Test that mix of valid and invalid authentication types raises errors only for invalid ones."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN", "INVALID", "JWT"]}}
        ):
            errors = authentication_settings_check(None)

            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertIn("INVALID is not in", errors[0].msg)
