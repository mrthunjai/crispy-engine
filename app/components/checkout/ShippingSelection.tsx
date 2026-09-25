'use client'

import React from 'react'
import { Check, Truck, Zap } from 'lucide-react'
import { ShippingMethod } from '../../lib/types'
import { SHIPPING_METHODS, FREE_SHIPPING_THRESHOLD } from '../../lib/shipping'
import { moneyRupees as money } from '../../lib/data'

interface ShippingSelectionProps {
  subtotal: number
  selectedMethod: 'standard' | 'express'
  isFreeShippingPromo: boolean
  onSelectMethod: (method: 'standard' | 'express') => void
}

export default function ShippingSelection({
  subtotal,
  selectedMethod,
  isFreeShippingPromo,
  onSelectMethod,
}: ShippingSelectionProps) {
  return (
    <div className="space-y-3">
      {SHIPPING_METHODS.map((method) => {
        const isSelected = selectedMethod === method.id
        let costLabel = money(method.basePrice)
        let isFree = false

        if (method.id === 'standard') {
          if (subtotal >= FREE_SHIPPING_THRESHOLD || isFreeShippingPromo) {
            costLabel = 'Free'
            isFree = true
          }
        } else if (isFreeShippingPromo) {
          // Express still has a modest charge or discount if desired
        }

        return (
          <label
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            className={`flex cursor-pointer items-start justify-between rounded-xl border p-4 transition ${isSelected
              ? 'border-ink bg-white shadow-sm ring-1 ring-ink'
              : 'border-black/15 bg-white/50 hover:border-black/30'
              }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${isSelected ? 'border-ink bg-ink text-white' : 'border-black/30'
                  }`}
              >
                {isSelected && <Check size={10} />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  {method.id === 'express' ? (
                    <Zap size={14} className="text-amber-600" />
                  ) : (
                    <Truck size={14} className="text-black/60" />
                  )}
                  <span className="text-sm font-medium tracking-tight">
                    {method.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-black/55">{method.description}</p>
                <p className="mt-1 text-[11px] font-medium text-black/80">
                  Estimated delivery: {method.deliveryEstimate}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-sm font-semibold ${isFree ? 'text-green-700' : 'text-black'
                  }`}
              >
                {costLabel}
              </span>
            </div>
          </label>
        )
      })}
    </div>
  )
}

