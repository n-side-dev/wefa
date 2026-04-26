"""Tests for ``manage.py wefa_audit_verify``."""

from io import StringIO

from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection
from django.test import TestCase, override_settings

from nside_wefa.audit.models import WefaLogEntry


@override_settings(NSIDE_WEFA={"APP_NAME": "T", "AUDIT": {"TAMPER_EVIDENT": True}})
class VerifyCommandTest(TestCase):
    def _make(self, repr_value: str = "x") -> WefaLogEntry:
        return WefaLogEntry.objects.create(
            action=LogEntry.Action.UPDATE,
            content_type=ContentType.objects.get_for_model(LogEntry),
            object_pk="0",
            object_repr=repr_value,
        )

    def test_clean_chain_verifies(self):
        for i in range(3):
            self._make(repr_value=f"clean-{i}")
        out = StringIO()
        call_command("wefa_audit_verify", stdout=out)
        self.assertIn("Chain intact", out.getvalue())

    def test_tampered_row_detected(self):
        first = self._make(repr_value="first")
        self._make(repr_value="second")

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE audit_wefalogentry SET object_repr = 'tampered' WHERE id = %s",
                [first.pk],
            )

        err = StringIO()
        with self.assertRaises(SystemExit):
            call_command("wefa_audit_verify", stdout=StringIO(), stderr=err)
        self.assertIn("hash mismatch", err.getvalue())

    def test_tampered_prev_hash_detected(self):
        self._make(repr_value="first")
        second = self._make(repr_value="second")

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE audit_wefalogentry SET prev_hash = '%s' WHERE id = %%s"
                % ("a" * 64),
                [second.pk],
            )

        err = StringIO()
        with self.assertRaises(SystemExit):
            call_command("wefa_audit_verify", stdout=StringIO(), stderr=err)
        self.assertIn("prev_hash mismatch", err.getvalue())


class VerifyDisabledTest(TestCase):
    @override_settings(NSIDE_WEFA={"APP_NAME": "T", "AUDIT": {"TAMPER_EVIDENT": False}})
    def test_raises_when_disabled(self):
        with self.assertRaises(CommandError):
            call_command("wefa_audit_verify", stdout=StringIO())
