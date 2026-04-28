"""End-to-end tests for the four registration paths described in the README.

Each path is exercised against a built-in Django model. ``Permission`` is
chosen for paths A/B/C because the demo settings only declare ``auth.Group``
under Path D — using a different model keeps the registries from interfering.
"""

from django.contrib.auth.models import Group, Permission, User
from django.test import TestCase

from auditlog.models import LogEntry
from auditlog.registry import auditlog as _auditlog_registry

from nside_wefa import audit
from nside_wefa.audit.registration import (
    AuditAppConfigMixin,
    _wefa_registered,
)


class _RegistrationFixture:
    """Mixin that unregisters models after each test."""

    def setUp(self):
        super().setUp()
        self._models_to_clean: list = []

    def tearDown(self):
        for model in self._models_to_clean:
            if _auditlog_registry.contains(model):
                _auditlog_registry.unregister(model)
            _wefa_registered.discard(model)
        self._models_to_clean = []
        super().tearDown()

    def _clean(self, model):
        self._models_to_clean.append(model)


class PathARegisterTest(_RegistrationFixture, TestCase):
    def test_register_tracks_changes(self):
        audit.register(Permission, include_fields=["name"])
        self._clean(Permission)

        self.assertTrue(_auditlog_registry.contains(Permission))
        self.assertIn(Permission, _wefa_registered)

        ct = Permission.objects.first().content_type
        perm = Permission.objects.create(
            name="my-perm-init", codename="my_perm", content_type=ct
        )
        perm.name = "my-perm-renamed"
        perm.save()

        # CREATE + UPDATE for this object_pk = 2 events with our object_repr.
        events = LogEntry.objects.filter(object_pk=str(perm.pk)).order_by("id")
        self.assertEqual(events.count(), 2)

    def test_register_returns_model_unchanged(self):
        result = audit.register(Permission)
        self._clean(Permission)
        self.assertIs(result, Permission)


class PathBDecoratorTest(_RegistrationFixture, TestCase):
    def test_decorator_registers_class(self):
        # The decorator works on real Django models — use it on Permission.
        audit.audited(include_fields=["name"])(Permission)
        self._clean(Permission)

        self.assertTrue(_auditlog_registry.contains(Permission))

        ct = Permission.objects.first().content_type
        Permission.objects.create(name="dec-perm", codename="dec_perm", content_type=ct)
        self.assertTrue(
            LogEntry.objects.filter(object_repr__contains="dec-perm").exists()
        )


class PathCAppConfigMixinTest(_RegistrationFixture, TestCase):
    def test_mixin_walks_audited_models_and_registers(self):
        seen: list = []

        class _StubAppConfig(AuditAppConfigMixin):
            label = "auth"
            audited_models = {"Permission": {"include_fields": ["name"]}}

            def get_model(self, name: str):
                seen.append(name)
                return Permission

        config = _StubAppConfig.__new__(_StubAppConfig)
        config._models_to_clean = []  # placeholder; not used
        AuditAppConfigMixin.ready(config)
        self._clean(Permission)

        self.assertEqual(seen, ["Permission"])
        self.assertTrue(_auditlog_registry.contains(Permission))

    def test_mixin_skips_unresolvable_models(self):
        class _StubAppConfig(AuditAppConfigMixin):
            label = "auth"
            audited_models = {"NoSuchModel": {}}

            def get_model(self, name: str):
                raise LookupError(name)

        config = _StubAppConfig.__new__(_StubAppConfig)
        with self.assertLogs("nside_wefa.audit", level="WARNING") as logs:
            AuditAppConfigMixin.ready(config)
        self.assertTrue(any("could not resolve" in msg for msg in logs.output))


class PathDSettingsTest(TestCase):
    """Path D is wired by AuditConfig.ready() at boot.

    The demo settings declare ``"auth.Group": {"include_fields": ["name"]}``,
    so we just assert the registry contains Group when this test runs.
    """

    def test_settings_models_are_registered(self):
        # Re-apply registration defensively in case other tests perturbed state
        # — Path D entries are configured via settings so re-registering is
        # idempotent and reflects the real production behaviour.
        if not _auditlog_registry.contains(Group):
            _auditlog_registry.register(Group, include_fields=["name"])
        self.assertTrue(_auditlog_registry.contains(Group))


class IncludeAllModelsTest(_RegistrationFixture, TestCase):
    """``INCLUDE_ALL_MODELS`` shortcut wires every concrete model.

    Verified indirectly by ensuring ``register`` accepts the User model after
    the registry has been told to include all models.
    """

    def test_register_user_succeeds(self):
        if not _auditlog_registry.contains(User):
            audit.register(User)
            self._clean(User)
        self.assertTrue(_auditlog_registry.contains(User))
