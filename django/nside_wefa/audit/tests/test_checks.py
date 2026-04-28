"""Tests for the audit system checks."""

from typing import Any, List

from django.core.checks import Error
from django.test import TestCase, override_settings

from nside_wefa.audit.checks import (
    audit_settings_check,
    wefa_apps_dependencies_check,
)


class DependencyOrderCheckTest(TestCase):
    """``common`` and ``auditlog`` must each precede ``nside_wefa.audit``."""

    @override_settings(
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
            "auditlog",
            "nside_wefa.common",
            "nside_wefa.audit",
        ]
    )
    def test_correct_order_is_clean(self):
        self.assertEqual(wefa_apps_dependencies_check(None), [])

    @override_settings(
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
            "nside_wefa.common",
            "auditlog",
            "nside_wefa.audit",
        ]
    )
    def test_relative_order_of_common_and_auditlog_is_irrelevant(self):
        self.assertEqual(wefa_apps_dependencies_check(None), [])

    @override_settings(
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
            "auditlog",
            "nside_wefa.audit",
            "nside_wefa.common",  # WRONG: must be before audit
        ]
    )
    def test_common_must_precede_audit(self):
        errors = wefa_apps_dependencies_check(None)
        msgs = [e.msg for e in errors]
        self.assertTrue(
            any("nside_wefa.common" in m and "nside_wefa.audit" in m for m in msgs),
            msgs,
        )

    @override_settings(
        INSTALLED_APPS=[
            "django.contrib.contenttypes",
            "django.contrib.auth",
            "nside_wefa.common",
            "nside_wefa.audit",
        ]
    )
    def test_auditlog_must_be_present(self):
        errors = wefa_apps_dependencies_check(None)
        msgs = [e.msg for e in errors]
        self.assertTrue(any("auditlog" in m for m in msgs), msgs)


class AuditSettingsCheckTest(TestCase):
    """Validates every key under ``NSIDE_WEFA.AUDIT``."""

    def _run(self, audit_section: Any) -> List[Error]:
        with override_settings(NSIDE_WEFA={"APP_NAME": "T", "AUDIT": audit_section}):
            return audit_settings_check(None)

    def test_missing_section_is_ok(self):
        with override_settings(NSIDE_WEFA={"APP_NAME": "T"}):
            self.assertEqual(audit_settings_check(None), [])

    def test_section_must_be_a_dict(self):
        errors = self._run("not a dict")
        self.assertTrue(any("must be a dict" in e.msg for e in errors), errors)

    def test_empty_section_is_ok(self):
        self.assertEqual(self._run({}), [])

    # ----- MODELS -----

    def test_models_must_be_dict(self):
        errors = self._run({"MODELS": ["auth.User"]})
        self.assertTrue(any("MODELS must be a dict" in e.msg for e in errors), errors)

    def test_models_unknown_label_errors(self):
        errors = self._run({"MODELS": {"nosuchapp.NoSuchModel": {}}})
        self.assertTrue(any("could not be resolved" in e.msg for e in errors), errors)

    def test_models_options_must_be_dict(self):
        errors = self._run({"MODELS": {"auth.User": "not a dict"}})
        self.assertTrue(any("options must be a dict" in e.msg for e in errors), errors)

    def test_models_valid(self):
        self.assertEqual(
            self._run({"MODELS": {"auth.User": {"include_fields": ["username"]}}}),
            [],
        )

    # ----- bools -----

    def test_include_all_models_must_be_bool(self):
        errors = self._run({"INCLUDE_ALL_MODELS": "yes"})
        self.assertTrue(any("must be a boolean" in e.msg for e in errors), errors)

    def test_disable_remote_addr_bool(self):
        self.assertEqual(self._run({"DISABLE_REMOTE_ADDR": True}), [])
        errors = self._run({"DISABLE_REMOTE_ADDR": 1})
        self.assertTrue(any("must be a boolean" in e.msg for e in errors), errors)

    def test_tamper_evident_bool(self):
        self.assertEqual(self._run({"TAMPER_EVIDENT": False}), [])
        errors = self._run({"TAMPER_EVIDENT": "yes"})
        self.assertTrue(any("must be a boolean" in e.msg for e in errors), errors)

    def test_raise_on_failure_bool(self):
        self.assertEqual(self._run({"RAISE_ON_FAILURE": True}), [])
        errors = self._run({"RAISE_ON_FAILURE": 0})
        self.assertTrue(any("must be a boolean" in e.msg for e in errors), errors)

    # ----- EXCLUDE_MODELS -----

    def test_exclude_models_must_be_list(self):
        errors = self._run({"EXCLUDE_MODELS": "auth.User"})
        self.assertTrue(
            any("EXCLUDE_MODELS must be a list" in e.msg for e in errors), errors
        )

    def test_exclude_models_unresolvable_errors(self):
        errors = self._run({"EXCLUDE_MODELS": ["nosuchapp.X"]})
        self.assertTrue(any("could not be resolved" in e.msg for e in errors), errors)

    def test_exclude_models_valid(self):
        self.assertEqual(self._run({"EXCLUDE_MODELS": ["auth.User"]}), [])

    # ----- REDACT_FIELDS -----

    def test_redact_fields_must_be_list_of_strings(self):
        errors = self._run({"REDACT_FIELDS": "password"})
        self.assertTrue(any("must be a list" in e.msg for e in errors), errors)
        errors = self._run({"REDACT_FIELDS": ["password", 123]})
        self.assertTrue(any("non-empty strings" in e.msg for e in errors), errors)

    def test_redact_fields_valid(self):
        self.assertEqual(self._run({"REDACT_FIELDS": ["password", "token"]}), [])

    # ----- REQUEST_ID_HEADER -----

    def test_request_id_header_must_be_non_empty_string(self):
        errors = self._run({"REQUEST_ID_HEADER": ""})
        self.assertTrue(any("non-empty string" in e.msg for e in errors), errors)
        errors = self._run({"REQUEST_ID_HEADER": 123})
        self.assertTrue(any("non-empty string" in e.msg for e in errors), errors)

    def test_request_id_header_valid(self):
        self.assertEqual(self._run({"REQUEST_ID_HEADER": "X-Request-Id"}), [])

    # ----- RETENTION_DAYS -----

    def test_retention_days_none_is_ok(self):
        self.assertEqual(self._run({"RETENTION_DAYS": None}), [])

    def test_retention_days_positive_int(self):
        self.assertEqual(self._run({"RETENTION_DAYS": 30}), [])

    def test_retention_days_zero_or_negative_invalid(self):
        for value in (0, -1):
            errors = self._run({"RETENTION_DAYS": value})
            self.assertTrue(
                any("positive integer or None" in e.msg for e in errors), errors
            )

    def test_retention_days_must_not_be_bool(self):
        errors = self._run({"RETENTION_DAYS": True})
        self.assertTrue(
            any("positive integer or None" in e.msg for e in errors), errors
        )

    # ----- BUILTIN_SOURCES -----

    def test_builtin_sources_must_be_list_of_known_names(self):
        errors = self._run({"BUILTIN_SOURCES": ["auth", "wat"]})
        self.assertTrue(
            any("'wat'" in e.msg and "is not allowed" in e.msg for e in errors),
            errors,
        )

    def test_builtin_sources_valid_subset(self):
        self.assertEqual(self._run({"BUILTIN_SOURCES": ["auth"]}), [])
        self.assertEqual(
            self._run({"BUILTIN_SOURCES": ["auth", "legal_consent", "locale"]}), []
        )

    # ----- ACTOR_RESOLVER -----

    def test_actor_resolver_must_be_dotted_path(self):
        errors = self._run({"ACTOR_RESOLVER": "not_a_path"})
        self.assertTrue(any("dotted Python path" in e.msg for e in errors), errors)

    def test_actor_resolver_module_must_import(self):
        errors = self._run({"ACTOR_RESOLVER": "no.such.module.func"})
        self.assertTrue(any("could not be imported" in e.msg for e in errors), errors)

    def test_actor_resolver_attribute_must_exist(self):
        errors = self._run({"ACTOR_RESOLVER": "django.conf.no_such_attr"})
        self.assertTrue(any("has no attribute" in e.msg for e in errors), errors)

    def test_actor_resolver_must_be_callable(self):
        # ``django.conf.settings`` exists but isn't callable.
        errors = self._run({"ACTOR_RESOLVER": "django.conf.settings"})
        self.assertTrue(any("not callable" in e.msg for e in errors), errors)

    def test_actor_resolver_valid(self):
        self.assertEqual(self._run({"ACTOR_RESOLVER": "django.utils.timezone.now"}), [])
