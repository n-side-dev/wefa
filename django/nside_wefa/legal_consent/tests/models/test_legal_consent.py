import datetime
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.utils import timezone

from nside_wefa.legal_consent.models import LegalConsent
from nside_wefa.legal_consent.models.legal_consent import create_legal_consent


class LegalConsentModelTest(TestCase):
    """Test cases for the LegalConsent model."""

    def setUp(self):
        """Set up test data."""
        # Clear any existing agreements to avoid conflicts
        LegalConsent.objects.all().delete()

        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_legal_consent_creation(self):
        """Test that LegalConsent can be created."""
        # Use the auto-created agreement from signal and update it
        agreement = self.user.legalconsent
        agreement.version = 1
        agreement.expires_at = timezone.now() + timedelta(days=365)
        agreement.save()

        self.assertEqual(agreement.user, self.user)
        self.assertEqual(agreement.version, 1)
        self.assertIsNotNone(agreement.expires_at)

    def test_legal_consent_str_representation(self):
        """Test the string representation of LegalConsent."""
        agreement = self.user.legalconsent
        expected_str = f"Legal Consent for {self.user.username}"
        self.assertEqual(str(agreement), expected_str)

    def test_legal_consent_one_to_one_relationship(self):
        """Test that LegalConsent has one-to-one relationship with User."""
        legal_consent = self.user.legalconsent

        # Access agreement through user
        self.assertEqual(self.user.legalconsent, legal_consent)

        # Verify only one agreement can exist per user
        with self.assertRaises(Exception):
            LegalConsent.objects.create(user=self.user)

    def test_legal_consent_cascade_deletion(self):
        """Test that LegalConsent is deleted when User is deleted."""
        agreement = self.user.legalconsent
        agreement_id = agreement.id

        # Delete user
        self.user.delete()

        # Verify agreement is also deleted
        self.assertFalse(LegalConsent.objects.filter(id=agreement_id).exists())

    def test_legal_consent_optional_fields(self):
        """Test that version and accepted_at fields are optional."""
        agreement = self.user.legalconsent

        self.assertIsNone(agreement.version)
        self.assertIsNone(agreement.accepted_at)


class LegalConsentSignalHandlerTest(TestCase):
    """Test cases for Legal Consent signal handlers."""

    def test_signal_creates_legal_consent_for_new_user(self):
        """Test that creating a new user automatically creates a LegalConsent."""
        # Verify no agreements exist initially
        self.assertEqual(LegalConsent.objects.count(), 0)

        # Create a new user
        user = User.objects.create_user(
            username="newuser", email="newuser@example.com", password="newpass123"
        )

        # Verify Legal Consent was created
        self.assertEqual(LegalConsent.objects.count(), 1)
        agreement = LegalConsent.objects.get(user=user)
        self.assertEqual(agreement.user, user)

    def test_signal_does_not_trigger_on_user_update(self):
        """Test that updating an existing user doesn't create additional agreements."""
        # Create user (which creates agreement via signal)
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        initial_count = LegalConsent.objects.count()

        # Update user
        user.email = "updated@example.com"
        user.save()

        # Verify no additional agreements were created
        self.assertEqual(LegalConsent.objects.count(), initial_count)

    def test_signal_handler_function_directly(self):
        """Test the create_legal_consent function directly."""
        user = User.objects.create_user(
            username="directtest", email="direct@example.com", password="directpass123"
        )

        # Delete the auto-created agreement to test the function directly
        LegalConsent.objects.filter(user=user).delete()

        # Call the signal handler function directly
        create_legal_consent(None, user, created=True)

        # Verify agreement was created
        self.assertTrue(LegalConsent.objects.filter(user=user).exists())

    def test_signal_handler_ignores_existing_users(self):
        """Test that signal handler doesn't create agreements for non-created users."""
        user = User.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="existingpass123",
        )

        initial_count = LegalConsent.objects.count()

        # Call signal handler with created=False
        create_legal_consent(None, user, created=False)

        # Verify no additional agreements were created
        self.assertEqual(LegalConsent.objects.count(), initial_count)


class LegalConsentIntegrationTest(TestCase):
    """Integration tests for LegalConsent app functionality."""

    def test_complete_user_lifecycle_with_legal_consent(self):
        """Test complete user lifecycle including LegalConsent agreement management."""
        # Create user
        user = User.objects.create_user(
            username="lifecycleuser",
            email="lifecycle@example.com",
            password="lifecyclepass123",
        )

        # Verify LegalConsent agreement was auto-created
        self.assertTrue(hasattr(user, "legalconsent"))
        agreement = user.legalconsent

        # Update LegalConsent agreement with version and acceptance date
        agreement.version = 1
        agreement.accepted_at = timezone.now()
        agreement.save()

        # Verify updates
        agreement.refresh_from_db()
        self.assertEqual(agreement.version, 1)
        self.assertIsNotNone(agreement.accepted_at)

        # Verify agreement survives user updates
        user.first_name = "Test"
        user.save()

        agreement.refresh_from_db()
        self.assertEqual(agreement.version, 1)

        # Verify agreement is deleted when user is deleted
        agreement_id = agreement.id
        user.delete()
        self.assertFalse(LegalConsent.objects.filter(id=agreement_id).exists())

    def test_multiple_users_legal_consents(self):
        """Test LegalConsent agreements for multiple users."""
        users = []
        for i in range(5):
            user = User.objects.create_user(
                username=f"user{i}", email=f"user{i}@example.com", password=f"pass{i}"
            )
            users.append(user)

        # Verify all users have LegalConsent agreements
        self.assertEqual(LegalConsent.objects.count(), 5)

        for user in users:
            self.assertTrue(hasattr(user, "legalconsent"))
            agreement = user.legalconsent
            self.assertEqual(agreement.user, user)


class LegalConsentDummyAppIntegrationTest(TestCase):
    """Test that demonstrates how a dummy Django app would use LegalConsent features."""

    def setUp(self):
        """Set up test data for dummy app integration."""
        self.test_users_data = [
            ("john_doe", "john@example.com"),
            ("jane_smith", "jane@example.com"),
            ("bob_wilson", "bob@example.com"),
        ]

    def test_dummy_app_user_registration_with_legal_consent(self):
        """Test user registration in a dummy app with LegalConsent integration."""
        # Simulate a dummy app creating users
        created_users = []

        for username, email in self.test_users_data:
            # This is how a dummy app would create users
            user = User.objects.create_user(
                username=username, email=email, password="dummypass123"
            )
            created_users.append(user)

            # Verify LegalConsent agreement was automatically created
            self.assertTrue(hasattr(user, "legalconsent"))
            agreement = user.legalconsent
            self.assertIsNotNone(agreement)
            self.assertEqual(agreement.user, user)

        # Verify all users have LegalConsent
        self.assertEqual(len(created_users), 3)
        self.assertEqual(LegalConsent.objects.count(), 3)

    def test_dummy_app_legal_consent_compliance_workflow(self):
        """Test a complete Legal Consent workflow in a dummy app."""
        # Step 1: Create user (LegalConsent auto-created)
        user = User.objects.create_user(
            username="compliance_user",
            email="compliance@example.com",
            password="compliancepass123",
        )

        # Step 2: Update LegalConsent agreement with version (simulating user consent)
        agreement = user.legalconsent
        agreement.version = 1
        agreement.expires_at = timezone.now() + timedelta(days=365)
        agreement.save()

        # Step 3: Verify compliance data
        self.assertEqual(agreement.version, 1)
        self.assertIsNotNone(agreement.expires_at)

        # Step 4: Simulate LegalConsent agreement update (new version)
        agreement.version = 2
        agreement.expires_at = timezone.now() + timedelta(days=730)  # 2 years
        agreement.save()

        # Step 5: Verify updated compliance
        agreement.refresh_from_db()
        self.assertEqual(agreement.version, 2)

        user_id = user.id
        agreement_id = agreement.id
        user.delete()

        # Step 7: Verify complete data removal
        self.assertFalse(User.objects.filter(id=user_id).exists())
        self.assertFalse(LegalConsent.objects.filter(id=agreement_id).exists())

    def test_dummy_app_bulk_user_operations_with_legal_consent(self):
        """Test bulk user operations in a dummy app with LegalConsent."""
        # Simulate bulk user creation
        users = User.objects.bulk_create(
            [
                User(username=f"bulk_user_{i}", email=f"bulk{i}@example.com")
                for i in range(3)
            ]
        )

        # Note: bulk_create doesn't trigger signals, so we need to handle LegalConsent agreements manually
        # This demonstrates how a dummy app might handle bulk operations
        for user in users:
            if not hasattr(user, "legalconsent"):
                LegalConsent.objects.create(user=user)

        # Verify all users have LegalConsent agreements
        for user in users:
            user.refresh_from_db()  # Refresh to get the related object
            agreement = LegalConsent.objects.get(user=user)
            self.assertIsNotNone(agreement)
            self.assertEqual(agreement.user, user)


class LegalConsentRenewTest(TestCase):
    """Test cases for the LegalConsent renew method."""

    def setUp(self) -> None:
        """Set up test data."""
        self.user = User.objects.create_user(
            username="renewtestuser",
            email="renewtest@example.com",
            password="renewpass123",
        )
        self.agreement = self.user.legalconsent

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 2, "EXPIRY_LIMIT": 365}}
    )
    def test_renew_with_valid_configuration(self) -> None:
        """Test successful renewal with valid LegalConsent configuration."""
        # Set initial values
        self.agreement.version = 1
        initial_accepted_at = timezone.now() - timedelta(days=30)
        self.agreement.accepted_at = initial_accepted_at
        self.agreement.save()

        # Renew the agreement - patch the datetime module used in the model
        with patch(
            "nside_wefa.legal_consent.models.legal_consent.datetime"
        ) as mock_datetime:
            mock_now = datetime.datetime(
                2025, 9, 12, 16, 32, tzinfo=datetime.timezone.utc
            )
            mock_datetime.datetime.now.return_value = mock_now
            mock_datetime.timezone = datetime.timezone
            mock_datetime.timedelta = datetime.timedelta

            self.agreement.renew()

        # Verify the renewal updated the fields correctly
        self.agreement.refresh_from_db()
        self.assertEqual(self.agreement.version, 2)

        # Verify accepted_at was set to the current time (not calculated expiry)
        self.assertEqual(self.agreement.accepted_at, mock_now)

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 3, "EXPIRY_LIMIT": 730}}
    )
    def test_renew_with_different_configuration_values(self) -> None:
        """Test renewal with different configuration values."""
        # Set initial values
        self.agreement.version = 1
        self.agreement.accepted_at = timezone.now() - timedelta(days=30)
        self.agreement.save()

        # Renew with different configuration
        with patch(
            "nside_wefa.legal_consent.models.legal_consent.datetime"
        ) as mock_datetime:
            mock_now = datetime.datetime(
                2025, 9, 12, 16, 32, tzinfo=datetime.timezone.utc
            )
            mock_datetime.datetime.now.return_value = mock_now
            mock_datetime.timezone = datetime.timezone
            mock_datetime.timedelta = datetime.timedelta

            self.agreement.renew()

        # Verify the renewal used the new configuration
        self.agreement.refresh_from_db()
        self.assertEqual(self.agreement.version, 3)

        # Verify accepted_at was set to the current time
        self.assertEqual(self.agreement.accepted_at, mock_now)

    @override_settings(NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 1, "EXPIRY_LIMIT": 1}})
    def test_renew_with_minimal_expiration(self) -> None:
        """Test renewal with minimal expiration period (1 day)."""
        with patch(
            "nside_wefa.legal_consent.models.legal_consent.datetime"
        ) as mock_datetime:
            mock_now = datetime.datetime(
                2025, 9, 12, 16, 32, tzinfo=datetime.timezone.utc
            )
            mock_datetime.datetime.now.return_value = mock_now
            mock_datetime.timezone = datetime.timezone
            mock_datetime.timedelta = datetime.timedelta

            self.agreement.renew()

        # Verify the renewal worked with minimal expiration
        self.agreement.refresh_from_db()
        self.assertEqual(self.agreement.version, 1)

        # Verify accepted_at was set to the current time
        self.assertEqual(self.agreement.accepted_at, mock_now)

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 5, "EXPIRY_LIMIT": 365}}
    )
    def test_renew_saves_to_database(self) -> None:
        """Test that renewal saves changes to the database."""
        # Get initial database state
        initial_version = self.agreement.version
        initial_accepted_at = self.agreement.accepted_at

        # Renew the agreement
        self.agreement.renew()

        # Create a new instance from database to verify save occurred
        fresh_agreement = LegalConsent.objects.get(id=self.agreement.id)

        # Verify the database was updated
        self.assertNotEqual(fresh_agreement.version, initial_version)
        self.assertNotEqual(fresh_agreement.accepted_at, initial_accepted_at)
        self.assertEqual(fresh_agreement.version, 5)
        self.assertIsNotNone(fresh_agreement.accepted_at)

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 2, "EXPIRY_LIMIT": 365}}
    )
    def test_renew_with_none_initial_values(self) -> None:
        """Test renewal when agreement has None values initially."""
        # Ensure initial values are None
        self.agreement.version = None
        self.agreement.accepted_at = None
        self.agreement.save()

        # Renew the agreement
        self.agreement.renew()

        # Verify renewal worked even with None initial values
        self.agreement.refresh_from_db()
        self.assertEqual(self.agreement.version, 2)
        self.assertIsNotNone(self.agreement.accepted_at)

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 10, "EXPIRY_LIMIT": 365}}
    )
    def test_renew_timezone_handling(self) -> None:
        """Test that renewal handles timezone correctly."""
        # Use a specific timezone-aware datetime for testing
        with patch(
            "nside_wefa.legal_consent.models.legal_consent.datetime"
        ) as mock_datetime:
            mock_now = datetime.datetime(
                2025, 9, 12, 16, 32, 15, tzinfo=datetime.timezone.utc
            )
            mock_datetime.datetime.now.return_value = mock_now
            mock_datetime.timezone = datetime.timezone
            mock_datetime.timedelta = datetime.timedelta

            self.agreement.renew()

        # Verify the accepted_at date is timezone-aware
        self.agreement.refresh_from_db()
        if self.agreement.accepted_at is not None:
            self.assertIsNotNone(self.agreement.accepted_at.tzinfo)
            self.assertEqual(self.agreement.accepted_at.tzinfo, datetime.timezone.utc)

        # Verify accepted_at was set to the current time
        self.assertEqual(self.agreement.accepted_at, mock_now)


class LegalConsentConfigurationTest(TestCase):
    """Test cases for the _LegalConsentConfiguration class."""

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 2, "EXPIRY_LIMIT": 365}}
    )
    def test_legal_consent_configuration_successful_initialization(self) -> None:
        """Test successful initialization of _LegalConsentConfiguration with valid settings."""
        from nside_wefa.legal_consent.models.legal_consent import (
            _LegalConsentConfiguration,
        )

        config = _LegalConsentConfiguration()

        self.assertEqual(config.version, 2)
        self.assertEqual(config.expiry_limit, 365)

    @override_settings(
        NSIDE_WEFA={"LEGAL_CONSENT": {"VERSION": 10, "EXPIRY_LIMIT": 730}}
    )
    def test_legal_consent_configuration_different_values(self) -> None:
        """Test _LegalConsentConfiguration with different configuration values."""
        from nside_wefa.legal_consent.models.legal_consent import (
            _LegalConsentConfiguration,
        )

        config = _LegalConsentConfiguration()

        self.assertEqual(config.version, 10)
        self.assertEqual(config.expiry_limit, 730)
