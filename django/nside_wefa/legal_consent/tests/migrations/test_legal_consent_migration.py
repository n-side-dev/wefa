import importlib
from django.contrib.auth.models import User
from django.apps import apps
from django.db import connection
from django.test import TransactionTestCase

from nside_wefa.legal_consent.models import LegalConsent


class LegalConsentMigrationTest(TransactionTestCase):
    """Test cases for LegalConsent migration functions."""

    def setUp(self):
        super().setUp()
        self.migration_module = importlib.import_module(
            "nside_wefa.legal_consent.migrations.0001_initial"
        )

    def test_create_legal_consents_for_existing_users(self):
        """Test that create_legal_consents_for_existing_users creates agreements for existing users."""

        # Create users using bulk_create to bypass signals
        users_data = [
            User(username="user1", email="user1@example.com", password="password1"),
            User(username="user2", email="user2@example.com", password="password2"),
            User(username="user3", email="user3@example.com", password="password3"),
        ]
        User.objects.bulk_create(users_data)

        self.assertEqual(User.objects.count(), 3)
        self.assertEqual(LegalConsent.objects.count(), 0)

        # Call the migration function directly
        self.migration_module.create_legal_consents_for_existing_users(
            apps, connection.schema_editor()
        )

        self.assertEqual(LegalConsent.objects.count(), 3)

        for user in User.objects.all():
            self.assertTrue(LegalConsent.objects.filter(user=user).exists())
            agreement = LegalConsent.objects.get(user=user)
            self.assertEqual(agreement.user, user)

    def test_reverse_create_legal_consents(self):
        """Test that reverse_create_legal_consents removes all LegalConsents."""
        # Create users using bulk_create to bypass signals
        users_data = [
            User(username="user1", email="user1@example.com", password="password1"),
            User(username="user2", email="user2@example.com", password="password2"),
        ]
        User.objects.bulk_create(users_data)

        # Create Legal Consents manually (bypassing signals)
        for user in User.objects.all():
            LegalConsent.objects.create(user=user)

        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(LegalConsent.objects.count(), 2)

        # Call the reverse migration function
        self.migration_module.reverse_create_legal_consents(
            apps, connection.schema_editor()
        )

        self.assertEqual(LegalConsent.objects.count(), 0)
        self.assertEqual(User.objects.count(), 2)
