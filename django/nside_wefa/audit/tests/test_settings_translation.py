"""Tests for the NSIDE_WEFA.AUDIT → AUDITLOG_* translation layer."""

from django.test import TestCase, override_settings

from nside_wefa.audit.settings_translation import (
    DEFAULT_REDACT_FIELDS,
    apply_to_django_auditlog,
)


class _RestoreAuditlogSettings:
    """Snapshot, clear, and restore AUDITLOG_* settings around a test.

    The audit AppConfig.ready() that runs at test-suite boot may already have
    populated some of these keys. We snapshot first, clear them all so each
    test starts from a known empty slate, then restore the original values on
    exit so subsequent tests aren't affected.
    """

    AUDITLOG_KEYS = [
        "AUDITLOG_INCLUDE_TRACKING_MODELS",
        "AUDITLOG_INCLUDE_ALL_MODELS",
        "AUDITLOG_EXCLUDE_TRACKING_MODELS",
        "AUDITLOG_MASK_TRACKING_FIELDS",
        "AUDITLOG_DISABLE_REMOTE_ADDR",
        "AUDITLOG_CID_HEADER",
        "AUDITLOG_LOGENTRY_MODEL",
    ]

    def __enter__(self):
        from django.conf import settings

        self._snapshot: dict = {}
        for key in self.AUDITLOG_KEYS:
            if hasattr(settings, key):
                self._snapshot[key] = getattr(settings, key)
                delattr(settings, key)
        return self

    def __exit__(self, *args):
        from django.conf import settings

        for key in self.AUDITLOG_KEYS:
            if hasattr(settings, key):
                delattr(settings, key)
            if key in self._snapshot:
                setattr(settings, key, self._snapshot[key])


class SettingsTranslationTest(TestCase):
    @override_settings(NSIDE_WEFA={"APP_NAME": "T"})
    def test_no_audit_section_uses_defaults(self):
        with _RestoreAuditlogSettings():
            apply_to_django_auditlog()
            from django.conf import settings

            # MODELS / INCLUDE_ALL_MODELS / EXCLUDE_MODELS unset means we don't
            # add them. Only the mask defaults always land.
            self.assertFalse(hasattr(settings, "AUDITLOG_INCLUDE_TRACKING_MODELS"))
            self.assertFalse(hasattr(settings, "AUDITLOG_INCLUDE_ALL_MODELS"))
            # REDACT_FIELDS defaults always set.
            self.assertEqual(
                settings.AUDITLOG_MASK_TRACKING_FIELDS, DEFAULT_REDACT_FIELDS
            )

    @override_settings(
        NSIDE_WEFA={
            "APP_NAME": "T",
            "AUDIT": {
                "MODELS": {"auth.User": {"include_fields": ["email"]}},
                "INCLUDE_ALL_MODELS": False,
                "EXCLUDE_MODELS": ["auth.Group"],
                "REDACT_FIELDS": ["pw"],
                "DISABLE_REMOTE_ADDR": True,
                "REQUEST_ID_HEADER": "X-MY-Id",
            },
        }
    )
    def test_full_section_mirrors_each_key(self):
        with _RestoreAuditlogSettings():
            apply_to_django_auditlog()
            from django.conf import settings

            self.assertEqual(
                settings.AUDITLOG_INCLUDE_TRACKING_MODELS,
                {"auth.User": {"include_fields": ["email"]}},
            )
            self.assertEqual(settings.AUDITLOG_INCLUDE_ALL_MODELS, False)
            self.assertEqual(settings.AUDITLOG_EXCLUDE_TRACKING_MODELS, ["auth.Group"])
            self.assertEqual(settings.AUDITLOG_MASK_TRACKING_FIELDS, ["pw"])
            self.assertEqual(settings.AUDITLOG_DISABLE_REMOTE_ADDR, True)
            self.assertEqual(settings.AUDITLOG_CID_HEADER, "X-MY-Id")

    @override_settings(NSIDE_WEFA={"APP_NAME": "T", "AUDIT": {"TAMPER_EVIDENT": True}})
    def test_tamper_evident_swaps_logentry_model(self):
        with _RestoreAuditlogSettings():
            apply_to_django_auditlog()
            from django.conf import settings

            self.assertEqual(
                settings.AUDITLOG_LOGENTRY_MODEL,
                "audit.WefaLogEntry",
            )

    @override_settings(
        NSIDE_WEFA={"APP_NAME": "T", "AUDIT": {"INCLUDE_ALL_MODELS": True}}
    )
    def test_does_not_override_explicit_auditlog_settings(self):
        from django.conf import settings

        with _RestoreAuditlogSettings():
            settings.AUDITLOG_INCLUDE_ALL_MODELS = "untouched"
            apply_to_django_auditlog()
            self.assertEqual(settings.AUDITLOG_INCLUDE_ALL_MODELS, "untouched")

    @override_settings(
        NSIDE_WEFA={
            "APP_NAME": "T",
            "AUDIT": {"MODELS": {"auth.User": None}},
        }
    )
    def test_models_with_none_options_are_normalized_to_empty_dict(self):
        with _RestoreAuditlogSettings():
            apply_to_django_auditlog()
            from django.conf import settings

            self.assertEqual(
                settings.AUDITLOG_INCLUDE_TRACKING_MODELS, {"auth.User": {}}
            )
