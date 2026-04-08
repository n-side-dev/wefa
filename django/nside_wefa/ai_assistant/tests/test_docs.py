"""Reusable test docs for the AI assistant app."""

from nside_wefa.ai_assistant.contracts import (
    AssistantActionDoc,
    AssistantInputDoc,
    OperationRef,
)


AI_ASSISTANT_DOCS = [
    AssistantActionDoc(
        doc_id="catalog.home",
        title="Browse catalog",
        summary="Open the product catalog and browse available products.",
        intents=["browse catalog", "see products"],
        examples=["Show me the catalog", "I want to browse products"],
        frontend_notes=["Use this route to review products after creation."],
        operation_refs=[OperationRef(method="GET", path="/api/catalog/")],
    ),
    AssistantActionDoc(
        doc_id="catalog.product.create",
        title="Create product",
        summary="Open the product creation flow for catalog administrators.",
        intents=["create product", "add product", "new product"],
        examples=["Create a new product", "Add a bottle to the catalog"],
        required_permissions=["auth.add_user"],
        required_inputs=[
            AssistantInputDoc(
                name="name",
                label="Product name",
                description="Display name for the product",
            ),
            AssistantInputDoc(
                name="category",
                label="Category",
                description="Catalog category for the product",
            ),
        ],
        operation_refs=[OperationRef(method="POST", path="/api/catalog/products/")],
    ),
    AssistantActionDoc(
        doc_id="cart.view",
        title="View cart",
        summary="Open the current shopping cart.",
        intents=["view cart", "open cart", "add to cart"],
        examples=["Open my cart", "I want to add a product to my cart"],
        optional_inputs=[
            AssistantInputDoc(
                name="product",
                label="Product",
                description="Product to add to the shopping cart",
            ),
            AssistantInputDoc(
                name="quantity",
                label="Quantity",
                description="Quantity to use in the shopping cart",
            ),
        ],
        operation_refs=[OperationRef(method="GET", path="/api/cart/")],
    ),
    AssistantActionDoc(
        doc_id="checkout.view",
        title="Checkout",
        summary="Open the checkout flow for the current cart.",
        intents=["checkout", "pay", "complete order"],
        examples=["Go to checkout", "I want to check out"],
        operation_refs=[OperationRef(method="POST", path="/api/checkout/")],
    ),
]
