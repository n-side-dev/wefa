from django.contrib.auth.models import User
from django.test import TestCase, override_settings

from nside_wefa.locale.models import UserLocale
from nside_wefa.locale.serializers import (
    AvailableLocalesSerializer,
    UserLocaleSerializer,
)


@override_settings(NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en", "fr"], "DEFAULT": "en"}})
class UserLocaleSerializerTest(TestCase):
    """Test cases for UserLocaleSerializer."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.user_locale = UserLocale.objects.get(user=self.user)

    def test_serializer_fields(self):
        serializer = UserLocaleSerializer(self.user_locale)
        self.assertEqual(list(serializer.data.keys()), ["code"])

    def test_serializes_null_code(self):
        serializer = UserLocaleSerializer(self.user_locale)
        self.assertIsNone(serializer.data["code"])

    def test_serializes_set_code(self):
        self.user_locale.code = "fr"
        self.user_locale.save()
        serializer = UserLocaleSerializer(self.user_locale)
        self.assertEqual(serializer.data["code"], "fr")

    def test_rejects_unknown_code(self):
        serializer = UserLocaleSerializer(
            self.user_locale, data={"code": "es"}, partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("code", serializer.errors)

    def test_accepts_known_code(self):
        serializer = UserLocaleSerializer(
            self.user_locale, data={"code": "fr"}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_accepts_null_code(self):
        serializer = UserLocaleSerializer(
            self.user_locale, data={"code": None}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)


class AvailableLocalesSerializerTest(TestCase):
    """Test cases for AvailableLocalesSerializer."""

    def test_serializes_payload(self):
        serializer = AvailableLocalesSerializer(
            {"available": ["en", "fr"], "default": "en"}
        )
        self.assertEqual(
            dict(serializer.data), {"available": ["en", "fr"], "default": "en"}
        )
