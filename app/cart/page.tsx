'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FreeShippingBar from '../components/FreeShippingBar'
import DiscountCodeInput from '../components/checkout/DiscountCodeInput'
import { useCart } from '../context/CartContext'
import { moneyRupees as money } from '../lib/data'

export default function Cart() {
  const {
    items,
    count,
    subtotal,
    shippingFee,
    discountCode,
    discountAmount,
    isFreeShippingPromo,
    discountError,
    total,
    freeShippingThreshold,
    freeShippingRemaining,
    freeShippingProgress,
    updateQuantity,
    removeItem,
    applyDiscount,
    removeDiscount,
  } = useCart()

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-5 pt-36 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 text-ink">
            <ShoppingBag size={24} />
          </div>
          <h1 className="mt-6 text-4xl tracking-tight md:text-5xl">Your bag is empty</h1>
          <p className="mt-3 max-w-sm text-sm text-black/60">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link
            href="/shop"
            className="mt-8 flex items-center gap-6 bg-ink px-6 py-4 text-[10px] uppercase tracking-[.2em] text-white"
          >
            Explore collection <ArrowRight size={15} />
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="px-5 pb-24 pt-36 md:px-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[.25em]">Your selection</p>
            <h1 className="mt-4 text-6xl tracking-[-.08em] md:text-8xl">
              Cart <span className="text-black/30">({count})</span>
            </h1>
          </div>
          <Link
            href="/shop"
            className="text-[10px] uppercase tracking-[.2em] underline hover:text-black/60"
          >
            Continue shopping
          </Link>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          {/* Cart items list */}
          <div>
            <div className="mb-6">
              <FreeShippingBar
                threshold={freeShippingThreshold}
                progress={freeShippingProgress}
                remaining={freeShippingRemaining}
              />
            </div>

            <div className="divide-y divide-black/15 border-t border-black/15">
              {items.map((item) => (
                <div key={item.id} className="flex gap-5 py-6">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-32 w-24 object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-black">{item.name}</p>
                        <p className="mt-1 text-xs text-black/45">
                          {item.type} · Size: {item.size} · Color: {item.color}
                        </p>
                      </div>
                      <p className="font-medium">{money(item.price * item.quantity)}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 border border-black/20 px-3 py-2 text-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="hover:text-black/60"
                          title="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="hover:text-black/60"
                          title="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-black/40 hover:text-red-600 transition"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <aside className="h-fit rounded-2xl bg-white p-7 shadow-sm">
            <h2 className="text-xl tracking-tight">Summary</h2>

            <div className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount ({discountCode})</span>
                  <span>-{money(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Standard Shipping</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-green-700 font-semibold">Free</span>
                  ) : (
                    money(shippingFee)
                  )}
                </span>
              </div>

              <div className="border-t border-black/15 pt-4 text-base font-semibold">
                <div className="flex justify-between">
                  <span>Estimated Total</span>
                  <span className="text-xl">{money(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <DiscountCodeInput
                appliedCode={discountCode}
                discountAmount={discountAmount}
                isFreeShipping={isFreeShippingPromo}
                error={discountError}
                onApply={applyDiscount}
                onRemove={removeDiscount}
              />
            </div>

            <Link
              href="/checkout"
              className="mt-7 flex items-center justify-between bg-ink px-5 py-4 text-[10px] uppercase tracking-[.2em] text-white hover:bg-black/90 transition"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}

