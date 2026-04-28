"""Tests for the shared ``nside_wefa.common.settings`` reader."""

from django.test import TestCase, override_settings

from nside_wefa.common import settings as wefa_settings


class GetSectionTest(TestCase):
    def test_returns_section_when_present(self):
        with override_settings(NSIDE_WEFA={"FOO": {"BAR": 1}}):
            self.assertEqual(wefa_settings.get_section("FOO"), {"BAR": 1})

    def test_returns_empty_dict_when_section_absent(self):
        with override_settings(NSIDE_WEFA={"OTHER": {}}):
            self.assertEqual(wefa_settings.get_section("MISSING"), {})

    def test_returns_explicit_default(self):
        with override_settings(NSIDE_WEFA={}):
            self.assertEqual(
                wefa_settings.get_section("MISSING", default={"k": "v"}),
                {"k": "v"},
            )

    def test_returns_empty_dict_when_settings_absent(self):
        # Don't trigger override_settings of NSIDE_WEFA at all — patch via
        # delattr to mimic a project that hasn't defined the dict.
        from django.conf import settings as django_settings

        original = getattr(django_settings, "NSIDE_WEFA", None)
        try:
            del django_settings.NSIDE_WEFA  # type: ignore[misc]
            self.assertEqual(wefa_settings.get_section("AUDIT"), {})
        finally:
            if original is not None:
                django_settings.NSIDE_WEFA = original


class GetValueTest(TestCase):
    def test_returns_key_value(self):
        with override_settings(NSIDE_WEFA={"FOO": {"BAR": 42}}):
            self.assertEqual(wefa_settings.get_value("FOO", "BAR"), 42)

    def test_returns_default_when_key_missing(self):
        with override_settings(NSIDE_WEFA={"FOO": {}}):
            self.assertEqual(wefa_settings.get_value("FOO", "BAR", default="x"), "x")

    def test_returns_default_when_section_missing(self):
        with override_settings(NSIDE_WEFA={}):
            self.assertEqual(wefa_settings.get_value("FOO", "BAR", default=None), None)
