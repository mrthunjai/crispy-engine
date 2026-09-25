'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowRight, Package, MapPin, CreditCard, Loader2 } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Order } from '../lib/types'
import { money } from '../lib/data'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') || 'KSV-24001'
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data.order)
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    } else {
      setLoading(false)
    }
  }, [orderId])

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-36 md:px-10">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white">
          <Check size={28} />
        </div>
        <p className="mt-8 text-[10px] uppercase tracking-[.25em] text-black/50">
          Order Confirmation · {orderId}
        </p>
        <h1 className="mt-4 text-5xl tracking-[-.08em] md:text-7xl">
          It’s on its way.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-black/60">
          Thanks for choosing KESHEV. We’ve received your payment and our studio is
          preparing your pieces with care.
        </p>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-black/40" />
        </div>
      ) : order ? (
        <div className="mt-16 space-y-8 rounded-2xl bg-white p-7 shadow-sm md:p-10">
          <div className="border-b border-black/10 pb-6">
            <h2 className="text-xl tracking-tight">Receipt & Details</h2>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-black/60">
              <span className="flex items-center gap-1.5">
                <CreditCard size={14} /> Razorpay ID:{' '}
                <strong className="text-black font-mono">
                  {order.razorpayPaymentId || 'Verified'}
                </strong>
              </span>
              <span>•</span>
              <span>Status: <strong className="text-green-700 capitalize">{order.paymentStatus}</strong></span>
              <span>•</span>
              <span>
                Fulfillment:{' '}
                <strong className="text-ink capitalize">{order.fulfillmentStatus}</strong>
              </span>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] uppercase tracking-[.2em] text-black/50 mb-4">
              Items Ordered
            </p>
            <div className="divide-y divide-black/10">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 text-xs">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-black">{item.name}</p>
                    <p className="text-[11px] text-black/50">
                      {item.color} / {item.size} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{money(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Delivery Address */}
          <div className="grid gap-6 border-t border-black/10 pt-6 md:grid-cols-2 text-xs">
            <div>
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-[.2em] text-black/50 mb-2">
                <MapPin size={12} /> Delivery Destination
              </p>
              <p className="font-medium text-black">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </p>
              <p className="text-black/60 mt-1">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-black/60">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-black/60">
                {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                {order.shippingAddress.pincode}
              </p>
              <p className="text-black/60 mt-2">
                Phone: {order.shippingAddress.phone}
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1 text-[10px] uppercase tracking-[.2em] text-black/50 mb-2">
                <Package size={12} /> Shipping & Price Breakdown
              </p>
              <div className="space-y-1.5 text-black/75">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{money(order.pricing.subtotal)}</span>
                </div>
                {order.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount ({order.pricing.discountCode})</span>
                    <span>-{money(order.pricing.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {order.pricing.shippingFee === 0
                      ? 'Free'
                      : money(order.pricing.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-2 font-semibold text-black text-sm">
                  <span>Total Paid</span>
                  <span>{money(order.pricing.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-12 flex justify-center">
        <Link
          href="/shop"
          className="flex items-center gap-6 bg-ink px-6 py-4 text-[10px] uppercase tracking-[.2em] text-white hover:bg-black/90 transition"
        >
          Continue shopping <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  )
}

export default function Confirmation() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 size={24} className="animate-spin text-black/30" />
          </div>
        }
      >
        <ConfirmationContent />
      </Suspense>
      <Footer />
    </>
  )
}

