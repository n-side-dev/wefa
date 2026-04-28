"""Tests for the ``legal_consent`` built-in audit source."""

from auditlog.models import LogEntry
from django.contrib.auth.models import User
from django.test import TestCase
from freezegun import freeze_time

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

    def test_resaving_already_accepted_consent_does_not_emit(self):
        """Regression: a second save with unchanged (version, accepted_at) is a no-op."""
        consent = LegalConsent.objects.get(user=self.user)
        consent.renew()
        baseline = LogEntry.objects.filter(
            additional_data__action="legal_consent.renew"
        ).count()

        # Touch the row again without changing the audited fields. This used
        # to emit a phantom renewal on every save.
        consent.save()
        consent.save()

        self.assertEqual(
            LogEntry.objects.filter(
                additional_data__action="legal_consent.renew"
            ).count(),
            baseline,
        )

    def test_renew_after_renew_emits_only_when_values_change(self):
        """A genuine second renewal (different timestamp) must emit a fresh event."""
        consent = LegalConsent.objects.get(user=self.user)

        with freeze_time("2026-01-01T00:00:00Z"):
            consent.renew()
        after_first = LogEntry.objects.filter(
            additional_data__action="legal_consent.renew"
        ).count()

        # Re-load to clear the post_init snapshot, mimicking a new request,
        # and bump accepted_at via a real renewal at a different wall clock.
        consent = LegalConsent.objects.get(pk=consent.pk)
        with freeze_time("2026-06-01T00:00:00Z"):
            consent.renew()

        self.assertEqual(
            LogEntry.objects.filter(
                additional_data__action="legal_consent.renew"
            ).count(),
            after_first + 1,
        )
