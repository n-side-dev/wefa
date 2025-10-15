import tempfile
from pathlib import Path
from unittest.mock import patch

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status


class TermsOfServiceViewTest(APITestCase):
    """Test cases for TermsOfServiceView"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.url = reverse("legal_consent:terms_of_use")

    def test_get_terms_of_use_default_template(self):
        """Test GET request returns rendered content from default template"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/plain; charset=utf-8")

        content = response.content.decode("utf-8")
        # Check that content is rendered and not empty
        self.assertTrue(len(content) > 0)
        # Check that templating was applied (no template variables left)
        self.assertNotIn("{{app_name}}", content)

    @override_settings(
        NSIDE_WEFA={"APP_NAME": "TestApp", "LEGAL_CONSENT": {"VERSION": 1}}
    )
    def test_get_terms_of_use_custom_app_name(self):
        """Test GET request returns rendered content with custom app name"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode("utf-8")
        # Check that content is rendered and templating was applied
        self.assertTrue(len(content) > 0)
        self.assertNotIn("{{app_name}}", content)

    def test_get_terms_of_use_with_legal_templates_setting(self):
        """Test GET request uses Legal-specific TEMPLATES setting"""
        # Create a temporary directory structure for custom template
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create custom Terms of Use template in 'en' locale subfolder
            en_dir = Path(temp_dir) / "en"
            en_dir.mkdir(parents=True, exist_ok=True)
            custom_template = en_dir / "terms_of_use.md"
            custom_content = """# Custom Terms of Use for {{app_name}}

This is a custom Terms of Use document for {{app_name}}.

Last updated: {{current_date}}
"""
            custom_template.write_text(custom_content)

            with override_settings(
                NSIDE_WEFA={
                    "APP_NAME": "CustomApp",
                    "LEGAL_CONSENT": {"VERSION": 1, "TEMPLATES": str(temp_dir)},
                }
            ):
                response = self.client.get(self.url)

                self.assertEqual(response.status_code, status.HTTP_200_OK)
                content = response.content.decode("utf-8")
                # Check that content is rendered and templating was applied
                self.assertTrue(len(content) > 0)
                self.assertNotIn("{{app_name}}", content)

    @patch("builtins.open", side_effect=FileNotFoundError())
    def test_get_terms_of_use_file_not_found(self, mock_open):
        """Test GET request when default template file is not found"""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode("utf-8")
        # Check that content is rendered (error message)
        self.assertTrue(len(content) > 0)

    def test_get_terms_of_use_no_nside_wefa_setting(self):
        """Test GET request when NSIDE_WEFA setting is not configured"""
        with override_settings():
            # Remove NSIDE_WEFA setting if it exists
            from django.conf import settings

            if hasattr(settings, "NSIDE_WEFA"):
                delattr(settings, "NSIDE_WEFA")

            response = self.client.get(self.url)

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            content = response.content.decode("utf-8")
            # Check that content is rendered and templating was applied
            self.assertTrue(len(content) > 0)
            self.assertNotIn("{{app_name}}", content)

    def test_get_terms_of_use_with_locale_parameter(self):
        """Test GET request returns content from the specified locale subfolder"""
        with tempfile.TemporaryDirectory() as temp_dir:
            fr_dir = Path(temp_dir) / "fr"
            fr_dir.mkdir(parents=True, exist_ok=True)
            custom_template = fr_dir / "terms_of_use.md"
            custom_content = """# Conditions d'utilisation FR pour {{app_name}}

Bienvenue FR.
"""
            custom_template.write_text(custom_content)

            with override_settings(
                NSIDE_WEFA={
                    "APP_NAME": "CustomApp",
                    "LEGAL_CONSENT": {"VERSION": 1, "TEMPLATES": str(temp_dir)},
                }
            ):
                response = self.client.get(self.url, {"locale": "fr"})
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                body = response.content.decode("utf-8")
                self.assertIn("Bienvenue FR.", body)
                self.assertNotIn("{{app_name}}", body)
