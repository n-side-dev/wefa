"""Smoke tests for the AuditConfig.ready() side effects."""

from django.apps import apps
from django.test import TestCase


class AuditAppConfigTest(TestCase):
    def test_app_is_installed(self):
        config = apps.get_app_config("audit")
        self.assertEqual(config.name, "nside_wefa.audit")
        self.assertEqual(config.default_auto_field, "django.db.models.BigAutoField")

    def test_immutability_guards_installed(self):
        """The install_guards() side effect is in place after AppConfig.ready()."""
        from auditlog.models import LogEntry
        from django.db.models.signals import pre_delete, pre_save

        from nside_wefa.audit.immutability import (
            _forbid_delete,
            _forbid_update,
            install_guards,
        )

        update_uid = f"nside_wefa.audit.immutability.forbid_update.{LogEntry.__name__}"
        delete_uid = f"nside_wefa.audit.immutability.forbid_delete.{LogEntry.__name__}"

        # Disconnect should succeed because AuditConfig.ready() connected them.
        self.assertTrue(
            pre_save.disconnect(
                _forbid_update, sender=LogEntry, dispatch_uid=update_uid
            )
        )
        self.assertTrue(
            pre_delete.disconnect(
                _forbid_delete, sender=LogEntry, dispatch_uid=delete_uid
            )
        )
        # Reconnect for subsequent tests.
        install_guards()

    def test_builtin_sources_installed_for_known_apps(self):
        """Each known source reports the expected source app dependency."""
        from nside_wefa.audit.builtin import KNOWN_SOURCES

        self.assertIn("auth", KNOWN_SOURCES)
        self.assertIn("legal_consent", KNOWN_SOURCES)
        self.assertIn("locale", KNOWN_SOURCES)
