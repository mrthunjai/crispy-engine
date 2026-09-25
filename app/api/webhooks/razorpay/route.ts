import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getOrderByRazorpayOrderId, markOrderAsPaid } from '../../../lib/orders'
import { decrementStockForItems } from '../../../lib/inventory'
import { hasSupabaseServerConfig, supabaseRest } from '../../../lib/supabase-rest'

type PaymentAttempt = { id: string; order_id: string; expected_amount_paise: number; currency: string }

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
    const eventId = payload.id || req.headers.get('x-razorpay-event-id')

    if (hasSupabaseServerConfig() && eventId) {
      const existing = await supabaseRest<{ id: string; processing_status: string; attempts: number }[]>(`webhook_events?select=id,processing_status,attempts&provider_event_id=eq.${encodeURIComponent(eventId)}&limit=1`)
      if (existing[0]?.processing_status === 'processed' || existing[0]?.processing_status === 'ignored') {
        return NextResponse.json({ status: 'ok', duplicate: true })
      }
      if (existing[0]) {
        await supabaseRest(`webhook_events?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          prefer: 'return=minimal',
          body: JSON.stringify({ processing_status: 'received', attempts: existing[0].attempts + 1 }),
        })
      } else {
        await supabaseRest('webhook_events', {
          method: 'POST',
          prefer: 'return=minimal',
          body: JSON.stringify({ provider_event_id: eventId, event_type: event, processing_status: 'received', attempts: 1 }),
        })
      }
    }

    // We process both payment.captured and order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity
      const orderEntity = payload.payload?.order?.entity

      const rpOrderId = paymentEntity?.order_id || orderEntity?.id
      const paymentId = paymentEntity?.id

      if (rpOrderId) {
        if (hasSupabaseServerConfig()) {
          const attempts = await supabaseRest<PaymentAttempt[]>(`payment_attempts?select=id,order_id,expected_amount_paise,currency&razorpay_order_id=eq.${encodeURIComponent(rpOrderId)}&limit=1`)
          const attempt = attempts[0]
          if (attempt && paymentId) {
            await supabaseRest('rpc/finalize_captured_payment', {
              method: 'POST',
              body: JSON.stringify({
                p_payment_attempt_id: attempt.id,
                p_razorpay_payment_id: paymentId,
                p_captured_amount_paise: Number(paymentEntity?.amount ?? attempt.expected_amount_paise),
                p_currency: paymentEntity?.currency || attempt.currency,
              }),
            })
          }
          if (eventId) {
            await supabaseRest(`webhook_events?provider_event_id=eq.${encodeURIComponent(eventId)}`, {
              method: 'PATCH',
              prefer: 'return=minimal',
              body: JSON.stringify({ processing_status: attempt ? 'processed' : 'ignored', processed_at: new Date().toISOString() }),
            })
          }
          return NextResponse.json({ status: 'ok', received: true })
        }
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

