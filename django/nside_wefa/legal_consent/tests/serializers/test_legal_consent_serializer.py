import datetime

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.utils import timezone

from nside_wefa.legal_consent.models import LegalConsent
from nside_wefa.legal_consent.serializers import LegalConsentSerializer


@override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 1, "EXPIRY_LIMIT": 365}})
class LegalConsentSerializerTest(TestCase):
    """Test cases for LegalConsentSerializer"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        # Get the agreement created by the signal
        self.agreement = LegalConsent.objects.get(user=self.user)

    def test_serializer_fields_present(self):
        """Test that serializer contains all expected fields"""
        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        self.assertIsInstance(data, dict)
        self.assertIn("version", data)
        self.assertIn("accepted_at", data)
        self.assertIn("valid", data)
        self.assertEqual(len(data), 3)  # Three fields should be present

    def test_serializer_read_only_fields(self):
        """Test that is_valid field is read-only"""
        serializer = LegalConsentSerializer()
        meta = serializer.Meta

        self.assertIn("valid", meta.read_only_fields)
        self.assertEqual(meta.fields, ["version", "accepted_at", "valid"])

    def test_serialization_with_invalid_agreement(self):
        """Test serialization with invalid agreement (no version/accepted_at)"""
        # Initial agreement should be invalid (no version or accepted_at)
        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        self.assertIsNone(data["version"])
        self.assertIsNone(data["accepted_at"])
        self.assertFalse(data["valid"])

    def test_serialization_with_valid_agreement(self):
        """Test serialization with valid agreement"""
        # Renew the agreement to make it valid
        self.agreement.renew()

        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        self.assertEqual(data["version"], 1)
        self.assertIsNotNone(data["accepted_at"])
        self.assertTrue(data["valid"])

    def test_serialization_with_expired_agreement(self):
        """Test serialization with expired agreement"""
        # Set up an expired agreement (accepted long ago)
        self.agreement.version = 1
        self.agreement.accepted_at = timezone.now() - datetime.timedelta(
            days=400
        )  # Older than expiry limit
        self.agreement.save()

        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        self.assertEqual(data["version"], 1)
        self.assertIsNotNone(data["accepted_at"])
        self.assertFalse(data["valid"])

    def test_serialization_with_no_version(self):
        """Test serialization when agreement has no version"""
        self.agreement.version = None
        self.agreement.accepted_at = timezone.now()
        self.agreement.save()

        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        self.assertIsNone(data["version"])
        self.assertIsNotNone(data["accepted_at"])
        self.assertFalse(data["valid"])

    def test_serialization_with_no_accepted_at(self):
        """Test serialization when agreement has no accepted_at"""
        self.agreement.version = 1
        self.agreement.accepted_at = None
        self.agreement.save()

        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        self.assertEqual(data["version"], 1)
        self.assertIsNone(data["accepted_at"])
        self.assertFalse(data["valid"])

    def test_deserialization_with_valid_data(self):
        """Test deserialization with valid data"""
        valid_data = {
            "version": 1,
            "accepted_at": timezone.now().isoformat(),
        }

        serializer = LegalConsentSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())

    def test_deserialization_with_nullable_fields(self):
        """Test deserialization with None values for nullable fields"""
        data_with_nulls = {"version": None, "accepted_at": None}

        serializer = LegalConsentSerializer(data=data_with_nulls)
        self.assertTrue(serializer.is_valid())

    def test_is_valid_field_not_writable(self):
        """Test that is_valid field cannot be written to"""
        invalid_data = {
            "version": 1,
            "accepted_at": timezone.now().isoformat(),
            "is_valid": False,  # This should be ignored
        }

        serializer = LegalConsentSerializer(data=invalid_data)
        self.assertTrue(serializer.is_valid())
        # is_valid should not be in validated_data since it's read-only
        self.assertNotIn("valid", serializer.validated_data)

    def test_serializer_with_different_agreement_instances(self):
        """Test serializer works with different LegalConsent instances"""
        # Create another user and agreement
        user2 = User.objects.create_user(
            username="testuser2", email="test2@example.com", password="testpass123"
        )
        agreement2 = LegalConsent.objects.get(user=user2)

        # Renew one agreement but not the other
        self.agreement.renew()

        serializer1 = LegalConsentSerializer(self.agreement)
        serializer2 = LegalConsentSerializer(agreement2)

        data1 = serializer1.data
        data2 = serializer2.data

        self.assertEqual(data1["version"], 1)
        self.assertIsNotNone(data1["accepted_at"])
        self.assertTrue(data1["valid"])

        self.assertIsNone(data2["version"])
        self.assertIsNone(data2["accepted_at"])
        self.assertFalse(data2["valid"])

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 2, "EXPIRY_LIMIT": 180}}
    )
    def test_serializer_respects_configuration_changes(self):
        """Test serializer reflects changes in LegalConsent configuration"""
        # Set up agreement with version 1
        self.agreement.version = 1
        self.agreement.accepted_at = timezone.now()
        self.agreement.save()

        # With current config (VERSION=2), this should be invalid
        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        self.assertEqual(data["version"], 1)
        self.assertIsNotNone(data["accepted_at"])
        self.assertFalse(data["valid"])  # Version 1 is outdated when current is 2

    def test_accepted_at_iso_format(self):
        """Test that accepted_at is properly formatted as ISO string"""
        # Renew the agreement to get an accepted_at value
        self.agreement.renew()

        serializer = LegalConsentSerializer(self.agreement)
        data = serializer.data

        # Check that accepted_at is a string and can be parsed as ISO datetime
        accepted_at_str = data["accepted_at"]
        self.assertIsInstance(accepted_at_str, str)

        # Should be able to parse the ISO string back to datetime
        parsed_datetime = datetime.datetime.fromisoformat(
            accepted_at_str.replace("Z", "+00:00")
        )
        self.assertIsInstance(parsed_datetime, datetime.datetime)
