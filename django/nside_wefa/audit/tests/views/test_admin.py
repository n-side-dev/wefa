"""Tests that the WeFa admin for LogEntry is read-only."""

from auditlog.models import LogEntry
from django.contrib import admin
from django.test import RequestFactory, TestCase

from nside_wefa.audit.admin import LogEntryAdmin


class LogEntryAdminTest(TestCase):
    def setUp(self):
        self.admin = LogEntryAdmin(LogEntry, admin.site)
        self.factory = RequestFactory()

    def test_admin_is_registered_for_log_entry(self):
        self.assertIs(admin.site._registry[LogEntry].__class__, LogEntryAdmin)

    def test_add_change_delete_permissions_are_denied(self):
        request = self.factory.get("/admin/")
        self.assertFalse(self.admin.has_add_permission(request))
        self.assertFalse(self.admin.has_change_permission(request))
        self.assertFalse(self.admin.has_delete_permission(request))

    def test_action_label_uses_wefa_metadata_when_present(self):
        from django.contrib.contenttypes.models import ContentType

        entry = LogEntry.objects.create(
            action=LogEntry.Action.UPDATE,
            content_type=ContentType.objects.get_for_model(LogEntry),
            object_pk="0",
            object_repr="x",
            additional_data={"action": "demo.something", "outcome": "denied"},
        )
        self.assertIn("demo.something", self.admin.action_label(entry))
        self.assertEqual(self.admin.outcome_label(entry), "denied")

    def test_actor_label_falls_back_to_system(self):
        from django.contrib.contenttypes.models import ContentType

        entry = LogEntry.objects.create(
            action=LogEntry.Action.UPDATE,
            content_type=ContentType.objects.get_for_model(LogEntry),
            object_pk="0",
            object_repr="x",
        )
        self.assertEqual(self.admin.actor_label(entry), "system")
