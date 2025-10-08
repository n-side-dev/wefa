from django.test import TestCase, override_settings

from nside_wefa.authentication.utils.utils import get_authentication_types


class AuthenticationUtilsTest(TestCase):
    """Test cases for authentication utilities functions."""

    def test_get_authentication_types_with_token(self):
        """Test get_authentication_types returns TOKEN type correctly."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN"]}}):
            types = get_authentication_types()
            self.assertEqual(types, ["TOKEN"])

    def test_get_authentication_types_with_jwt(self):
        """Test get_authentication_types returns JWT type correctly."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["JWT"]}}):
            types = get_authentication_types()
            self.assertEqual(types, ["JWT"])

    def test_get_authentication_types_with_both_types(self):
        """Test get_authentication_types returns both types correctly."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]}}
        ):
            types = get_authentication_types()
            self.assertEqual(types, ["TOKEN", "JWT"])

    def test_get_authentication_types_with_empty_list(self):
        """Test get_authentication_types returns empty list correctly."""
        with override_settings(NSIDE_WEFA={"AUTHENTICATION": {"TYPES": []}}):
            types = get_authentication_types()
            self.assertEqual(types, [])

    def test_get_authentication_types_with_custom_types(self):
        """Test get_authentication_types returns custom types (even if invalid)."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["CUSTOM_TYPE"]}}
        ):
            types = get_authentication_types()
            self.assertEqual(types, ["CUSTOM_TYPE"])

    def test_get_authentication_types_order_preserved(self):
        """Test get_authentication_types preserves order of types."""
        with override_settings(
            NSIDE_WEFA={"AUTHENTICATION": {"TYPES": ["JWT", "TOKEN"]}}
        ):
            types = get_authentication_types()
            self.assertEqual(types, ["JWT", "TOKEN"])
