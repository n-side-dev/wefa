"""Tests for the public ``audit.log()`` Python API."""

from unittest import mock

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase, override_settings

from nside_wefa import audit
from nside_wefa.audit.api import _redact, AuditWriteError, Outcome


class LogTargetResolutionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u", email="u@example.com")

    def test_log_with_explicit_target_records_target(self):
        event = audit.log("demo.act", actor=self.user, target=self.user)
        self.assertEqual(event.object_repr, str(self.user))
        ct = ContentType.objects.get_for_model(User)
        self.assertEqual(event.content_type_id, ct.id)
        self.assertEqual(event.actor_id, self.user.id)

    def test_log_with_actor_only_uses_actor_as_target(self):
        event = audit.log("demo.act", actor=self.user)
        self.assertEqual(event.object_repr, str(self.user))

    def test_log_without_actor_or_target_uses_system_sentinel(self):
        event = audit.log("demo.system_event")
        self.assertEqual(event.object_repr, "system")
        ct = ContentType.objects.get_for_model(LogEntry)
        self.assertEqual(event.content_type_id, ct.id)

    def test_explicit_actor_none_marks_system(self):
        event = audit.log("demo.system_event", actor=None)
        self.assertIsNone(event.actor_id)


class LogPayloadTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u")

    def test_action_name_lands_in_additional_data(self):
        event = audit.log("demo.act", actor=self.user)
        self.assertEqual(event.additional_data["action"], "demo.act")
        self.assertEqual(event.additional_data["outcome"], Outcome.SUCCESS.value)

    def test_changes_are_stored(self):
        event = audit.log(
            "demo.act",
            actor=self.user,
            changes={"status": {"from": "open", "to": "closed"}},
        )
        self.assertEqual(event.changes, {"status": {"from": "open", "to": "closed"}})

    def test_metadata_lands_under_additional_data(self):
        event = audit.log("demo.act", actor=self.user, metadata={"reason": "manual"})
        self.assertEqual(event.additional_data["metadata"], {"reason": "manual"})

    def test_outcome_failure_is_recorded(self):
        event = audit.log("demo.act", actor=self.user, outcome=Outcome.FAILURE)
        self.assertEqual(event.additional_data["outcome"], Outcome.FAILURE.value)


class RedactionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u")

    def test_default_fields_are_redacted(self):
        event = audit.log(
            "demo.act",
            actor=self.user,
            metadata={"password": "p", "ok": "v"},
        )
        meta = event.additional_data["metadata"]
        self.assertEqual(meta["password"], "[REDACTED]")
        self.assertEqual(meta["ok"], "v")

    def test_redaction_is_case_insensitive_and_recursive(self):
        out = _redact(
            {"Token": "x", "nested": {"AUTHORIZATION": "y", "kept": "z"}},
            ["token", "authorization"],
        )
        self.assertEqual(out["Token"], "[REDACTED]")
        self.assertEqual(out["nested"]["AUTHORIZATION"], "[REDACTED]")
        self.assertEqual(out["nested"]["kept"], "z")

    @override_settings(
        NSIDE_WEFA={
            "APP_NAME": "T",
            "AUDIT": {"REDACT_FIELDS": ["custom"]},
        }
    )
    def test_settings_override_default_redact_fields(self):
        event = audit.log(
            "demo.act",
            actor=self.user,
            metadata={"password": "still-visible", "custom": "redacted"},
        )
        meta = event.additional_data["metadata"]
        self.assertEqual(meta["password"], "still-visible")
        self.assertEqual(meta["custom"], "[REDACTED]")


class FailureHandlingTest(TestCase):
    """Failure-mode contract: warn-and-continue by default; raise when asked."""

    def setUp(self):
        self.user = User.objects.create_user(username="u")

    def test_default_returns_none_and_warns(self):
        with mock.patch.object(
            LogEntry.objects, "create", side_effect=RuntimeError("boom")
        ):
            with self.assertLogs("nside_wefa.audit", level="WARNING") as logs:
                result = audit.log("demo.fail", actor=self.user)
        self.assertIsNone(result)
        self.assertTrue(any("failed to persist" in msg for msg in logs.output))

    @override_settings(
        NSIDE_WEFA={
            "APP_NAME": "T",
            "AUDIT": {"RAISE_ON_FAILURE": True},
        }
    )
    def test_raise_on_failure_reraises_as_audit_write_error(self):
        with mock.patch.object(
            LogEntry.objects, "create", side_effect=RuntimeError("boom")
        ):
            with self.assertRaises(AuditWriteError):
                audit.log("demo.fail", actor=self.user)


class SetActorReExportTest(TestCase):
    def test_set_actor_is_a_context_manager_that_attributes_events(self):
        from nside_wefa.audit import set_actor

        user = User.objects.create_user(username="ctx")

        with set_actor(user):
            event = audit.log("demo.via_ctx", target=user)
        self.assertEqual(event.actor_id, user.id)


@override_settings(AUDITLOG_LOGENTRY_MODEL="audit.WefaLogEntry")
class TamperEvidentWritePathTest(TestCase):
    """Regression: ``audit.log()`` must write to the active LogEntry model.

    When ``AUDITLOG_LOGENTRY_MODEL`` swaps the storage class, manual
    ``audit.log()`` calls (and the built-in event sources that delegate to
    them) need to land rows in the swapped table. Hard-coding
    ``LogEntry.objects.create`` would silently drop those events into the
    unused base table when ``RAISE_ON_FAILURE`` is False, leaving them
    invisible to the REST endpoints and outside the hash chain.
    """

    def test_log_writes_to_wefa_log_entry_when_swapped(self):
        from nside_wefa.audit.models import WefaLogEntry

        user = User.objects.create_user(username="te")

        before_wefa = WefaLogEntry.objects.count()
        event = audit.log("demo.tamper_evident", actor=user)

        # The row must land in the swapped model — not silently dropped into
        # the now-disabled base table (auditlog raises AttributeError when you
        # try to use the swapped-out base manager, so accessing it here would
        # itself signal regression).
        self.assertIsNotNone(event)
        self.assertIsInstance(event, WefaLogEntry)
        self.assertEqual(WefaLogEntry.objects.count(), before_wefa + 1)

        # Hash chain populated by the WefaLogEntry pre_save handler.
        event.refresh_from_db()
        self.assertEqual(len(event.hash), 64)
        self.assertEqual(len(event.prev_hash), 64)

    def test_system_event_uses_active_model_for_sentinel_content_type(self):
        """The "system" sentinel ContentType reflects the active LogEntry model."""
        from nside_wefa.audit.models import WefaLogEntry

        event = audit.log("demo.system_under_te")

        self.assertIsInstance(event, WefaLogEntry)
        self.assertEqual(event.object_repr, "system")
        self.assertEqual(event.content_type.model, "wefalogentry")
