from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from nside_wefa.locale.models import UserLocale


@override_settings(
    NSIDE_WEFA={
        "AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]},
        "LOCALE": {"AVAILABLE": ["en", "fr"], "DEFAULT": "en"},
    }
)
class UserLocaleViewTest(APITestCase):
    """Test cases for UserLocaleView."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.url = reverse("locale:user_locale")

    def test_get_authenticated_returns_null_code_initially(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"code": None})

    def test_get_unauthenticated_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_creates_missing_row(self):
        self.client.force_authenticate(user=self.user)
        UserLocale.objects.filter(user=self.user).delete()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"code": None})
        self.assertTrue(UserLocale.objects.filter(user=self.user).exists())

    def test_patch_updates_code(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(self.url, {"code": "fr"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"code": "fr"})
        self.user.userlocale.refresh_from_db()
        self.assertEqual(self.user.userlocale.code, "fr")

    def test_patch_rejects_unknown_code(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(self.url, {"code": "es"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.userlocale.refresh_from_db()
        self.assertIsNone(self.user.userlocale.code)

    def test_patch_accepts_null_to_reset(self):
        self.user.userlocale.code = "fr"
        self.user.userlocale.save()

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url, {"code": None}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"code": None})

    def test_patch_unauthenticated_returns_401(self):
        response = self.client.patch(self.url, {"code": "fr"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_creates_missing_row(self):
        self.client.force_authenticate(user=self.user)
        UserLocale.objects.filter(user=self.user).delete()

        response = self.client.patch(self.url, {"code": "fr"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"code": "fr"})
        self.assertEqual(UserLocale.objects.get(user=self.user).code, "fr")


@override_settings(
    NSIDE_WEFA={
        "AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]},
        "LOCALE": {"AVAILABLE": ["en", "fr", "nl"], "DEFAULT": "nl"},
    }
)
class UserLocaleViewDifferentConfigTest(APITestCase):
    """Test UserLocaleView respects dynamic configuration changes."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.url = reverse("locale:user_locale")

    def test_patch_accepts_code_valid_under_new_config(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url, {"code": "nl"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"code": "nl"})
