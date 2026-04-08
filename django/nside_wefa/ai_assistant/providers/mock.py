"""
Deterministic mock provider used in tests and local development.
"""

from __future__ import annotations

import re
from typing import Any

from nside_wefa.ai_assistant.contracts import AssistantActionDoc
from nside_wefa.ai_assistant.providers.base import AssistantProvider
from nside_wefa.ai_assistant.services.prefill import extract_known_inputs
from nside_wefa.ai_assistant.services.retrieval import AssistantRouteManifestEntry


class MockAssistantProvider(AssistantProvider):
    """Heuristic provider that returns stable results without network calls."""

    def plan(
        self,
        *,
        prompt: str,
        locale: str,
        docs: list[AssistantActionDoc],
        route_manifest: list[AssistantRouteManifestEntry],
        conversation_state: dict[str, Any] | None = None,
        answers: list[str] | None = None,
    ) -> dict[str, Any]:
        del locale
        answers = answers or []
        prompt_lower = prompt.lower()
        manifest_by_doc_id = {entry.doc_id: entry for entry in route_manifest}
        visible_doc_ids = set(manifest_by_doc_id)
        docs_by_id = {doc.doc_id: doc for doc in docs if doc.doc_id in visible_doc_ids}
        extracted_inputs = extract_known_inputs(
            prompt=prompt,
            conversation_state=conversation_state,
            answers=answers,
        )

        if not docs_by_id:
            return {
                "status": "unsupported",
                "message": "No assistant-enabled routes are available for this request.",
            }

        if conversation_state and conversation_state.get("kind") == "product_category":
            category_answer = answers[0].strip() if answers else ""
            product_name = conversation_state.get("product_name", "New product")
            return {
                "status": "recipe",
                "summary": f"Create {product_name}, review it in the catalog, then open the cart.",
                "warnings": [],
                "steps": [
                    {
                        "id": "create-product",
                        "title": "Create the product",
                        "description": "Open the product creation page with the gathered values prefilled.",
                        "target": {
                            "doc_id": "catalog.product.create",
                            "query": {
                                "name": product_name,
                                "category": category_answer or "Uncategorized",
                            },
                        },
                        "action_label": "Open product form",
                        "depends_on_step_ids": [],
                    },
                    {
                        "id": "catalog-review",
                        "title": "Review the catalog",
                        "description": "Open the catalog list to confirm the new product is visible.",
                        "target": {
                            "doc_id": "catalog.home",
                            "query": {"highlight": product_name},
                        },
                        "action_label": "Open catalog",
                        "depends_on_step_ids": ["create-product"],
                    },
                    {
                        "id": "cart-open",
                        "title": "Open the cart",
                        "description": "Move to the cart to continue with shopping-related tasks.",
                        "target": {"doc_id": "cart.view", "query": {}},
                        "action_label": "Open cart",
                        "depends_on_step_ids": ["catalog-review"],
                    },
                ],
            }

        wants_product_creation = "product" in prompt_lower and any(
            keyword in prompt_lower for keyword in ("create", "new", "add")
        )
        wants_cart = "cart" in prompt_lower
        wants_checkout = "checkout" in prompt_lower or "check out" in prompt_lower

        product_name_match = re.search(
            r"(?:named|called)\s+([a-z0-9][a-z0-9 \-]+)", prompt_lower
        )
        product_name = (
            extracted_inputs.get("name")
            or extracted_inputs.get("product")
            or (
                product_name_match.group(1).strip(" .,!")
                if product_name_match
                else "New product"
            )
        )
        cart_product = extracted_inputs.get("product") or (
            product_name_match.group(1).strip(" .,!")
            if product_name_match
            else "New product"
        )
        category_match = re.search(r"category\s+([a-z0-9][a-z0-9 \-]+)", prompt_lower)
        requested_quantity = extracted_inputs.get("quantity", "1")

        if wants_product_creation and not category_match:
            return {
                "status": "needs_clarification",
                "questions": [
                    {
                        "id": "product-category",
                        "text": f"Which category should '{product_name}' use?",
                    }
                ],
                "warnings": [],
                "summary": "",
                "state": {
                    "kind": "product_category",
                    "product_name": product_name,
                },
            }

        steps: list[dict[str, Any]] = []
        warnings: list[str] = []

        if wants_product_creation and "catalog.product.create" in docs_by_id:
            query = {"name": product_name}
            if category_match:
                query["category"] = category_match.group(1).strip(" .,!").title()
            steps.append(
                {
                    "id": "create-product",
                    "title": "Create the product",
                    "description": "Open the product creation page with the request details prefilled.",
                    "target": {"doc_id": "catalog.product.create", "query": query},
                    "action_label": "Open product form",
                    "depends_on_step_ids": [],
                }
            )

        if wants_cart and "cart.view" in docs_by_id:
            cart_query: dict[str, str] = {}
            if cart_product and cart_product != "New product":
                cart_query["product"] = cart_product
                cart_query["quantity"] = requested_quantity
            steps.append(
                {
                    "id": "open-cart",
                    "title": "Open the cart",
                    "description": "Navigate to the cart to review or add items.",
                    "target": {"doc_id": "cart.view", "query": cart_query},
                    "action_label": "Open cart",
                    "depends_on_step_ids": [steps[-1]["id"]] if steps else [],
                }
            )

        if wants_checkout and "checkout.view" in docs_by_id:
            steps.append(
                {
                    "id": "open-checkout",
                    "title": "Continue to checkout",
                    "description": "Open the checkout page once the cart is ready.",
                    "target": {"doc_id": "checkout.view", "query": {}},
                    "action_label": "Open checkout",
                    "depends_on_step_ids": [steps[-1]["id"]] if steps else [],
                }
            )

        if not steps:
            fallback_doc = next(iter(docs_by_id.values()))
            warnings.append("The assistant used the closest matching route available.")
            steps.append(
                {
                    "id": "open-route",
                    "title": f"Open {fallback_doc.title}",
                    "description": fallback_doc.summary,
                    "target": {"doc_id": fallback_doc.doc_id, "query": {}},
                    "action_label": "Open route",
                    "depends_on_step_ids": [],
                }
            )

        return {
            "status": "recipe",
            "summary": "Follow the suggested pages in order to complete the request.",
            "warnings": warnings,
            "steps": steps,
        }
