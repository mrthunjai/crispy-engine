'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product, ProductVariant } from '../lib/data'

export type CartItem = {
  productId: string
  variantId: string
  slug: string
  name: string
  image: string
  size: string
  colour: string
  quantity: number
  pricePaise: number
  stockQuantity: number
}

type StoreContextValue = {
  cart: CartItem[]
  cartCount: number
  subtotalPaise: number
  wishlist: string[]
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void
  setQuantity: (variantId: string, quantity: number) => void
  removeFromCart: (variantId: string) => void
  toggleWishlist: (productId: string) => void
  isWishlisted: (productId: string) => boolean
}

const StoreContext = createContext<StoreContextValue | null>(null)
const CART_KEY = 'store-cart-v1'
const WISHLIST_KEY = 'store-wishlist-v1'

const readStored = <T,>(key: string, fallback: T): T => {
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback }
  catch { return fallback }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => { setCart(readStored(CART_KEY, [])); setWishlist(readStored(WISHLIST_KEY, [])); setReady(true) }, [])
  useEffect(() => { if (ready) window.localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart, ready])
  useEffect(() => { if (ready) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)) }, [wishlist, ready])

  const addToCart = useCallback((product: Product, variant: ProductVariant, quantity = 1) => {
    if (variant.stockQuantity < 1) return
    setCart((current) => {
      const existing = current.find((item) => item.variantId === variant.id)
      if (existing) return current.map((item) => item.variantId === variant.id ? { ...item, quantity: Math.min(item.quantity + quantity, variant.stockQuantity) } : item)
      return [...current, { productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, image: product.image, size: variant.size, colour: variant.colour, quantity: Math.min(quantity, variant.stockQuantity), pricePaise: variant.pricePaise, stockQuantity: variant.stockQuantity }]
    })
  }, [])
  const setQuantity = useCallback((variantId: string, quantity: number) => setCart((current) => current.flatMap((item) => item.variantId !== variantId ? [item] : quantity < 1 ? [] : [{ ...item, quantity: Math.min(quantity, item.stockQuantity) }])), [])
  const removeFromCart = useCallback((variantId: string) => setCart((current) => current.filter((item) => item.variantId !== variantId)), [])
  const toggleWishlist = useCallback((productId: string) => setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]), [])

  const value = useMemo(() => ({ cart, cartCount: cart.reduce((total, item) => total + item.quantity, 0), subtotalPaise: cart.reduce((total, item) => total + item.pricePaise * item.quantity, 0), wishlist, addToCart, setQuantity, removeFromCart, toggleWishlist, isWishlisted: (productId: string) => wishlist.includes(productId) }), [addToCart, cart, removeFromCart, setQuantity, toggleWishlist, wishlist])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
