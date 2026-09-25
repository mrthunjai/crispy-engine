'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Lock, Loader2, AlertCircle, ShoppingBag } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddressSelection, { PRESET_ADDRESSES } from '../components/checkout/AddressSelection'
import ShippingSelection from '../components/checkout/ShippingSelection'
import OrderSummary from '../components/checkout/OrderSummary'
import { useCart } from '../context/CartContext'
import { Address } from '../lib/types'
import { loadRazorpayScript } from '../lib/loadRazorpay'
import { money } from '../lib/data'

export default function CheckoutPage() {
  const router = useRouter()
  const {
    items,
    subtotal,
    shippingMethod,
    shippingFee,
    discountCode,
    discountAmount,
    isFreeShippingPromo,
    discountError,
    total,
    freeShippingThreshold,
    freeShippingRemaining,
    freeShippingProgress,
    setShippingMethod,
    applyDiscount,
    removeDiscount,
    clearCart,
  } = useCart()

  const [selectedAddress, setSelectedAddress] = useState<Address>(PRESET_ADDRESSES[0])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [simulatedModal, setSimulatedModal] = useState<{
    orderId: string
    localOrderId: string
    amount: number
  } | null>(null)

  const validateAddress = (addr: Address): boolean => {
    const errs: Record<string, string> = {}
    if (!addr.firstName.trim()) errs.firstName = 'First name is required'
    if (!addr.lastName.trim()) errs.lastName = 'Last name is required'
    if (!addr.email.trim() || !/\S+@\S+\.\S+/.test(addr.email))
      errs.email = 'Valid email is required'
    if (!addr.phone.trim() || addr.phone.length < 10)
      errs.phone = 'Valid 10-digit phone number is required'
    if (!addr.addressLine1.trim()) errs.addressLine1 = 'Street address is required'
    if (!addr.city.trim()) errs.city = 'City is required'
    if (!addr.state.trim()) errs.state = 'State is required'
    if (!addr.pincode.trim() || addr.pincode.length !== 6)
      errs.pincode = 'Valid 6-digit PIN code is required'

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckoutError(null)

    if (items.length === 0) {
      setCheckoutError('Your cart is empty. Please add pieces from the shop.')
      return
    }

    if (!validateAddress(selectedAddress)) {
      setCheckoutError('Please correct the address details highlighted above.')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Create Razorpay Order on server route handler
      const res = await fetch('/api/checkout/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shippingAddress: selectedAddress,
          shippingMethod,
          discountCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize order on server')
      }

      const { orderId, localOrderId, amount, currency, keyId, isSimulated } = data

      // 2. If running with test simulation mode (no live Razorpay keys configured yet)
      if (isSimulated) {
        setSimulatedModal({ orderId, localOrderId, amount })
        setIsProcessing(false)
        return
      }

      // 3. Load Razorpay Checkout Script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay payment SDK. Check your internet connection.')
      }

      // 4. Configure Razorpay modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'KESHEV',
        description: `Order ${localOrderId} — Everyday Essentials`,
        order_id: orderId,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80',
        prefill: {
          name: `${selectedAddress.firstName} ${selectedAddress.lastName}`,
          email: selectedAddress.email,
          contact: selectedAddress.phone,
        },
        notes: {
          local_order_id: localOrderId,
        },
        theme: {
          color: '#111111',
        },
        handler: async function (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) {
          try {
            setIsProcessing(true)
            // 5. Server-side payment verification
            const verifyRes = await fetch('/api/checkout/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment signature verification failed')
            }

            // 6. Clear cart and redirect
            clearCart()
            router.push(`/order-confirmation?orderId=${verifyData.orderId}`)
          } catch (verifyErr: any) {
            setCheckoutError(verifyErr.message || 'Payment verification failed.')
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (resp: any) {
        setCheckoutError(
          resp.error?.description || 'Payment was declined or failed. Please retry.'
        )
        setIsProcessing(false)
      })
      rzp.open()
    } catch (err: any) {
      console.error('Checkout error:', err)
      setCheckoutError(err.message || 'An unexpected error occurred during checkout.')
      setIsProcessing(false)
    }
  }

  // Handle simulation flow confirmation for immediate local testing
  const handleSimulatedPayment = async () => {
    if (!simulatedModal) return
    setIsProcessing(true)

    try {
      const verifyRes = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: simulatedModal.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          isSimulated: true,
        }),
      })

      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment verification failed')
      }

      setSimulatedModal(null)
      clearCart()
      router.push(`/order-confirmation?orderId=${verifyData.orderId}`)
    } catch (err: any) {
      setCheckoutError(err.message)
      setIsProcessing(false)
    }
  }

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
            Explore our collection of contemporary essentials and select your piece.
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
      <main className="mx-auto max-w-6xl px-5 pb-24 pt-36 md:px-10">
        {/* Top header navigation */}
        <div className="mb-10 flex items-end justify-between border-b border-black/10 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[.25em] text-black/60">
              02 / Secure Checkout
            </p>
            <h1 className="mt-2 text-5xl tracking-[-.07em] md:text-7xl">Checkout</h1>
          </div>
          <Link
            href="/cart"
            className="text-[10px] uppercase tracking-[.2em] underline hover:text-black/60"
          >
            Review Cart
          </Link>
        </div>

        {checkoutError && (
          <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{checkoutError}</span>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr]">
          {/* Main Form Details */}
          <form onSubmit={handlePlaceOrder} className="space-y-12">
            {/* Step 1: Delivery Address & Customer details */}
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl tracking-tight">Delivery Address</h2>
                <span className="text-[10px] uppercase tracking-wider text-black/45">
                  Step 1 of 3
                </span>
              </div>
              <AddressSelection
                selectedAddress={selectedAddress}
                onChange={setSelectedAddress}
                errors={formErrors}
              />
            </section>

            {/* Step 2: Shipping Method */}
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl tracking-tight">Shipping Method</h2>
                <span className="text-[10px] uppercase tracking-wider text-black/45">
                  Step 2 of 3
                </span>
              </div>
              <ShippingSelection
                subtotal={subtotal}
                selectedMethod={shippingMethod}
                isFreeShippingPromo={isFreeShippingPromo}
                onSelectMethod={setShippingMethod}
              />
            </section>

            {/* Step 3: Payment Gateway */}
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl tracking-tight">Payment Method</h2>
                <span className="text-[10px] uppercase tracking-wider text-black/45">
                  Step 3 of 3
                </span>
              </div>

              <div className="rounded-xl border border-ink bg-white p-5 text-sm shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                    <div>
                      <p className="font-medium text-black">
                        UPI, Cards, NetBanking & Wallets
                      </p>
                      <p className="mt-0.5 text-xs text-black/50">
                        Processed via Razorpay 256-bit encrypted gateway
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-black/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black/70">
                    Razorpay
                  </span>
                </div>
              </div>
            </section>

            {/* Submit CTA */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex w-full items-center justify-between bg-ink px-6 py-5 text-[11px] uppercase tracking-[.22em] text-white transition hover:bg-black/90 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Connecting to Payment Gateway...
                  </span>
                ) : (
                  <>
                    <span>Proceed to Pay {money(total)}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-black/50">
                <Lock size={12} /> By completing this purchase you agree to KESHEV's
                terms & refund policy.
              </p>
            </div>
          </form>

          {/* Right Aside: Order Summary */}
          <div>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              shippingMethod={shippingMethod}
              discountCode={discountCode}
              discountAmount={discountAmount}
              isFreeShippingPromo={isFreeShippingPromo}
              discountError={discountError}
              total={total}
              freeShippingThreshold={freeShippingThreshold}
              freeShippingRemaining={freeShippingRemaining}
              freeShippingProgress={freeShippingProgress}
              onApplyDiscount={applyDiscount}
              onRemoveDiscount={removeDiscount}
            />
          </div>
        </div>
      </main>

      {/* Simulated Razorpay Modal when live API keys are not yet configured */}
      {simulatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-semibold text-black/70">
                  Razorpay Sandbox Simulator
                </span>
              </div>
              <button
                onClick={() => setSimulatedModal(null)}
                className="text-xs text-black/40 hover:text-black"
              >
                Cancel
              </button>
            </div>

            <div className="my-6 space-y-4 text-left">
              <div>
                <p className="text-xs text-black/50">Total Amount to Pay</p>
                <p className="text-3xl font-semibold tracking-tight text-ink">
                  {money(simulatedModal.amount / 100)}
                </p>
              </div>

              <div className="rounded-lg bg-black/5 p-4 text-xs space-y-1.5">
                <p>
                  <strong>Customer:</strong> {selectedAddress.firstName}{' '}
                  {selectedAddress.lastName}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedAddress.phone}
                </p>
                <p>
                  <strong>Gateway Order ID:</strong>{' '}
                  <span className="font-mono text-[11px]">{simulatedModal.orderId}</span>
                </p>
              </div>

              <p className="text-[11px] leading-relaxed text-black/60">
                To link actual live or test transactions, insert your credentials in{' '}
                <code className="bg-black/5 px-1 py-0.5 rounded">.env.local</code>.
                Click below to simulate an authorized payment signature.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSimulatedModal(null)}
                className="flex-1 border border-black/20 py-3 text-xs uppercase tracking-wider text-black/70 hover:bg-black/5"
              >
                Abort
              </button>
              <button
                onClick={handleSimulatedPayment}
                disabled={isProcessing}
                className="flex-1 bg-ink py-3 text-xs uppercase tracking-wider text-white hover:bg-black/90 disabled:opacity-50"
              >
                {isProcessing ? 'Verifying...' : 'Simulate Success'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

