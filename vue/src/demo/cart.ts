import { computed, readonly, ref } from 'vue'

import { useDemoCatalog } from '@/demo/catalog'

export interface DemoCartItem {
  name: string
  quantity: number
  unitPrice: string
  linePrice: string
}

const initialCartItems: DemoCartItem[] = [
  {
    name: 'Trail Stove',
    quantity: 1,
    unitPrice: 'EUR 79',
    linePrice: 'EUR 79',
  },
  {
    name: 'Drift Lantern',
    quantity: 2,
    unitPrice: 'EUR 24',
    linePrice: 'EUR 48',
  },
]

const cartItems = ref<DemoCartItem[]>([...initialCartItems])

/**
 * Exposes the in-memory demo cart state.
 * @returns Shared cart items, total label, and mutation helpers for the demo
 */
export function useDemoCart() {
  const { products } = useDemoCatalog()

  /**
   * Adds or updates a product in the demo cart.
   * @param productName Product to store in the cart
   * @param quantityInput Desired cart quantity
   */
  function upsertProduct(productName: string, quantityInput: string | number) {
    const trimmedName = productName.trim()
    if (!trimmedName) {
      return
    }

    const normalizedQuantity = normalizeQuantity(quantityInput)
    const catalogProduct = products.value.find(
      (product) => product.name.toLowerCase() === trimmedName.toLowerCase()
    )
    const resolvedName = catalogProduct?.name ?? trimmedName
    const unitPrice = catalogProduct?.price ?? 'Price pending'

    cartItems.value = [
      {
        name: resolvedName,
        quantity: normalizedQuantity,
        unitPrice,
        linePrice: buildLinePrice(unitPrice, normalizedQuantity),
      },
      ...cartItems.value.filter(
        (existingItem) => existingItem.name.toLowerCase() !== resolvedName.toLowerCase()
      ),
    ]
  }

  const totalPrice = computed(() => {
    const totals = cartItems.value.map((item) => parseEuroAmount(item.linePrice))
    if (totals.some((value) => value === null)) {
      return 'Pending'
    }

    const total = totals.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    return `EUR ${total}`
  })

  return {
    cartItems: readonly(cartItems),
    totalPrice,
    upsertProduct,
  }
}

/**
 * Normalizes a quantity received from the router or assistant.
 * @param quantityInput Requested quantity value
 * @returns Positive integer quantity
 */
function normalizeQuantity(quantityInput: string | number): number {
  const parsedQuantity =
    typeof quantityInput === 'number' ? quantityInput : Number.parseInt(quantityInput.trim(), 10)

  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return 1
  }

  return Math.floor(parsedQuantity)
}

/**
 * Builds a line price from a unit price label and quantity.
 * @param unitPrice Unit price label
 * @param quantity Cart quantity
 * @returns Line price label
 */
function buildLinePrice(unitPrice: string, quantity: number): string {
  const parsedUnitPrice = parseEuroAmount(unitPrice)
  if (parsedUnitPrice === null) {
    return unitPrice
  }

  return `EUR ${parsedUnitPrice * quantity}`
}

/**
 * Parses a euro amount from the demo price labels.
 * @param label Price label
 * @returns Numeric amount or `null` when parsing fails
 */
function parseEuroAmount(label: string): number | null {
  const normalizedLabel = label.trim()
  const match = /^EUR\s+(\d+(?:[.,]\d+)?)$/i.exec(normalizedLabel)
  if (!match) {
    return null
  }

  return Number.parseFloat(match[1].replace(',', '.'))
}
