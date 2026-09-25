import { DiscountCode } from './types'

export const AVAILABLE_DISCOUNTS: DiscountCode[] = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrderValue: 2000,
    maxDiscount: 1500,
    description: '10% off on orders above ₹2,000 (up to ₹1,500 off)',
    isActive: true,
  },
  {
    code: 'SAVE500',
    type: 'fixed_amount',
    value: 500,
    minOrderValue: 3500,
    description: '₹500 flat off on orders above ₹3,500',
    isActive: true,
  },
  {
    code: 'FREESHIP',
    type: 'free_shipping',
    value: 0,
    minOrderValue: 1500,
    description: 'Free shipping on orders above ₹1,500',
    isActive: true,
  },
  {
    code: 'KESHEV20',
    type: 'percentage',
    value: 20,
    minOrderValue: 5000,
    maxDiscount: 2500,
    description: '20% VIP studio discount on orders above ₹5,000',
    isActive: true,
  }
]

export interface DiscountValidationResult {
  valid: boolean
  code?: string
  discountAmount: number
  isFreeShipping: boolean
  error?: string
  discount?: DiscountCode
}

export function validateAndApplyDiscount(
  rawCode: string,
  subtotal: number
): DiscountValidationResult {
  const code = rawCode.trim().toUpperCase()
  if (!code) {
    return { valid: false, discountAmount: 0, isFreeShipping: false }
  }

  const promo = AVAILABLE_DISCOUNTS.find(
    (d) => d.code.toUpperCase() === code && d.isActive
  )

  if (!promo) {
    return {
      valid: false,
      discountAmount: 0,
      isFreeShipping: false,
      error: `Coupon "${code}" is invalid or has expired.`,
    }
  }

  if (promo.minOrderValue && subtotal < promo.minOrderValue) {
    return {
      valid: false,
      discountAmount: 0,
      isFreeShipping: false,
      error: `Minimum order of ₹${promo.minOrderValue.toLocaleString('en-IN')} required for "${code}".`,
    }
  }

  if (promo.type === 'free_shipping') {
    return {
      valid: true,
      code: promo.code,
      discountAmount: 0,
      isFreeShipping: true,
      discount: promo,
    }
  }

  if (promo.type === 'fixed_amount') {
    const discountAmount = Math.min(promo.value, subtotal)
    return {
      valid: true,
      code: promo.code,
      discountAmount,
      isFreeShipping: false,
      discount: promo,
    }
  }

  if (promo.type === 'percentage') {
    let discountAmount = Math.round((subtotal * promo.value) / 100)
    if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
      discountAmount = promo.maxDiscount
    }
    return {
      valid: true,
      code: promo.code,
      discountAmount,
      isFreeShipping: false,
      discount: promo,
    }
  }

  return { valid: false, discountAmount: 0, isFreeShipping: false }
}

