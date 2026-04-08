from __future__ import annotations

import os
from unittest.mock import patch

from django.test import SimpleTestCase

from nside_wefa.ai_assistant.providers.openai import OpenAIAssistantProvider


class OpenAIAssistantProviderTest(SimpleTestCase):
    @patch.dict(os.environ, {}, clear=True)
    @patch("nside_wefa.ai_assistant.providers.openai.certifi.where")
    def test_resolve_ca_bundle_defaults_to_certifi(self, certifi_where_mock):
        certifi_where_mock.return_value = "/tmp/certifi.pem"
        provider = OpenAIAssistantProvider(api_key="test-key", model="gpt-4.1-mini")

        self.assertEqual(provider._resolve_ca_bundle(), "/tmp/certifi.pem")

    @patch.dict(os.environ, {}, clear=True)
    def test_resolve_ca_bundle_prefers_configured_path(self):
        provider = OpenAIAssistantProvider(
            api_key="test-key",
            model="gpt-4.1-mini",
            ca_bundle="~/company-ca.pem",
        )

        self.assertEqual(
            provider._resolve_ca_bundle(),
            os.path.expanduser("~/company-ca.pem"),
        )

    @patch.dict(
        os.environ,
        {"SSL_CERT_FILE": "~/ssl-cert-file.pem"},
        clear=True,
    )
    def test_resolve_ca_bundle_uses_ssl_cert_file_environment_variable(self):
        provider = OpenAIAssistantProvider(api_key="test-key", model="gpt-4.1-mini")

        self.assertEqual(
            provider._resolve_ca_bundle(),
            os.path.expanduser("~/ssl-cert-file.pem"),
        )

    def test_normalize_structured_response_converts_pairs_to_mappings(self):
        payload = {
            "status": "recipe",
            "summary": "Open the catalog.",
            "message": "",
            "warnings": [],
            "questions": [],
            "steps": [
                {
                    "id": "step-1",
                    "title": "Open catalog",
                    "description": "Open the catalog page.",
                    "action_label": "Open catalog",
                    "depends_on_step_ids": [],
                    "target": {
                        "doc_id": "catalog.home",
                        "params": [{"key": "id", "value": "42"}],
                        "query": [{"key": "highlight", "value": "Solar Bottle"}],
                    },
                }
            ],
        }

        normalized_payload = OpenAIAssistantProvider._normalize_structured_response(payload)

        self.assertEqual(
            normalized_payload["steps"][0]["target"]["params"],
            {"id": "42"},
        )
        self.assertEqual(
            normalized_payload["steps"][0]["target"]["query"],
            {"highlight": "Solar Bottle"},
        )
