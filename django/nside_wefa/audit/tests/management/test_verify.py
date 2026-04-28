"""Tests for ``manage.py wefa_audit_verify``."""

from io import StringIO

from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import connection
from django.test import TestCase, override_settings

from nside_wefa.audit.immutability import allow_purge
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

    def test_post_purge_chain_verifies_clean(self):
        """Regression: after wefa_audit_purge, the new earliest row's
        prev_hash points at a deleted ancestor — verification must still
        report "Chain intact" by treating that row as the anchor."""
        first = self._make(repr_value="head")
        self._make(repr_value="middle")
        self._make(repr_value="tail")

        # Simulate a retention purge of the chain head.
        with allow_purge():
            WefaLogEntry.objects.filter(pk=first.pk).delete()

        out = StringIO()
        call_command("wefa_audit_verify", stdout=out)
        self.assertIn("Chain intact", out.getvalue())

    def test_post_purge_tampering_still_detected(self):
        """Tampering with a non-anchor row remains detectable after purge."""
        first = self._make(repr_value="head")
        self._make(repr_value="middle")
        tail = self._make(repr_value="tail")

        with allow_purge():
            WefaLogEntry.objects.filter(pk=first.pk).delete()

        # Mutate the tail's content; the anchor (middle) is fine, but the
        # middle→tail chain link no longer matches the recomputed hash.
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE audit_wefalogentry SET object_repr = 'tampered' WHERE id = %s",
                [tail.pk],
            )

        err = StringIO()
        with self.assertRaises(SystemExit):
            call_command("wefa_audit_verify", stdout=StringIO(), stderr=err)
        # Self-consistency check fires first on the tampered row.
        self.assertIn("hash mismatch", err.getvalue())
        self.assertIn(f"id={tail.pk}", err.getvalue())

    def test_post_purge_anchor_tampering_detected(self):
        """Tampering with the post-purge anchor row also fires the
        self-consistency check (its own hash no longer matches its content)."""
        first = self._make(repr_value="head")
        middle = self._make(repr_value="middle")
        self._make(repr_value="tail")

        with allow_purge():
            WefaLogEntry.objects.filter(pk=first.pk).delete()

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE audit_wefalogentry SET object_repr = 'tampered' WHERE id = %s",
                [middle.pk],
            )

        err = StringIO()
        with self.assertRaises(SystemExit):
            call_command("wefa_audit_verify", stdout=StringIO(), stderr=err)
        self.assertIn("hash mismatch", err.getvalue())
        self.assertIn(f"id={middle.pk}", err.getvalue())

    def test_strict_head_succeeds_on_intact_chain(self):
        """`--strict-head` is satisfied when the chain origin is still present."""
        for i in range(3):
            self._make(repr_value=f"r{i}")
        out = StringIO()
        call_command("wefa_audit_verify", "--strict-head", stdout=out)
        self.assertIn("Chain intact", out.getvalue())

    def test_strict_head_fails_after_purge(self):
        """`--strict-head` fails loudly when the chain origin is gone."""
        first = self._make(repr_value="head")
        self._make(repr_value="middle")

        with allow_purge():
            WefaLogEntry.objects.filter(pk=first.pk).delete()

        err = StringIO()
        with self.assertRaises(SystemExit):
            call_command(
                "wefa_audit_verify",
                "--strict-head",
                stdout=StringIO(),
                stderr=err,
            )
        self.assertIn("non-zero prev_hash", err.getvalue())


class VerifyDisabledTest(TestCase):
    @override_settings(NSIDE_WEFA={"APP_NAME": "T", "AUDIT": {"TAMPER_EVIDENT": False}})
    def test_raises_when_disabled(self):
        with self.assertRaises(CommandError):
            call_command("wefa_audit_verify", stdout=StringIO())
