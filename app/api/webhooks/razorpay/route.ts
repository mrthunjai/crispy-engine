import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOrderByRazorpayOrderId, markOrderAsPaid } from '../../../lib/orders'
import { decrementStockForItems } from '../../../lib/inventory'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Webhook bypassed.')
      return NextResponse.json(
        { error: 'Webhook secret not configured on server' },
        { status: 500 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      )
    }

    // Verify HMAC-SHA256 signature against raw body
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event

    // We process both payment.captured and order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity
      const orderEntity = payload.payload?.order?.entity

      const rpOrderId = paymentEntity?.order_id || orderEntity?.id
      const paymentId = paymentEntity?.id

      if (rpOrderId) {
        const order = getOrderByRazorpayOrderId(rpOrderId)
        if (order) {
          // Idempotent order status update
          markOrderAsPaid(rpOrderId, paymentId || 'webhook_captured')

          // Idempotent stock decrement
          if (!order.stockDecremented) {
            const decResult = decrementStockForItems(order.items)
            if (decResult.success) {
              order.stockDecremented = true
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok', received: true }, { status: 200 })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

