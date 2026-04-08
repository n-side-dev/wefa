"""
Demo backend action docs used by the AI assistant sample flow.
"""

from nside_wefa.ai_assistant.contracts import (
    AssistantActionDoc,
    AssistantInputDoc,
    AssistantOutputDoc,
    OperationRef,
)


AI_ASSISTANT_DOCS = [
    AssistantActionDoc(
        doc_id="catalog.home",
        title="Browse catalog",
        summary="Open the product catalog and search available items.",
        intents=["browse products", "search the catalog", "review the catalog"],
        examples=[
            "Show me the catalog",
            "Review the catalog after creating a product",
        ],
        frontend_notes=["Use this route to confirm products are visible to shoppers."],
        operation_refs=[OperationRef(method="GET", path="/api/catalog/")],
    ),
    AssistantActionDoc(
        doc_id="catalog.product.create",
        title="Create product",
        summary="Open the product creation form for catalog managers.",
        intents=["create a product", "add a new product", "register a product"],
        examples=[
            "Create a new solar bottle product",
            "Add a camping stove to the catalog",
        ],
        frontend_notes=[
            "When known form inputs are already present in the request, place them in target.query.",
            "Use the exact field names name, category, price, stock, and description for target.query keys.",
        ],
        required_inputs=[
            AssistantInputDoc(
                name="name",
                label="Product name",
                description="Display name visible in the catalog",
            ),
            AssistantInputDoc(
                name="category",
                label="Category",
                description="Catalog category used to classify the product",
            ),
        ],
        optional_inputs=[
            AssistantInputDoc(
                name="price",
                label="Price",
                description="Retail price shown to shoppers",
            ),
            AssistantInputDoc(
                name="stock",
                label="Stock",
                description="Initial stock level available in the catalog",
            ),
            AssistantInputDoc(
                name="description",
                label="Description",
                description="Optional catalog copy shown with the product card",
            ),
        ],
        outputs=[
            AssistantOutputDoc(
                name="product_id",
                description="Identifier of the created product for future chained steps",
            )
        ],
        operation_refs=[OperationRef(method="POST", path="/api/catalog/products/")],
    ),
    AssistantActionDoc(
        doc_id="cart.view",
        title="View cart",
        summary="Open the shopping cart and review the selected items.",
        intents=["open cart", "view my cart", "add something to cart"],
        examples=[
            "Take me to my cart",
            "Open the cart after I create a product",
            "Add banana with quantity 2 to my cart",
        ],
        frontend_notes=[
            "When the request names a product to add, place it in target.query.product.",
            "When the request includes a quantity, place it in target.query.quantity.",
            "Use the exact field names product and quantity for target.query keys.",
        ],
        optional_inputs=[
            AssistantInputDoc(
                name="product",
                label="Product",
                description="Product to add or focus in the shopping cart",
            ),
            AssistantInputDoc(
                name="quantity",
                label="Quantity",
                description="Preferred item quantity to focus in the cart",
            ),
        ],
        operation_refs=[OperationRef(method="GET", path="/api/cart/")],
    ),
    AssistantActionDoc(
        doc_id="checkout.view",
        title="Checkout",
        summary="Open the checkout flow for the current cart.",
        intents=["checkout", "pay", "complete the order"],
        examples=[
            "Go to checkout",
            "I want to finish the purchase",
        ],
        preconditions=["The cart should already contain the desired items."],
        operation_refs=[OperationRef(method="POST", path="/api/checkout/")],
    ),
]
