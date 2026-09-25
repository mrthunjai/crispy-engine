'use client'

import React from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'
import { money } from '../lib/data'

interface FreeShippingBarProps {
  subtotal?: number
  threshold: number
  progress: number
  remaining: number
}


export default function FreeShippingBar({
  threshold,
  progress,
  remaining,
}: FreeShippingBarProps) {
  const isUnlocked = remaining <= 0

  return (
    <div className="rounded-xl border border-black/10 bg-[#f9f8f5] p-4 text-xs">
      <div className="flex items-center justify-between pb-2 font-medium">
        {isUnlocked ? (
          <span className="flex items-center gap-1.5 text-green-800">
            <CheckCircle2 size={15} className="text-green-700" />
            <span>Complimentary standard shipping unlocked</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-black/75">
            <Sparkles size={14} className="text-[#d48c3b]" />
            <span>
              Add <strong className="text-black">{money(remaining)}</strong> more to unlock{' '}
              <strong>Free Shipping</strong>
            </span>
          </span>
        )}
        <span className="text-[10px] tracking-wider text-black/45">
          Threshold: {money(threshold)}
        </span>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full transition-all duration-500 ease-out ${isUnlocked ? 'bg-green-700' : 'bg-ink'
            }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
