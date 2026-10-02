'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product, ProductVariant } from '../lib/data'
import { createClient as createSupabaseClient } from '../lib/supabase/client'

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
  products: Product[]
  cart: CartItem[]
  cartCount: number
  cartReady: boolean
  subtotalPaise: number
  wishlist: string[]
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void
  setQuantity: (variantId: string, quantity: number) => void
  removeFromCart: (variantId: string) => void
  clearCart: () => void
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

const authHeaders = async (): Promise<Record<string, string>> => {
  const supabase = createSupabaseClient()
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}
}

export function StoreProvider({ children, initialProducts }: { children: React.ReactNode; initialProducts: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [cartReady, setCartReady] = useState(false)
  const [databaseCart, setDatabaseCart] = useState(false)

  useEffect(() => {
    setWishlist(readStored(WISHLIST_KEY, []))
    const loadCart = async () => {
      setCartReady(false)
      try {
        const response = await fetch('/api/cart', { headers: await authHeaders() })
        if (response.ok) {
          const body = await response.json() as { items: CartItem[] }
          setCart(body.items)
          setDatabaseCart(true)
          window.localStorage.removeItem(CART_KEY)
        } else {
          setCart(readStored(CART_KEY, []))
          setDatabaseCart(false)
        }
      } catch {
        setCart(readStored(CART_KEY, []))
        setDatabaseCart(false)
      } finally {
        setCartReady(true)
      }
    }
    void loadCart().finally(()=>setReady(true))
    const supabase = createSupabaseClient()
    const subscription = supabase?.auth.onAuthStateChange(() => { void loadCart() }).data.subscription
    return () => subscription?.unsubscribe()
  }, [])
  useEffect(() => { if (ready && !databaseCart) window.localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart, databaseCart, ready])
  useEffect(() => { if (ready) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)) }, [wishlist, ready])

  const syncCart = useCallback(async (method: 'POST'|'PATCH'|'DELETE', body: Record<string, unknown>) => {
    if (!databaseCart) return
    try {
      const response = await fetch('/api/cart', { method, headers: { 'Content-Type': 'application/json', ...await authHeaders() }, body: JSON.stringify(body) })
      if (!response.ok) return
      const payload = await response.json() as { items: CartItem[] }
      setCart(payload.items)
    } catch { /* The optimistic cart remains usable during a transient request failure. */ }
  }, [databaseCart])

  const addToCart = useCallback((product: Product, variant: ProductVariant, quantity = 1) => {
    if (variant.stockQuantity < 1) return
    setCart((current) => {
      const existing = current.find((item) => item.variantId === variant.id)
      if (existing) return current.map((item) => item.variantId === variant.id ? { ...item, quantity: Math.min(item.quantity + quantity, variant.stockQuantity) } : item)
      return [...current, { productId: product.id, variantId: variant.id, slug: product.slug, name: product.name, image: product.image, size: variant.size, colour: variant.colour, quantity: Math.min(quantity, variant.stockQuantity), pricePaise: variant.pricePaise, stockQuantity: variant.stockQuantity }]
    })
    void syncCart('POST', { productId: product.id, variantId: variant.id, quantity })
  }, [syncCart])
  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setCart((current) => current.flatMap((item) => item.variantId !== variantId ? [item] : quantity < 1 ? [] : [{ ...item, quantity: Math.min(quantity, item.stockQuantity) }]))
    void syncCart(quantity < 1 ? 'DELETE' : 'PATCH', { variantId, quantity })
  }, [syncCart])
  const removeFromCart = useCallback((variantId: string) => {
    setCart((current) => current.filter((item) => item.variantId !== variantId))
    void syncCart('DELETE', { variantId })
  }, [syncCart])
  const clearCart = useCallback(() => {
    setCart([])
    void syncCart('DELETE', { clear: true })
  }, [syncCart])
  const toggleWishlist = useCallback((productId: string) => setWishlist((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]), [])

  const value = useMemo(() => ({ products: initialProducts, cart, cartCount: cart.reduce((total, item) => total + item.quantity, 0), cartReady, subtotalPaise: cart.reduce((total, item) => total + item.pricePaise * item.quantity, 0), wishlist, addToCart, setQuantity, removeFromCart, clearCart, toggleWishlist, isWishlisted: (productId: string) => wishlist.includes(productId) }), [addToCart, cart, cartReady, clearCart, initialProducts, removeFromCart, setQuantity, toggleWishlist, wishlist])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore must be used inside StoreProvider')
  return value
}
