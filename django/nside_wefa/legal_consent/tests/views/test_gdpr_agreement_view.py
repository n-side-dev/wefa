import datetime

from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from freezegun import freeze_time
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from nside_wefa.legal_consent.models import LegalConsent


@override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 1, "EXPIRY_LIMIT": 365}})
class LegalConsentViewTest(APITestCase):
    """Test cases for LegalConsentView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.url = reverse("legal_consent:legal_consent")

    def test_get_agreement_status_authenticated_user(self):
        """Test GET request for authenticated user with existing agreement"""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        # GET now returns full agreement info via serializer
        self.assertIsNone(data["version"])  # Initially no version
        self.assertIsNone(data["accepted_at"])  # Initially no accepted_at
        self.assertFalse(data["valid"])  # Initially invalid
        # Ensure all three fields are returned
        self.assertEqual(sorted(data.keys()), ["accepted_at", "valid", "version"])

    def test_get_agreement_status_expired_agreement(self):
        """Test GET request for authenticated user with existing invalid agreement"""
        self.user.legalconsent.renew()
        with freeze_time(timezone.now() + datetime.timedelta(days=500)):
            self.client.force_authenticate(user=self.user)

            response = self.client.get(self.url)

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.data
            # GET now returns full agreement info via serializer
            self.assertIsNotNone(data["version"])  # Initially no version
            self.assertIsNotNone(data["accepted_at"])  # Initially no accepted_at
            self.assertFalse(data["valid"])  # Initially invalid
            # Ensure all three fields are returned
            self.assertEqual(sorted(data.keys()), ["accepted_at", "valid", "version"])

    def test_get_agreement_status_unauthenticated_user(self):
        """Test GET request for unauthenticated user should return 403"""
        response = self.client.get(self.url)

        # DRF IsAuthenticated permission returns 403 for unauthenticated requests
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_renew_agreement_authenticated_user(self):
        """Test PATCH request to renew agreement for authenticated user"""
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Verify response data using serializer format
        self.assertEqual(data["version"], 1)  # Should be updated to current version
        self.assertIsNotNone(data["accepted_at"])
        self.assertTrue(data["valid"])
        # Ensure all three fields are returned
        self.assertEqual(sorted(data.keys()), ["accepted_at", "valid", "version"])

        # Verify database was updated
        agreement = LegalConsent.objects.get(user=self.user)
        self.assertEqual(agreement.version, 1)
        self.assertIsNotNone(agreement.accepted_at)
        self.assertTrue(agreement.is_valid())

    def test_patch_renew_agreement_unauthenticated_user(self):
        """Test PATCH request for unauthenticated user should return 403"""
        response = self.client.patch(self.url)

        # DRF IsAuthenticated permission returns 403 for unauthenticated requests
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_agreement_creates_missing_agreement(self):
        """Test GET request creates agreement if it doesn't exist"""
        self.client.force_authenticate(user=self.user)

        # Delete the agreement created by signal
        LegalConsent.objects.filter(user=self.user).delete()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # GET now returns full agreement info via serializer
        self.assertIsNone(data["version"])  # Initially no version
        self.assertIsNone(data["accepted_at"])  # Initially no expires_at
        self.assertFalse(data["valid"])
        # Ensure all three fields are returned
        self.assertEqual(sorted(data.keys()), ["accepted_at", "valid", "version"])

        # Verify agreement was created in database
        self.assertTrue(LegalConsent.objects.filter(user=self.user).exists())

    def test_patch_agreement_creates_missing_agreement(self):
        """Test PATCH request creates and renews agreement if it doesn't exist"""
        self.client.force_authenticate(user=self.user)

        # Delete the agreement created by signal
        LegalConsent.objects.filter(user=self.user).delete()

        response = self.client.patch(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Should create and renew agreement using serializer format
        self.assertEqual(data["version"], 1)
        self.assertIsNotNone(data["accepted_at"])
        self.assertTrue(data["valid"])
        # Ensure all three fields are returned
        self.assertEqual(sorted(data.keys()), ["accepted_at", "valid", "version"])

        # Verify agreement was created and renewed in database
        agreement = LegalConsent.objects.get(user=self.user)
        self.assertEqual(agreement.version, 1)
        self.assertIsNotNone(agreement.accepted_at)
        self.assertTrue(agreement.is_valid())

    def test_get_agreement_with_renewed_agreement(self):
        """Test GET request returns correct data for already renewed agreement"""
        self.client.force_authenticate(user=self.user)

        # Renew the agreement first
        agreement = LegalConsent.objects.get(user=self.user)
        agreement.renew()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # GET now returns full agreement info via serializer
        self.assertEqual(data["version"], 1)  # Should have version after renewal
        self.assertIsNotNone(
            data["accepted_at"]
        )  # Should have expires_at after renewal
        self.assertTrue(data["valid"])  # Should be valid after renewal
        # Ensure all three fields are returned
        self.assertEqual(sorted(data.keys()), ["accepted_at", "valid", "version"])

    def test_patch_multiple_renewals(self):
        """Test multiple PATCH requests properly update the agreement"""
        self.client.force_authenticate(user=self.user)

        # First renewal
        response1 = self.client.patch(self.url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        data1 = response1.data
        first_expires_at = data1["accepted_at"]

        # Wait a moment and renew again

        with freeze_time(timezone.now() + datetime.timedelta(seconds=1)):
            response2 = self.client.patch(self.url)
            self.assertEqual(response2.status_code, status.HTTP_200_OK)
            data2 = response2.data
            second_expires_at = data2["accepted_at"]

            # Second renewal should have a later expiration time
            self.assertGreater(second_expires_at, first_expires_at)
            self.assertEqual(data2["version"], 1)
            self.assertTrue(data2["valid"])


@override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 2, "EXPIRY_LIMIT": 180}})
class LegalConsentViewDifferentConfigTest(APITestCase):
    """Test LegalConsentView with different LegalConsent configuration"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.url = reverse("legal_consent:legal_consent")

    def test_patch_uses_current_configuration(self):
        """Test PATCH request uses current configuration values"""
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        # Should use VERSION 2 from the override settings
        self.assertEqual(data["version"], 2)
        self.assertTrue(data["valid"])

        # Verify the acceptation date is set
        agreement = LegalConsent.objects.get(user=self.user)
        accepted_at = agreement.accepted_at

        # Allow for small time difference in test execution
        time_diff = abs(
            (
                accepted_at - datetime.datetime.now(tz=datetime.timezone.utc)
            ).total_seconds()
        )
        self.assertLess(time_diff, 5)  # Within 5 seconds
