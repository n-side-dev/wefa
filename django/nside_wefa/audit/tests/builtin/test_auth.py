"""Tests for the ``auth`` built-in audit source."""

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.contrib.auth.signals import (
    user_logged_in,
    user_logged_out,
    user_login_failed,
)
from django.test import RequestFactory, TestCase


class AuthBuiltinSourceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pw")
        self.factory = RequestFactory()

    def _action_count(self, action: str) -> int:
        return LogEntry.objects.filter(additional_data__action=action).count()

    def test_login_emits_audit_event(self):
        before = self._action_count("auth.login")
        user_logged_in.send(sender=User, request=self.factory.get("/"), user=self.user)
        self.assertEqual(self._action_count("auth.login"), before + 1)

    def test_logout_emits_audit_event(self):
        before = self._action_count("auth.logout")
        user_logged_out.send(sender=User, request=self.factory.get("/"), user=self.user)
        self.assertEqual(self._action_count("auth.logout"), before + 1)

    def test_login_failed_emits_audit_event_with_failure_outcome(self):
        before = self._action_count("auth.login_failed")
        user_login_failed.send(
            sender=User, credentials={"username": "alice"}, request=None
        )
        self.assertEqual(self._action_count("auth.login_failed"), before + 1)

        last = (
            LogEntry.objects.filter(additional_data__action="auth.login_failed")
            .order_by("-id")
            .first()
        )
        self.assertEqual(last.additional_data.get("outcome"), "failure")
        self.assertEqual(
            last.additional_data.get("metadata", {}).get("username"), "alice"
        )
