from django.core.checks import Error
from django.test import TestCase, override_settings

from nside_wefa.locale.checks import locale_settings_check


class LocaleSettingsChecksTest(TestCase):
    """Test cases for the NSIDE_WEFA.LOCALE settings check."""

    def test_missing_section(self):
        """Test that missing NSIDE_WEFA.LOCALE raises an error."""
        with override_settings(NSIDE_WEFA={}):
            errors = locale_settings_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg,
                "NSIDE_WEFA.LOCALE is not defined in settings.py",
            )

    def test_missing_available_key(self):
        """Test that missing AVAILABLE raises a missing-key error."""
        with override_settings(NSIDE_WEFA={"LOCALE": {"DEFAULT": "en"}}):
            errors = locale_settings_check(None)
            messages = [e.msg for e in errors]
            self.assertIn(
                "NSIDE_WEFA.LOCALE is not properly configured. Missing key: 'AVAILABLE'.",
                messages,
            )

    def test_missing_default_key(self):
        """Test that missing DEFAULT raises a missing-key error."""
        with override_settings(NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en"]}}):
            errors = locale_settings_check(None)
            messages = [e.msg for e in errors]
            self.assertIn(
                "NSIDE_WEFA.LOCALE is not properly configured. Missing key: 'DEFAULT'.",
                messages,
            )

    def test_available_must_be_non_empty_list(self):
        """Test that AVAILABLE must be a non-empty list of strings."""
        with override_settings(
            NSIDE_WEFA={"LOCALE": {"AVAILABLE": [], "DEFAULT": "en"}}
        ):
            errors = locale_settings_check(None)
            messages = [e.msg for e in errors]
            self.assertTrue(
                any("AVAILABLE is not properly configured" in m for m in messages)
            )

    def test_available_rejects_non_string_entries(self):
        """Test that AVAILABLE entries must be non-empty strings."""
        with override_settings(
            NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en", 123], "DEFAULT": "en"}}
        ):
            errors = locale_settings_check(None)
            messages = [e.msg for e in errors]
            self.assertTrue(
                any("not a valid locale code" in m for m in messages),
                messages,
            )

    def test_default_must_be_in_available(self):
        """Test that DEFAULT must be a member of AVAILABLE."""
        with override_settings(
            NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en", "fr"], "DEFAULT": "es"}}
        ):
            errors = locale_settings_check(None)
            messages = [e.msg for e in errors]
            self.assertTrue(
                any(
                    "'es' is not a member of NSIDE_WEFA.LOCALE.AVAILABLE" in m
                    for m in messages
                ),
                messages,
            )

    def test_default_must_be_non_empty_string(self):
        """Test that DEFAULT must be a non-empty string."""
        with override_settings(
            NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en"], "DEFAULT": ""}}
        ):
            errors = locale_settings_check(None)
            messages = [e.msg for e in errors]
            self.assertTrue(
                any("DEFAULT is not properly configured" in m for m in messages),
                messages,
            )

    def test_properly_configured(self):
        """Test that a valid section produces no errors."""
        with override_settings(
            NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en", "fr"], "DEFAULT": "en"}}
        ):
            errors = locale_settings_check(None)
            self.assertEqual(errors, [])
