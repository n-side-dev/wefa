"""Tests for ``manage.py wefa_audit_export``."""

import csv
import json
from io import StringIO

from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from nside_wefa import audit


class ExportCommandTest(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice")
        self.bob = User.objects.create_user(username="bob")
        self.event_a = audit.log("demo.first", actor=self.alice, metadata={"k": 1})
        self.event_b = audit.log("demo.second", actor=self.alice, metadata={"k": 2})
        self.event_other = audit.log("demo.bob", actor=self.bob)

    def test_unknown_user_raises(self):
        with self.assertRaises(CommandError):
            call_command("wefa_audit_export", "--user", "10000000", stdout=StringIO())

    def test_json_export_returns_only_users_events_in_order(self):
        out = StringIO()
        call_command("wefa_audit_export", "--user", str(self.alice.pk), stdout=out)
        rows = json.loads(out.getvalue())
        ids = [row["id"] for row in rows]
        self.assertIn(self.event_a.id, ids)
        self.assertIn(self.event_b.id, ids)
        self.assertNotIn(self.event_other.id, ids)
        # Ordered by timestamp ascending — event_a written first.
        self.assertLess(ids.index(self.event_a.id), ids.index(self.event_b.id))

    def test_csv_export_emits_header_and_rows(self):
        out = StringIO()
        call_command(
            "wefa_audit_export",
            "--user",
            str(self.alice.pk),
            "--format",
            "csv",
            stdout=out,
        )
        reader = csv.DictReader(StringIO(out.getvalue()))
        rows = list(reader)
        self.assertGreaterEqual(len(rows), 2)
        self.assertSetEqual(
            set(reader.fieldnames or []),
            {
                "id",
                "timestamp",
                "action",
                "outcome",
                "target_repr",
                "target_pk",
                "changes",
                "metadata",
                "remote_addr",
                "cid",
            },
        )
