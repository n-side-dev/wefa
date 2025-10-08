from unittest.mock import patch
from django.test import TestCase, override_settings

from nside_wefa.authentication.utils.settings_initialization import initialize_settings


class SettingsInitializationTest(TestCase):
    """Test cases for authentication settings initialization functionality."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Mock settings.REST_FRAMEWORK to avoid modifying actual settings
        self.mock_rest_framework = {}
        self.settings_patcher = patch(
            "django.conf.settings.REST_FRAMEWORK", self.mock_rest_framework
        )
        self.settings_patcher.start()

    def tearDown(self):
        """Clean up after each test method."""
        self.settings_patcher.stop()

    def test_initialize_settings_with_token_authentication(self):
        """Test that TOKEN authentication type configures token authentication."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN"]}}):
            initialize_settings()

            expected_auth_classes = [
                "rest_framework.authentication.TokenAuthentication"
            ]
            expected_permission_classes = ["rest_framework.permissions.IsAuthenticated"]

            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                expected_auth_classes,
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                expected_permission_classes,
            )

    def test_initialize_settings_with_jwt_authentication(self):
        """Test that JWT authentication type configures JWT authentication."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["JWT"]}}):
            initialize_settings()

            expected_auth_classes = [
                "rest_framework_simplejwt.authentication.JWTAuthentication"
            ]
            expected_permission_classes = ["rest_framework.permissions.IsAuthenticated"]

            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                expected_auth_classes,
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                expected_permission_classes,
            )

    def test_initialize_settings_with_both_authentication_types(self):
        """Test that both TOKEN and JWT types configure both authentications."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]}}
        ):
            initialize_settings()

            expected_auth_classes = [
                "rest_framework.authentication.TokenAuthentication",
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ]
            expected_permission_classes = ["rest_framework.permissions.IsAuthenticated"]

            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                expected_auth_classes,
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                expected_permission_classes,
            )

    def test_initialize_settings_with_jwt_then_token_order(self):
        """Test that JWT first, TOKEN second maintains order."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["JWT", "TOKEN"]}}
        ):
            initialize_settings()

            # The function checks AUTH_TYPE_TOKEN first, then AUTH_TYPE_JWT
            # so TOKEN will be added before JWT regardless of input order
            expected_auth_classes = [
                "rest_framework.authentication.TokenAuthentication",
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ]
            expected_permission_classes = ["rest_framework.permissions.IsAuthenticated"]

            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                expected_auth_classes,
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                expected_permission_classes,
            )

    def test_initialize_settings_with_empty_authentication_types(self):
        """Test that empty authentication types list results in empty auth classes."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": []}}):
            initialize_settings()

            expected_auth_classes = []
            expected_permission_classes = ["rest_framework.permissions.IsAuthenticated"]

            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                expected_auth_classes,
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                expected_permission_classes,
            )

    def test_initialize_settings_with_unknown_authentication_type(self):
        """Test that unknown authentication types are ignored."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["UNKNOWN_TYPE"]}}
        ):
            initialize_settings()

            expected_auth_classes = []
            expected_permission_classes = ["rest_framework.permissions.IsAuthenticated"]

            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                expected_auth_classes,
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                expected_permission_classes,
            )

    def test_initialize_settings_with_mixed_known_unknown_types(self):
        """Test that mix of known and unknown types processes only known ones."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN", "UNKNOWN", "JWT"]}}
        ):
            initialize_settings()

            expected_auth_classes = [
                "rest_framework.authentication.TokenAuthentication",
                "rest_framework_simplejwt.authentication.JWTAuthentication",
            ]
            expected_permission_classes = ["rest_framework.permissions.IsAuthenticated"]

            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                expected_auth_classes,
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                expected_permission_classes,
            )

    def test_initialize_settings_preserves_existing_rest_framework_settings(self):
        """Test that initialization updates but doesn't overwrite all REST_FRAMEWORK settings."""
        # Set up existing REST_FRAMEWORK settings
        self.mock_rest_framework.update(
            {
                "PAGE_SIZE": 20,
                "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
                "DEFAULT_AUTHENTICATION_CLASSES": ["existing.auth.class"],
                "DEFAULT_PERMISSION_CLASSES": ["existing.permission.class"],
            }
        )

        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN"]}}):
            initialize_settings()

            # Should preserve other settings
            self.assertEqual(self.mock_rest_framework["PAGE_SIZE"], 20)
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_RENDERER_CLASSES"],
                ["rest_framework.renderers.JSONRenderer"],
            )

            # Should update auth and permission classes
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_AUTHENTICATION_CLASSES"],
                ["rest_framework.authentication.TokenAuthentication"],
            )
            self.assertEqual(
                self.mock_rest_framework["DEFAULT_PERMISSION_CLASSES"],
                ["rest_framework.permissions.IsAuthenticated"],
            )
