from django.contrib.auth.models import User
from django.test import TestCase, override_settings

from nside_wefa.locale.models import UserLocale
from nside_wefa.locale.models.user_locale import (
    _LocaleConfiguration,
    create_user_locale,
)


class UserLocaleModelTest(TestCase):
    """Test cases for the UserLocale model."""

    def setUp(self):
        UserLocale.objects.all().delete()
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_user_locale_auto_created(self):
        """The signal handler creates a row on user creation."""
        self.assertTrue(hasattr(self.user, "userlocale"))
        user_locale = self.user.userlocale
        self.assertEqual(user_locale.user, self.user)
        self.assertIsNone(user_locale.code)

    def test_user_locale_str_representation(self):
        self.assertEqual(
            str(self.user.userlocale), f"User Locale for {self.user.username}"
        )

    def test_user_locale_one_to_one(self):
        with self.assertRaises(Exception):
            UserLocale.objects.create(user=self.user)

    def test_user_locale_cascade_deletion(self):
        user_locale_id = self.user.userlocale.id
        self.user.delete()
        self.assertFalse(UserLocale.objects.filter(id=user_locale_id).exists())

    def test_code_can_be_set(self):
        user_locale = self.user.userlocale
        user_locale.code = "fr"
        user_locale.save()
        user_locale.refresh_from_db()
        self.assertEqual(user_locale.code, "fr")


class UserLocaleSignalHandlerTest(TestCase):
    """Test cases for the post_save signal handler."""

    def test_signal_creates_user_locale_for_new_user(self):
        self.assertEqual(UserLocale.objects.count(), 0)
        user = User.objects.create_user(
            username="newuser", email="newuser@example.com", password="newpass123"
        )
        self.assertEqual(UserLocale.objects.count(), 1)
        self.assertEqual(UserLocale.objects.get(user=user).user, user)

    def test_signal_does_not_trigger_on_user_update(self):
        user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        initial_count = UserLocale.objects.count()
        user.email = "updated@example.com"
        user.save()
        self.assertEqual(UserLocale.objects.count(), initial_count)

    def test_signal_handler_ignores_non_created_users(self):
        user = User.objects.create_user(
            username="existing", email="existing@example.com", password="pass123"
        )
        initial_count = UserLocale.objects.count()
        create_user_locale(None, user, created=False)
        self.assertEqual(UserLocale.objects.count(), initial_count)


class LocaleConfigurationTest(TestCase):
    """Test cases for the _LocaleConfiguration helper."""

    @override_settings(
        NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en", "fr"], "DEFAULT": "en"}}
    )
    def test_reads_settings(self):
        config = _LocaleConfiguration()
        self.assertEqual(config.available, ["en", "fr"])
        self.assertEqual(config.default, "en")

    @override_settings(
        NSIDE_WEFA={"LOCALE": {"AVAILABLE": ["en", "fr", "nl"], "DEFAULT": "nl"}}
    )
    def test_reads_different_settings(self):
        config = _LocaleConfiguration()
        self.assertEqual(config.available, ["en", "fr", "nl"])
        self.assertEqual(config.default, "nl")
