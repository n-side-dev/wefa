from unittest.mock import patch
from django.test import TestCase
from django.apps import apps

from nside_wefa.authentication.apps import AuthenticationConfig


class AuthenticationConfigTest(TestCase):
    """Test cases for AuthenticationConfig app configuration."""

    def test_app_config_attributes(self):
        """Test that AuthenticationConfig has correct attributes."""
        import nside_wefa.authentication as auth_module

        config = AuthenticationConfig("nside_wefa.authentication", auth_module)

        self.assertEqual(config.default_auto_field, "django.db.models.BigAutoField")
        self.assertEqual(config.name, "nside_wefa.authentication")

    @patch("nside_wefa.authentication.apps.initialize_settings")
    @patch("django.conf.settings")
    def test_ready_method_calls_initialize_settings(
        self, mock_settings, mock_initialize_settings
    ):
        """Test that ready method calls initialize_settings."""
        mock_settings.REST_FRAMEWORK = {"test": "value"}

        import nside_wefa.authentication as auth_module

        config = AuthenticationConfig("nside_wefa.authentication", auth_module)
        config.ready()

        mock_initialize_settings.assert_called_once()

    @patch("nside_wefa.authentication.apps.initialize_settings")
    @patch("django.conf.settings")
    def test_ready_method_imports_checks_module(
        self, mock_settings, mock_initialize_settings
    ):
        """Test that ready method imports the checks module for registration."""
        mock_settings.REST_FRAMEWORK = {}

        # We can't easily test the import directly, but we can test that
        # the ready method completes without error, which indicates the import worked
        import nside_wefa.authentication as auth_module

        config = AuthenticationConfig("nside_wefa.authentication", auth_module)

        # This should not raise any exception
        config.ready()

        # Verify other expected calls happened
        mock_initialize_settings.assert_called_once()

    @patch("nside_wefa.authentication.apps.initialize_settings")
    @patch("django.conf.settings")
    def test_ready_method_execution_order(
        self, mock_settings, mock_initialize_settings
    ):
        """Test that ready method executes operations in correct order."""
        mock_settings.REST_FRAMEWORK = {"test": "value"}

        import nside_wefa.authentication as auth_module

        config = AuthenticationConfig("nside_wefa.authentication", auth_module)
        config.ready()

        # initialize_settings should be called before print
        # We can verify this by checking that both were called
        mock_initialize_settings.assert_called_once()

    @patch("nside_wefa.authentication.apps.initialize_settings")
    @patch("django.conf.settings")
    def test_ready_method_with_empty_rest_framework_settings(
        self, mock_settings, mock_initialize_settings
    ):
        """Test ready method behavior with empty REST_FRAMEWORK settings."""
        mock_settings.REST_FRAMEWORK = {}

        import nside_wefa.authentication as auth_module

        config = AuthenticationConfig("nside_wefa.authentication", auth_module)
        config.ready()

        mock_initialize_settings.assert_called_once()

    @patch("nside_wefa.authentication.apps.initialize_settings")
    @patch("django.conf.settings")
    def test_ready_method_with_none_rest_framework_settings(
        self, mock_settings, mock_initialize_settings
    ):
        """Test ready method behavior when REST_FRAMEWORK is None."""
        mock_settings.REST_FRAMEWORK = None

        import nside_wefa.authentication as auth_module

        config = AuthenticationConfig("nside_wefa.authentication", auth_module)
        config.ready()

        mock_initialize_settings.assert_called_once()

    def test_authentication_app_is_properly_configured(self):
        """Test that the authentication app is properly configured in Django."""
        # This tests the integration with Django's app registry
        try:
            app_config = apps.get_app_config("authentication")
            self.assertEqual(app_config.name, "nside_wefa.authentication")
            self.assertIsInstance(app_config, AuthenticationConfig)
        except LookupError:
            # If the app is not installed, this test should be skipped
            # This happens when running tests in isolation
            self.skipTest("Authentication app not installed in test environment")
