from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


@override_settings(
    NSIDE_WEFA={
        "AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]},
        "LOCALE": {"AVAILABLE": ["en", "fr"], "DEFAULT": "en"},
    }
)
class AvailableLocalesViewTest(APITestCase):
    """Test cases for AvailableLocalesView."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("locale:available_locales")

    def test_get_anonymous_returns_available_and_default(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"available": ["en", "fr"], "default": "en"})

    @override_settings(
        NSIDE_WEFA={
            "AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]},
            "LOCALE": {"AVAILABLE": ["en", "fr", "nl"], "DEFAULT": "nl"},
        }
    )
    def test_get_reflects_current_configuration(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data, {"available": ["en", "fr", "nl"], "default": "nl"}
        )
