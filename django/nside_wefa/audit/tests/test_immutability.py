"""Tests for the audit-event immutability guard."""

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.db import transaction
from django.test import TestCase

from nside_wefa import audit
from nside_wefa.audit.immutability import allow_purge, AuditEventImmutableError


class LogEntryImmutabilityTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u")
        self.entry = audit.log("demo.act", actor=self.user)

    def test_save_on_existing_entry_raises(self):
        self.entry.cid = "tampered"
        with transaction.atomic(), self.assertRaises(AuditEventImmutableError):
            self.entry.save()

    def test_delete_raises(self):
        with transaction.atomic(), self.assertRaises(AuditEventImmutableError):
            self.entry.delete()

    def test_queryset_delete_raises(self):
        with transaction.atomic(), self.assertRaises(AuditEventImmutableError):
            LogEntry.objects.filter(pk=self.entry.pk).delete()

    def test_create_is_allowed(self):
        another = audit.log("demo.act2", actor=self.user)
        self.assertIsNotNone(another.pk)

    def test_allow_purge_bypasses_guard(self):
        with allow_purge():
            LogEntry.objects.filter(pk=self.entry.pk).delete()
        self.assertFalse(LogEntry.objects.filter(pk=self.entry.pk).exists())

    def test_allow_purge_resets_after_block(self):
        with allow_purge():
            pass
        with transaction.atomic(), self.assertRaises(AuditEventImmutableError):
            self.entry.delete()


class WefaLogEntryImmutabilityTest(TestCase):
    """The guard applies to every concrete subclass of AbstractLogEntry."""

    def setUp(self):
        from django.contrib.contenttypes.models import ContentType

        from nside_wefa.audit.models import WefaLogEntry

        self.WefaLogEntry = WefaLogEntry
        self.entry = WefaLogEntry.objects.create(
            action=LogEntry.Action.UPDATE,
            content_type=ContentType.objects.get_for_model(LogEntry),
            object_pk="0",
            object_repr="test",
            additional_data={"action": "test"},
        )

    def test_save_raises(self):
        self.entry.cid = "x"
        with transaction.atomic(), self.assertRaises(AuditEventImmutableError):
            self.entry.save()

    def test_delete_raises(self):
        with transaction.atomic(), self.assertRaises(AuditEventImmutableError):
            self.entry.delete()

    def test_purge_bypasses_for_wefa_log_entry(self):
        with allow_purge():
            self.entry.delete()
        self.assertFalse(self.WefaLogEntry.objects.filter(pk=self.entry.pk).exists())
