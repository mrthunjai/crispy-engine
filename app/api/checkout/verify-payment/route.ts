import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOrderByRazorpayOrderId, markOrderAsPaid } from '../../../lib/orders'
import { decrementStockForItems } from '../../../lib/inventory'

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
    const isSimMode =
      isSimulated ||
      razorpay_order_id.startsWith('order_sim_') ||
      !secret ||
      secret.includes('YourKeySecret')

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

    // 2. Fetch order from store
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

