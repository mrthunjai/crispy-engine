'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { CartItem } from '../lib/types'
import { FREE_SHIPPING_THRESHOLD, calculateShippingFee } from '../lib/shipping'
import { validateAndApplyDiscount } from '../lib/discounts'

interface CartContextType {
  items: CartItem[]
  count: number
  subtotal: number
  shippingMethod: 'standard' | 'express'
  shippingFee: number
  discountCode: string | null
  discountAmount: number
  isFreeShippingPromo: boolean
  discountError: string | null
  total: number
  freeShippingThreshold: number
  freeShippingRemaining: number
  freeShippingProgress: number
  addItem: (item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setShippingMethod: (method: 'standard' | 'express') => void
  applyDiscount: (code: string) => { success: boolean; message?: string }
  removeDiscount: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const DEFAULT_ITEMS: CartItem[] = [
  {
    id: 'everyday-tee-Ink-M',
    slug: 'everyday-tee',
    name: 'The Everyday Tee',
    category: 'Tops',
    type: 'Heavyweight cotton / Ink',
    price: 2490,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85',
    color: 'Ink',
    size: 'M',
    quantity: 1,
  },
  {
    id: 'relaxed-overshirt-Bone-L',
    slug: 'relaxed-overshirt',
    name: 'Relaxed Overshirt',
    category: 'Tops',
    type: 'Organic twill / Bone',
    price: 4990,
    image: 'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=1000&q=85',
    color: 'Bone',
    size: 'L',
    quantity: 1,
  },
]

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [discountCode, setDiscountCode] = useState<string | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)

  // Load from localStorage or seed initial items
  useEffect(() => {
    try {
      const stored = localStorage.getItem('keshev_cart')
      if (stored) {
        const parsed = JSON.parse(stored)
        setItems(parsed.length > 0 ? parsed : DEFAULT_ITEMS)
      } else {
        setItems(DEFAULT_ITEMS)
      }
      const storedCoupon = localStorage.getItem('keshev_coupon')
      if (storedCoupon) {
        setDiscountCode(storedCoupon)
      }
    } catch {
      setItems(DEFAULT_ITEMS)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem('keshev_cart', JSON.stringify(items))
      if (discountCode) {
        localStorage.setItem('keshev_coupon', discountCode)
      } else {
        localStorage.removeItem('keshev_coupon')
      }
    } catch {
      // LocalStorage errors ignored
    }
  }, [items, discountCode, isLoaded])

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const count = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  // Discount calculation
  const discountResult = useMemo(() => {
    if (!discountCode) {
      return { valid: false, discountAmount: 0, isFreeShipping: false }
    }
    const res = validateAndApplyDiscount(discountCode, subtotal)
    if (!res.valid && res.error) {
      setDiscountError(res.error)
    } else {
      setDiscountError(null)
    }
    return res
  }, [discountCode, subtotal])

  const discountAmount = discountResult.valid ? discountResult.discountAmount : 0
  const isFreeShippingPromo = discountResult.valid ? discountResult.isFreeShipping : false

  // Shipping calculation
  const shippingFee = useMemo(() => {
    return calculateShippingFee(subtotal, shippingMethod, isFreeShippingPromo)
  }, [subtotal, shippingMethod, isFreeShippingPromo])

  // Total
  const total = useMemo(() => {
    const net = subtotal - discountAmount + shippingFee
    return Math.max(0, net)
  }, [subtotal, discountAmount, shippingFee])

  // Free shipping progress
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))

  const addItem = (item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number }) => {
    const id = `${item.slug}-${item.color}-${item.size}`
    const qty = item.quantity || 1
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx > -1) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty }
        return next
      }
      return [...prev, { ...item, id, quantity: qty }]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => {
    setItems([])
    setDiscountCode(null)
    setDiscountError(null)
    try {
      localStorage.removeItem('keshev_cart')
      localStorage.removeItem('keshev_coupon')
    } catch { }
  }

  const applyDiscount = (code: string) => {
    const res = validateAndApplyDiscount(code, subtotal)
    if (res.valid) {
      setDiscountCode(code.trim().toUpperCase())
      setDiscountError(null)
      return { success: true }
    } else {
      setDiscountError(res.error || 'Invalid code')
      return { success: false, message: res.error || 'Invalid code' }
    }
  }

  const removeDiscount = () => {
    setDiscountCode(null)
    setDiscountError(null)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        shippingMethod,
        shippingFee,
        discountCode,
        discountAmount,
        isFreeShippingPromo,
        discountError,
        total,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingRemaining,
        freeShippingProgress,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setShippingMethod,
        applyDiscount,
        removeDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}

