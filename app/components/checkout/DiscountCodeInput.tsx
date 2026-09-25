'use client'

import React, { useState } from 'react'
import { Tag, Check, X, ArrowRight } from 'lucide-react'
import { AVAILABLE_DISCOUNTS } from '../../lib/discounts'

interface DiscountCodeInputProps {
  appliedCode: string | null
  discountAmount: number
  isFreeShipping: boolean
  error: string | null
  onApply: (code: string) => void
  onRemove: () => void
}

export default function DiscountCodeInput({
  appliedCode,
  discountAmount,
  isFreeShipping,
  error,
  onApply,
  onRemove,
}: DiscountCodeInputProps) {
  const [inputVal, setInputVal] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    onApply(inputVal)
    setInputVal('')
  }

  const handleApplyPreset = (code: string) => {
    onApply(code)
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-3">
      {appliedCode ? (
        <div className="flex items-center justify-between rounded-lg border border-green-700/20 bg-green-50/60 p-3.5 text-xs text-green-900">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-green-700" />
            <div>
              <p className="font-semibold uppercase tracking-wider">
                {appliedCode}
              </p>
              <p className="text-[11px] text-green-800/80">
                {isFreeShipping
                  ? 'Free shipping applied'
                  : `₹${discountAmount.toLocaleString('en-IN')} saved`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-green-200/50"
            title="Remove discount"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Tag
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40"
            />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.toUpperCase())}
              placeholder="Discount code or gift card"
              className="w-full border border-black/20 bg-white py-2.5 pl-9 pr-3 text-xs uppercase tracking-wider outline-none transition focus:border-ink"
            />
          </div>
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="flex items-center gap-1.5 bg-ink px-4 py-2.5 text-[10px] uppercase tracking-[.18em] text-white disabled:opacity-40"
          >
            Apply
          </button>
        </form>
      )}

      {error && !appliedCode && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {!appliedCode && (
        <div>
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-[11px] text-black/60 underline hover:text-black"
          >
            {showSuggestions ? 'Hide available offers' : 'View available offers'}
          </button>

          {showSuggestions && (
            <div className="mt-2 space-y-1.5 rounded-lg border border-black/10 bg-white p-3 text-xs">
              <p className="text-[10px] uppercase tracking-wider text-black/45">
                Active studio codes
              </p>
              {AVAILABLE_DISCOUNTS.filter((d) => d.isActive).map((d) => (
                <div
                  key={d.code}
                  className="flex items-center justify-between border-t border-black/5 pt-2"
                >
                  <div>
                    <span className="font-mono font-medium text-ink">{d.code}</span>
                    <span className="ml-2 text-black/60">{d.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(d.code)}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink underline"
                  >
                    Apply <ArrowRight size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

