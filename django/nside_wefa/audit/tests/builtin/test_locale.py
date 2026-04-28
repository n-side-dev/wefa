"""Tests for the ``locale`` built-in audit source."""

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.test import TestCase

from nside_wefa.locale.models import UserLocale


class LocaleBuiltinSourceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice")

    def _events(self):
        return LogEntry.objects.filter(additional_data__action="locale.change")

    def test_no_event_for_initial_creation(self):
        # The legal_consent / locale post_save signals create empty rows on
        # User creation; that should not yield a locale.change event.
        self.assertEqual(self._events().count(), 0)

    def test_setting_code_emits_change_event(self):
        locale = UserLocale.objects.get(user=self.user)
        locale.code = "fr"
        locale.save()

        self.assertEqual(self._events().count(), 1)
        last = self._events().order_by("-id").first()
        self.assertEqual(last.actor_id, self.user.id)
        self.assertEqual(last.changes["code"]["from"], None)
        self.assertEqual(last.changes["code"]["to"], "fr")

    def test_unchanged_save_does_not_emit(self):
        locale = UserLocale.objects.get(user=self.user)
        locale.code = "fr"
        locale.save()
        before = self._events().count()
        locale.save()  # same code
        self.assertEqual(self._events().count(), before)

    def test_change_diff_chains(self):
        locale = UserLocale.objects.get(user=self.user)
        locale.code = "fr"
        locale.save()
        locale.code = "en"
        locale.save()

        events = list(self._events().order_by("id"))
        self.assertEqual(events[-1].changes, {"code": {"from": "fr", "to": "en"}})
