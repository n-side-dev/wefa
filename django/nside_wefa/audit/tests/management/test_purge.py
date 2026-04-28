"""Tests for ``manage.py wefa_audit_purge``."""

import datetime
from io import StringIO

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from django.utils import timezone

from nside_wefa import audit


def _make_old_event(days_ago: int) -> LogEntry:
    user = User.objects.create_user(username=f"u{days_ago}")
    event = audit.log("demo.act", actor=user)
    LogEntry.objects.filter(pk=event.pk).update(
        timestamp=timezone.now() - datetime.timedelta(days=days_ago)
    )
    event.refresh_from_db()
    return event


class PurgeCommandTest(TestCase):
    def test_dry_run_does_not_delete(self):
        _make_old_event(40)
        out = StringIO()
        before = LogEntry.objects.count()
        call_command("wefa_audit_purge", "--days", "30", "--dry-run", stdout=out)
        self.assertEqual(LogEntry.objects.count(), before)
        self.assertIn("would delete", out.getvalue())

    def test_purges_old_events(self):
        old = _make_old_event(40)
        recent = audit.log("demo.act", actor=User.objects.create_user(username="r"))
        out = StringIO()
        call_command("wefa_audit_purge", "--days", "30", stdout=out)
        self.assertFalse(LogEntry.objects.filter(pk=old.pk).exists())
        self.assertTrue(LogEntry.objects.filter(pk=recent.pk).exists())
        self.assertIn("Deleted", out.getvalue())

    def test_missing_retention_raises(self):
        with self.assertRaises(CommandError):
            call_command("wefa_audit_purge", stdout=StringIO())

    def test_invalid_days_raises(self):
        with self.assertRaises(CommandError):
            call_command("wefa_audit_purge", "--days", "0", stdout=StringIO())

    @override_settings(
        NSIDE_WEFA={
            "APP_NAME": "T",
            "AUDIT": {"RETENTION_DAYS": 7},
        }
    )
    def test_uses_setting_when_days_omitted(self):
        old = _make_old_event(10)
        recent = audit.log("demo.act", actor=User.objects.create_user(username="rec"))
        call_command("wefa_audit_purge", stdout=StringIO())
        self.assertFalse(LogEntry.objects.filter(pk=old.pk).exists())
        self.assertTrue(LogEntry.objects.filter(pk=recent.pk).exists())
