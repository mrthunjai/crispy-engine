import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getOrderById } from '../../../lib/orders'
import { hasSupabaseServerConfig, supabaseRest } from '../../../lib/supabase-rest'
import type { Tables } from '../../../lib/database.types'

type DbOrderItem = Pick<Tables<'order_items'>, 'id' | 'product_id' | 'variant_id' | 'product_name_snapshot' | 'colour_snapshot' | 'size_snapshot' | 'image_url_snapshot' | 'quantity' | 'unit_price_paise'>

type DbOrder = Omit<Pick<Tables<'orders'>, 'id' | 'shipping_address_snapshot' | 'subtotal_paise' | 'discount_paise' | 'shipping_paise' | 'total_paise' | 'discount_snapshot' | 'payment_status' | 'fulfilment_status' | 'created_at'>, 'discount_snapshot'> & {
  discount_snapshot: { code?: string } | null
  order_items: DbOrderItem[]
  payment_attempts: { razorpay_order_id: string; razorpay_payment_id: string | null }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  if (!hasSupabaseServerConfig()) {
    const order = getOrderById(id)
    return order
      ? NextResponse.json({ order })
      : NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Order access token is required.' }, { status: 401 })
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const access = await supabaseRest<{ order_id: string }[]>(`order_access_tokens?select=order_id&order_id=eq.${id}&token_hash=eq.${tokenHash}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`)
  if (!access[0]) return NextResponse.json({ error: 'Order access denied.' }, { status: 403 })

  const select = 'id,shipping_address_snapshot,subtotal_paise,discount_paise,shipping_paise,total_paise,discount_snapshot,payment_status,fulfilment_status,created_at,order_items(id,product_id,variant_id,product_name_snapshot,colour_snapshot,size_snapshot,image_url_snapshot,quantity,unit_price_paise),payment_attempts(razorpay_order_id,razorpay_payment_id)'
  const rows = await supabaseRest<DbOrder[]>(`orders?select=${encodeURIComponent(select)}&id=eq.${id}&limit=1`)
  const row = rows[0]
  if (!row) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  const payment = row.payment_attempts[0]
  return NextResponse.json({
    order: {
      id: row.id,
      razorpayOrderId: payment?.razorpay_order_id,
      razorpayPaymentId: payment?.razorpay_payment_id,
      items: row.order_items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        slug: item.product_id,
        name: item.product_name_snapshot,
        type: `${item.colour_snapshot} / ${item.size_snapshot}`,
        price: item.unit_price_paise / 100,
        image: item.image_url_snapshot || '',
        color: item.colour_snapshot,
        size: item.size_snapshot,
        quantity: item.quantity,
      })),
      shippingAddress: row.shipping_address_snapshot,
      pricing: {
        subtotal: row.subtotal_paise / 100,
        discountAmount: row.discount_paise / 100,
        discountCode: row.discount_snapshot?.code,
        shippingFee: row.shipping_paise / 100,
        shippingMethodId: 'standard',
        total: row.total_paise / 100,
      },
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfilment_status,
      createdAt: row.created_at,
      stockDecremented: row.payment_status === 'paid',
    },
  })
}
