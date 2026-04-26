"""Tests for audit-event serializers."""

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.test import TestCase

from nside_wefa import audit
from nside_wefa.audit.serializers import (
    AuditEventIntegritySerializer,
    AuditEventSerializer,
)


class AuditEventSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="actor")
        self.event = audit.log(
            "demo.act",
            actor=self.user,
            target=self.user,
            metadata={"k": "v"},
        )

    def test_exposes_expected_fields(self):
        data = AuditEventSerializer(self.event).data
        for key in (
            "id",
            "timestamp",
            "action",
            "actor",
            "actor_id",
            "target",
            "target_type",
            "target_id",
            "changes",
            "outcome",
            "metadata",
        ):
            self.assertIn(key, data)

    def test_action_falls_back_to_auditlog_label_when_unset(self):
        # Bypass audit.log() to write a row without our action key.
        from django.contrib.contenttypes.models import ContentType

        entry = LogEntry.objects.create(
            action=LogEntry.Action.CREATE,
            content_type=ContentType.objects.get_for_model(User),
            object_pk=str(self.user.pk),
            object_repr=str(self.user),
        )
        data = AuditEventSerializer(entry).data
        self.assertEqual(data["action"], "create")

    def test_outcome_default_is_success_when_missing(self):
        from django.contrib.contenttypes.models import ContentType

        entry = LogEntry.objects.create(
            action=LogEntry.Action.UPDATE,
            content_type=ContentType.objects.get_for_model(User),
            object_pk=str(self.user.pk),
            object_repr=str(self.user),
        )
        data = AuditEventSerializer(entry).data
        self.assertEqual(data["outcome"], "success")

    def test_target_type_is_app_label_dot_model(self):
        data = AuditEventSerializer(self.event).data
        self.assertEqual(data["target_type"], "auth.user")

    def test_metadata_is_extracted(self):
        data = AuditEventSerializer(self.event).data
        self.assertEqual(data["metadata"], {"k": "v"})


class AuditEventIntegritySerializerTest(TestCase):
    def test_includes_hash_chain_columns(self):
        from django.contrib.contenttypes.models import ContentType

        from nside_wefa.audit.models import WefaLogEntry

        entry = WefaLogEntry.objects.create(
            action=LogEntry.Action.UPDATE,
            content_type=ContentType.objects.get_for_model(LogEntry),
            object_pk="0",
            object_repr="x",
        )
        data = AuditEventIntegritySerializer(entry).data
        self.assertIn("prev_hash", data)
        self.assertIn("hash", data)
        self.assertEqual(data["prev_hash"], entry.prev_hash)
        self.assertEqual(data["hash"], entry.hash)
