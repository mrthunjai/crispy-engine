import { CartItem, InventoryItem } from './types'
import { products } from './data'

// Initial stock mapped from the current fallback catalogue.
const INITIAL_INVENTORY: Record<string, InventoryItem> = Object.fromEntries(
  products.map((product) => [product.slug, {
    slug: product.slug,
    name: product.name,
    price: product.pricePaise / 100,
    category: product.category,
    stock: product.variants.reduce((total, variant) => total + variant.stockQuantity, 0),
    lowStockThreshold: 5,
  }])
)

// Global variable across hot-reloads in Node runtime
const globalForInventory = globalThis as unknown as {
  inventoryStore?: Record<string, InventoryItem>
}

export const inventoryStore: Record<string, InventoryItem> =
  globalForInventory.inventoryStore || { ...INITIAL_INVENTORY }

if (process.env.NODE_ENV !== 'production') {
  globalForInventory.inventoryStore = inventoryStore
}

export function getAllInventory(): InventoryItem[] {
  return Object.values(inventoryStore)
}

export function getProductStock(slug: string): number {
  return inventoryStore[slug]?.stock ?? 0
}

export function checkItemsAvailability(items: CartItem[]): { available: boolean; outOfStockItems: string[] } {
  const outOfStockItems: string[] = []

  for (const item of items) {
    const current = inventoryStore[item.slug]
    if (!current || current.stock < item.quantity) {
      outOfStockItems.push(item.name || item.slug)
    }
  }

  return {
    available: outOfStockItems.length === 0,
    outOfStockItems,
  }
}

export function decrementStockForItems(items: CartItem[]): { success: boolean; error?: string } {
  // First verify all are available
  const check = checkItemsAvailability(items)
  if (!check.available) {
    return {
      success: false,
      error: `Items unavailable: ${check.outOfStockItems.join(', ')}`,
    }
  }

  // Atomically decrement
  for (const item of items) {
    if (inventoryStore[item.slug]) {
      inventoryStore[item.slug].stock -= item.quantity
      if (inventoryStore[item.slug].stock < 0) {
        inventoryStore[item.slug].stock = 0
      }
    }
  }

  return { success: true }
}

export function updateStock(slug: string, newStock: number): InventoryItem | null {
  if (inventoryStore[slug]) {
    inventoryStore[slug].stock = Math.max(0, newStock)
    return inventoryStore[slug]
  }
  return null
}

