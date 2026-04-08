import { readonly, ref } from 'vue'

export interface DemoCatalogProduct {
  name: string
  category: string
  price: string
  stock: string
  description: string
}

const initialProducts: DemoCatalogProduct[] = [
  {
    name: 'Solar Bottle',
    category: 'Outdoor',
    price: 'EUR 29',
    stock: 'Stock 50',
    description: 'Insulated reusable bottle with a solar-powered cap light for campers.',
  },
  {
    name: 'Trail Stove',
    category: 'Camping',
    price: 'EUR 79',
    stock: 'Stock 18',
    description: 'Compact gas stove designed for portable cooking kits and light packing.',
  },
  {
    name: 'Drift Lantern',
    category: 'Accessories',
    price: 'EUR 24',
    stock: 'Stock 34',
    description: 'Rechargeable lantern with a diffused glow and magnetic hanging hook.',
  },
]

const products = ref<DemoCatalogProduct[]>([...initialProducts])

/**
 * Formats a price for display in the demo catalog.
 * @param price Raw form input
 * @returns Catalog-ready price label
 */
function normalizePrice(price: string): string {
  const trimmedPrice = price.trim()
  if (!trimmedPrice) {
    return 'Price pending'
  }

  if (/^[A-Za-z]{3}\s+/.test(trimmedPrice)) {
    return trimmedPrice
  }

  return `EUR ${trimmedPrice}`
}

/**
 * Formats a stock value for display in the demo catalog.
 * @param stock Raw form input
 * @returns Catalog-ready stock label
 */
function normalizeStock(stock: string): string {
  const trimmedStock = stock.trim()
  if (!trimmedStock) {
    return 'Stock pending'
  }

  if (/^stock\s+/i.test(trimmedStock)) {
    return trimmedStock
  }

  return `Stock ${trimmedStock}`
}

/**
 * Exposes the in-memory demo catalog state.
 * @returns Shared product list and mutation helpers for the demo
 */
export function useDemoCatalog() {
  /**
   * Inserts or replaces a product in the demo catalog.
   * @param product Product values from the create form
   * @param product.name Product name
   * @param product.category Product category
   * @param product.price Product price
   * @param product.stock Product stock label or count
   * @param product.description Product description
   */
  function addProduct(product: {
    name: string
    category: string
    price: string
    stock: string
    description: string
  }) {
    const trimmedName = product.name.trim()
    const trimmedCategory = product.category.trim()

    products.value = [
      {
        name: trimmedName,
        category: trimmedCategory,
        price: normalizePrice(product.price),
        stock: normalizeStock(product.stock),
        description:
          product.description.trim() ||
          `${trimmedName} is available in the ${trimmedCategory} category.`,
      },
      ...products.value.filter(
        (existingProduct) => existingProduct.name.toLowerCase() !== trimmedName.toLowerCase()
      ),
    ]
  }

  return {
    products: readonly(products),
    addProduct,
  }
}
