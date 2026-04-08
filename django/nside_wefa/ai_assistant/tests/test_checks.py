from django.core.checks import Error
from django.test import TestCase, override_settings

from nside_wefa.ai_assistant.checks import (
    ai_assistant_docs_check,
    ai_assistant_settings_check,
)


TEST_DOC_MODULE = "nside_wefa.ai_assistant.tests.test_docs"


class AIAssistantChecksTest(TestCase):
    def test_ai_assistant_settings_check_missing_section(self):
        with override_settings(NSIDE_WEFA={"APP_NAME": "WeFa"}):
            errors = ai_assistant_settings_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], Error)
            self.assertEqual(
                errors[0].msg, "NSIDE_WEFA.AI_ASSISTANT is not defined in settings.py"
            )

    def test_ai_assistant_settings_check_invalid_provider(self):
        with override_settings(
            NSIDE_WEFA={
                "APP_NAME": "WeFa",
                "AI_ASSISTANT": {
                    "PROVIDER": "unknown",
                    "DOC_MODULES": [TEST_DOC_MODULE],
                },
            }
        ):
            errors = ai_assistant_settings_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIn("PROVIDER", errors[0].msg)

    def test_ai_assistant_settings_check_openai_without_key(self):
        with override_settings(
            NSIDE_WEFA={
                "APP_NAME": "WeFa",
                "AI_ASSISTANT": {
                    "PROVIDER": "openai",
                    "DOC_MODULES": [TEST_DOC_MODULE],
                    "OPENAI_API_KEY": "",
                    "OPENAI_MODEL": "gpt-4.1-mini",
                },
            }
        ):
            errors = ai_assistant_settings_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIn("OPENAI_API_KEY", errors[0].msg)

    def test_ai_assistant_docs_check_valid_docs(self):
        with override_settings(
            NSIDE_WEFA={
                "APP_NAME": "WeFa",
                "AI_ASSISTANT": {
                    "PROVIDER": "mock",
                    "DOC_MODULES": [TEST_DOC_MODULE],
                },
            }
        ):
            errors = ai_assistant_docs_check(None)
            self.assertEqual(errors, [])

    def test_ai_assistant_docs_check_invalid_module(self):
        with override_settings(
            NSIDE_WEFA={
                "APP_NAME": "WeFa",
                "AI_ASSISTANT": {
                    "PROVIDER": "mock",
                    "DOC_MODULES": ["missing.module.path"],
                },
            }
        ):
            errors = ai_assistant_docs_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIn("missing.module.path", errors[0].msg)

    def test_ai_assistant_settings_check_missing_openai_ca_bundle_file(self):
        with override_settings(
            NSIDE_WEFA={
                "APP_NAME": "WeFa",
                "AI_ASSISTANT": {
                    "PROVIDER": "openai",
                    "DOC_MODULES": [TEST_DOC_MODULE],
                    "OPENAI_API_KEY": "test-key",
                    "OPENAI_MODEL": "gpt-4.1-mini",
                    "OPENAI_CA_BUNDLE": "/tmp/does-not-exist-wefa.pem",
                },
            }
        ):
            errors = ai_assistant_settings_check(None)
            self.assertEqual(len(errors), 1)
            self.assertIn("OPENAI_CA_BUNDLE", errors[0].msg)
