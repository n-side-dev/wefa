"""Tests for the ``legal_consent`` built-in audit source."""

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.test import TestCase

from nside_wefa.legal_consent.models import LegalConsent


class LegalConsentBuiltinSourceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice")

    def test_renew_emits_audit_event(self):
        # Auto-creation by legal_consent's signal must NOT emit a renew event.
        before = LogEntry.objects.filter(
            additional_data__action="legal_consent.renew"
        ).count()
        consent = LegalConsent.objects.get(user=self.user)
        self.assertEqual(
            LogEntry.objects.filter(
                additional_data__action="legal_consent.renew"
            ).count(),
            before,
        )

        consent.renew()
        after = LogEntry.objects.filter(
            additional_data__action="legal_consent.renew"
        ).count()
        self.assertEqual(after, before + 1)

        last = (
            LogEntry.objects.filter(additional_data__action="legal_consent.renew")
            .order_by("-id")
            .first()
        )
        self.assertEqual(last.actor_id, self.user.id)
        self.assertIn("version", last.additional_data["metadata"])
        self.assertIn("accepted_at", last.additional_data["metadata"])

    def test_save_with_unset_fields_does_not_emit(self):
        before = LogEntry.objects.filter(
            additional_data__action="legal_consent.renew"
        ).count()
        consent = LegalConsent.objects.get(user=self.user)
        consent.save()  # accepted_at and version are still None
        self.assertEqual(
            LogEntry.objects.filter(
                additional_data__action="legal_consent.renew"
            ).count(),
            before,
        )
