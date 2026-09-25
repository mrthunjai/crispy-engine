import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOrderByRazorpayOrderId, markOrderAsPaid } from '../../../lib/orders'
import { decrementStockForItems } from '../../../lib/inventory'
import { hasSupabaseServerConfig, supabaseRest } from '../../../lib/supabase-rest'

type PaymentAttempt = { id: string; order_id: string; expected_amount_paise: number; currency: string }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      isSimulated,
    } = body

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      )
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    const isSimMode = process.env.NODE_ENV !== 'production' && (
      isSimulated || razorpay_order_id.startsWith('order_sim_') || !secret || secret.includes('YourKeySecret')
    )

    if (!isSimMode && !secret) {
      return NextResponse.json({ error: 'Payment verification is not configured.' }, { status: 503 })
    }

    if (!isSimMode) {
      // 1. Verify HMAC SHA-256 signature
      const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`
      const expectedSignature = crypto
        .createHmac('sha256', secret!)
        .update(bodyToSign)
        .digest('hex')

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json(
          { error: 'Payment signature verification failed. Untrusted response.' },
          { status: 400 }
        )
      }
    }

    if (hasSupabaseServerConfig()) {
      const attempts = await supabaseRest<PaymentAttempt[]>(`payment_attempts?select=id,order_id,expected_amount_paise,currency&razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}&limit=1`)
      const attempt = attempts[0]
      if (!attempt) return NextResponse.json({ error: 'Payment attempt not found.' }, { status: 404 })
      await supabaseRest('rpc/finalize_captured_payment', {
        method: 'POST',
        body: JSON.stringify({
          p_payment_attempt_id: attempt.id,
          p_razorpay_payment_id: razorpay_payment_id,
          p_captured_amount_paise: attempt.expected_amount_paise,
          p_currency: attempt.currency,
        }),
      })
      return NextResponse.json({
        success: true,
        orderId: attempt.order_id,
        paymentId: razorpay_payment_id,
        message: 'Payment verified and inventory finalized.',
      })
    }

    // 2. Local-development fallback when Supabase is not configured.
    const order = getOrderByRazorpayOrderId(razorpay_order_id)
    if (!order) {
      return NextResponse.json(
        { error: `Order record not found for Razorpay order ID ${razorpay_order_id}` },
        { status: 404 }
      )
    }

    // 3. Mark order as paid
    const updateRes = markOrderAsPaid(razorpay_order_id, razorpay_payment_id)

    // 4. Atomically decrement stock if not already decremented (Idempotent guard)
    if (!order.stockDecremented) {
      const decResult = decrementStockForItems(order.items)
      if (decResult.success) {
        order.stockDecremented = true
      } else {
        console.warn('Stock decrement warning:', decResult.error)
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentId: razorpay_payment_id,
      message: 'Payment verified and stock decremented successfully.',
    })
  } catch (err: any) {
    console.error('Payment verification error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal payment verification error' },
      { status: 500 }
    )
  }
}

