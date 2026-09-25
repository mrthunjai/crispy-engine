import { ShippingMethod } from './types'

export const FREE_SHIPPING_THRESHOLD = 3000
export const STANDARD_SHIPPING_FEE = 150
export const EXPRESS_SHIPPING_FEE = 250

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Dispatched in 1–2 days. Arrives in 3–6 business days.',
    deliveryEstimate: '3–6 business days',
    basePrice: STANDARD_SHIPPING_FEE,
  },
  {
    id: 'express',
    name: 'Express Studio Courier',
    description: 'Priority packing. Express air courier across major cities.',
    deliveryEstimate: '1–2 business days',
    basePrice: EXPRESS_SHIPPING_FEE,
  },
]

export function calculateShippingFee(
  subtotal: number,
  methodId: 'standard' | 'express',
  hasFreeShippingCoupon = false
): number {
  if (hasFreeShippingCoupon) return 0
  if (methodId === 'standard') {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE
  }
  if (methodId === 'express') {
    return EXPRESS_SHIPPING_FEE
  }
  return STANDARD_SHIPPING_FEE
}

