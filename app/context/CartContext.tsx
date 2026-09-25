'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import { useStore } from '../components/StoreProvider'
import type { CartItem } from '../lib/types'
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
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setShippingMethod: (method: 'standard' | 'express') => void
  applyDiscount: (code: string) => { success: boolean; message?: string }
  removeDiscount: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const store = useStore()
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [discountCode, setDiscountCode] = useState<string | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)

  const items = useMemo<CartItem[]>(() => store.cart.map((item) => ({
    id: item.variantId,
    productId: item.productId,
    variantId: item.variantId,
    slug: item.slug,
    name: item.name,
    type: `${item.colour} / ${item.size}`,
    price: item.pricePaise / 100,
    image: item.image,
    color: item.colour,
    size: item.size,
    quantity: item.quantity,
  })), [store.cart])

  const subtotal = store.subtotalPaise / 100
  const discountResult = discountCode
    ? validateAndApplyDiscount(discountCode, subtotal)
    : { valid: false, discountAmount: 0, isFreeShipping: false }
  const discountAmount = discountResult.valid ? discountResult.discountAmount : 0
  const isFreeShippingPromo = discountResult.valid ? discountResult.isFreeShipping : false
  const shippingFee = calculateShippingFee(subtotal, shippingMethod, isFreeShippingPromo)
  const total = Math.max(0, subtotal - discountAmount + shippingFee)

  const applyDiscount = (code: string) => {
    const result = validateAndApplyDiscount(code, subtotal)
    if (!result.valid) {
      const message = result.error || 'Invalid code'
      setDiscountError(message)
      return { success: false, message }
    }
    setDiscountCode(code.trim().toUpperCase())
    setDiscountError(null)
    return { success: true }
  }

  const removeDiscount = () => {
    setDiscountCode(null)
    setDiscountError(null)
  }

  const value: CartContextType = {
    items,
    count: store.cartCount,
    subtotal,
    shippingMethod,
    shippingFee,
    discountCode,
    discountAmount,
    isFreeShippingPromo,
    discountError,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    freeShippingProgress: Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)),
    removeItem: store.removeFromCart,
    updateQuantity: store.setQuantity,
    clearCart: store.clearCart,
    setShippingMethod,
    applyDiscount,
    removeDiscount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
