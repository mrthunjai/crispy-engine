'use client'

import React from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { CartItem } from '../../lib/types'
import { money } from '../../lib/data'
import FreeShippingBar from '../FreeShippingBar'
import DiscountCodeInput from './DiscountCodeInput'

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  shippingFee: number
  shippingMethod: 'standard' | 'express'
  discountCode: string | null
  discountAmount: number
  isFreeShippingPromo: boolean
  discountError: string | null
  total: number
  freeShippingThreshold: number
  freeShippingRemaining: number
  freeShippingProgress: number
  onApplyDiscount: (code: string) => void
  onRemoveDiscount: () => void
}

export default function OrderSummary({
  items,
  subtotal,
  shippingFee,
  shippingMethod,
  discountCode,
  discountAmount,
  isFreeShippingPromo,
  discountError,
  total,
  freeShippingThreshold,
  freeShippingRemaining,
  freeShippingProgress,
  onApplyDiscount,
  onRemoveDiscount,
}: OrderSummaryProps) {
  return (
    <aside className="h-fit rounded-2xl bg-white p-7 shadow-sm">
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <h2 className="text-xl tracking-tight">Order Summary</h2>
        <span className="text-xs text-black/50">
          {items.reduce((s, i) => s + i.quantity, 0)} items
        </span>
      </div>

      {/* Free shipping progress */}
      <div className="mt-5">
        <FreeShippingBar
          threshold={freeShippingThreshold}
          progress={freeShippingProgress}
          remaining={freeShippingRemaining}
        />
      </div>

      {/* Cart items preview */}
      <div className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 text-xs">
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded bg-black/5">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] text-white">
                {item.quantity}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between py-0.5">
              <div>
                <p className="font-medium text-black">{item.name}</p>
                <p className="text-[11px] text-black/50">
                  {item.color} / {item.size}
                </p>
              </div>
              <p className="font-medium text-black">
                {money(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Input */}
      <div className="mt-6 border-t border-black/10 pt-5">
        <DiscountCodeInput
          appliedCode={discountCode}
          discountAmount={discountAmount}
          isFreeShipping={isFreeShippingPromo}
          error={discountError}
          onApply={onApplyDiscount}
          onRemove={onRemoveDiscount}
        />
      </div>

      {/* Pricing breakdown */}
      <div className="mt-6 space-y-3 border-t border-black/10 pt-5 text-xs text-black/75">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium text-black">{money(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount ({discountCode})</span>
            <span className="font-medium">-{money(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>
            Shipping ({shippingMethod === 'standard' ? 'Standard' : 'Express'})
          </span>
          <span className="font-medium text-black">
            {shippingFee === 0 ? (
              <span className="text-green-700 uppercase tracking-wider text-[10px] font-semibold">
                Free
              </span>
            ) : (
              money(shippingFee)
            )}
          </span>
        </div>

        <div className="border-t border-black/15 pt-4 text-base font-semibold text-black">
          <div className="flex items-baseline justify-between">
            <span>Total Payable</span>
            <span className="text-2xl tracking-tight">{money(total)}</span>
          </div>
          <p className="mt-1 text-[10px] font-normal text-black/45">
            Inclusive of all taxes & studio packaging
          </p>
        </div>
      </div>

      {/* Security assurance */}
      <div className="mt-8 space-y-2 border-t border-black/10 pt-4 text-[11px] text-black/55">
        <p className="flex items-center gap-2">
          <Lock size={13} className="text-ink" /> 256-bit encrypted checkout via
          Razorpay
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-ink" /> Verified payment & studio
          warranty
        </p>
      </div>
    </aside>
  )
}

