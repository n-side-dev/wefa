from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from nside_wefa.ai_assistant.services.planner import AssistantPlanningUpstreamError


TEST_DOC_MODULE = "nside_wefa.ai_assistant.tests.test_docs"


@override_settings(
    NSIDE_WEFA={
        "APP_NAME": "WeFa",
        "LEGAL_CONSENT": {"VERSION": 1, "EXPIRY_LIMIT": 365},
        "AUTHENTICATION": {"TYPES": ["TOKEN", "JWT"]},
        "AI_ASSISTANT": {
            "PROVIDER": "mock",
            "DOC_MODULES": [TEST_DOC_MODULE],
            "REQUIRE_AUTHENTICATION": False,
        },
    }
)
class AssistantRecipeViewTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("ai_assistant:recipes")
        self.user = get_user_model().objects.create_user(
            username="assistant-user",
            email="assistant@example.com",
            password="testpass123",
        )
        self.create_product_permission = Permission.objects.get(codename="add_user")

    def test_returns_recipe_for_cart_prompt(self):
        response = self.client.post(
            self.url,
            {
                "prompt": "Open my cart and checkout",
                "route_manifest": [
                    {
                        "doc_id": "cart.view",
                        "route_name": "cart",
                        "path_template": "/cart",
                        "label": "Cart",
                    },
                    {
                        "doc_id": "checkout.view",
                        "route_name": "checkout",
                        "path_template": "/checkout",
                        "label": "Checkout",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "recipe")
        self.assertEqual(len(response.data["steps"]), 2)
        self.assertEqual(response.data["steps"][0]["target"]["doc_id"], "cart.view")

    def test_returns_clarification_for_missing_product_category(self):
        self.user.user_permissions.add(self.create_product_permission)
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            {
                "prompt": "Create a new product named Solar Bottle",
                "route_manifest": [
                    {
                        "doc_id": "catalog.product.create",
                        "route_name": "product-create",
                        "path_template": "/catalog/products/new",
                        "label": "Create product",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "needs_clarification")
        self.assertTrue(response.data["conversation_token"])
        self.assertEqual(len(response.data["questions"]), 1)

    def test_clarification_answer_returns_recipe(self):
        self.user.user_permissions.add(self.create_product_permission)
        self.client.force_authenticate(user=self.user)

        first_response = self.client.post(
            self.url,
            {
                "prompt": "Create a new product named Solar Bottle",
                "route_manifest": [
                    {
                        "doc_id": "catalog.product.create",
                        "route_name": "product-create",
                        "path_template": "/catalog/products/new",
                        "label": "Create product",
                    },
                    {
                        "doc_id": "catalog.home",
                        "route_name": "catalog",
                        "path_template": "/catalog",
                        "label": "Catalog",
                    },
                    {
                        "doc_id": "cart.view",
                        "route_name": "cart",
                        "path_template": "/cart",
                        "label": "Cart",
                    },
                ],
            },
            format="json",
        )
        token = first_response.data["conversation_token"]

        second_response = self.client.post(
            self.url,
            {
                "prompt": "Create a new product named Solar Bottle",
                "conversation_token": token,
                "answers": ["Bottles"],
                "route_manifest": [
                    {
                        "doc_id": "catalog.product.create",
                        "route_name": "product-create",
                        "path_template": "/catalog/products/new",
                        "label": "Create product",
                    },
                    {
                        "doc_id": "catalog.home",
                        "route_name": "catalog",
                        "path_template": "/catalog",
                        "label": "Catalog",
                    },
                    {
                        "doc_id": "cart.view",
                        "route_name": "cart",
                        "path_template": "/cart",
                        "label": "Cart",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.data["status"], "recipe")
        self.assertEqual(
            second_response.data["steps"][0]["target"]["query"]["category"], "Bottles"
        )

    @patch("nside_wefa.ai_assistant.providers.mock.MockAssistantProvider.plan")
    def test_recipe_prefills_are_backfilled_when_provider_omits_them(
        self, provider_plan_mock
    ):
        self.user.user_permissions.add(self.create_product_permission)
        self.client.force_authenticate(user=self.user)
        provider_plan_mock.return_value = {
            "status": "recipe",
            "summary": "Create the requested product.",
            "warnings": [],
            "steps": [
                {
                    "id": "create-product",
                    "title": "Create the product",
                    "description": "Open the product creation page.",
                    "target": {
                        "doc_id": "catalog.product.create",
                        "query": {},
                    },
                    "action_label": "Open product form",
                    "depends_on_step_ids": [],
                }
            ],
        }

        response = self.client.post(
            self.url,
            {
                "prompt": 'Create a new product named "banana" with the category being "fruit"',
                "route_manifest": [
                    {
                        "doc_id": "catalog.product.create",
                        "route_name": "product-create",
                        "path_template": "/catalog/products/new",
                        "label": "Create product",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "recipe")
        self.assertEqual(
            response.data["steps"][0]["target"]["query"],
            {
                "name": "banana",
                "category": "fruit",
            },
        )

    def test_permission_filtered_docs_are_not_exposed(self):
        response = self.client.post(
            self.url,
            {
                "prompt": "Create a new product named Solar Bottle in category Bottles",
                "route_manifest": [
                    {
                        "doc_id": "catalog.product.create",
                        "route_name": "product-create",
                        "path_template": "/catalog/products/new",
                        "label": "Create product",
                    },
                    {
                        "doc_id": "catalog.home",
                        "route_name": "catalog",
                        "path_template": "/catalog",
                        "label": "Catalog",
                    },
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "recipe")
        self.assertNotEqual(
            response.data["steps"][0]["target"]["doc_id"],
            "catalog.product.create",
        )

    @patch("nside_wefa.ai_assistant.providers.mock.MockAssistantProvider.plan")
    def test_cart_prefills_are_backfilled_when_provider_omits_them(
        self, provider_plan_mock
    ):
        provider_plan_mock.return_value = {
            "status": "recipe",
            "summary": "Open the cart with the requested product.",
            "warnings": [],
            "steps": [
                {
                    "id": "open-cart",
                    "title": "Open the cart",
                    "description": "Open the cart page.",
                    "target": {
                        "doc_id": "cart.view",
                        "query": {},
                    },
                    "action_label": "Open cart",
                    "depends_on_step_ids": [],
                }
            ],
        }

        response = self.client.post(
            self.url,
            {
                "prompt": 'Add "banana" with quantity 2 to my cart',
                "route_manifest": [
                    {
                        "doc_id": "cart.view",
                        "route_name": "cart",
                        "path_template": "/cart",
                        "label": "Cart",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "recipe")
        self.assertEqual(
            response.data["steps"][0]["target"]["query"],
            {
                "product": "banana",
                "quantity": "2",
            },
        )

    @patch("nside_wefa.ai_assistant.views.recipe_view.plan_recipe")
    def test_upstream_provider_error_returns_bad_gateway(self, plan_recipe_mock):
        plan_recipe_mock.side_effect = AssistantPlanningUpstreamError(
            "OpenAI TLS verification failed."
        )

        response = self.client.post(
            self.url,
            {
                "prompt": "Open my cart",
                "route_manifest": [
                    {
                        "doc_id": "cart.view",
                        "route_name": "cart",
                        "path_template": "/cart",
                        "label": "Cart",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("TLS", response.data["detail"])
