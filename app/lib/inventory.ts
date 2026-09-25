import { CartItem, InventoryItem } from './types'
import { products } from './data'

// Initial stock mapped from products
const INITIAL_INVENTORY: Record<string, InventoryItem> = {
  'everyday-tee': { slug: 'everyday-tee', name: 'The Everyday Tee', price: 2490, category: 'Tops', stock: 24, lowStockThreshold: 5 },
  'relaxed-overshirt': { slug: 'relaxed-overshirt', name: 'Relaxed Overshirt', price: 4990, category: 'Tops', stock: 18, lowStockThreshold: 5 },
  'studio-trouser': { slug: 'studio-trouser', name: 'Studio Trouser', price: 4490, category: 'Bottoms', stock: 12, lowStockThreshold: 5 },
  'daily-short': { slug: 'daily-short', name: 'Daily Short', price: 2990, category: 'Bottoms', stock: 20, lowStockThreshold: 5 },
  'boxy-shirt': { slug: 'boxy-shirt', name: 'Boxy Shirt', price: 3490, category: 'Tops', stock: 15, lowStockThreshold: 5 },
  'utility-pant': { slug: 'utility-pant', name: 'Utility Pant', price: 5290, category: 'Bottoms', stock: 4, lowStockThreshold: 5 },
}

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

