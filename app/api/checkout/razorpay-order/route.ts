import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { getCatalogue } from '../../../lib/catalogue'
import { CartItem, Address } from '../../../lib/types'
import { calculateShippingFee } from '../../../lib/shipping'
import { validateAndApplyDiscount } from '../../../lib/discounts'
import { createPendingOrder } from '../../../lib/orders'
import { getRazorpayClient } from '../../../lib/razorpay'
import { hasSupabaseServerConfig, supabaseRest } from '../../../lib/supabase-rest'

type DbOrder = { id: string; order_number: string }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      items,
      shippingAddress,
      billingAddress,
      shippingMethod = 'standard',
      discountCode,
    }: {
      items: CartItem[]
      shippingAddress: Address
      billingAddress?: Address
      shippingMethod: 'standard' | 'express'
      discountCode?: string
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Please add items to checkout.' },
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingAddress.email || !shippingAddress.phone) {
      return NextResponse.json(
        { error: 'Contact and shipping address details are required.' },
        { status: 400 }
      )
    }

    // 1. Authoritative price recalculation (Zero-trust client)
    const products = await getCatalogue()
    let calculatedSubtotal = 0
    const verifiedItems: CartItem[] = []

    for (const item of items) {
      const canonicalProduct = products.find((p) => p.id === item.productId)
      if (!canonicalProduct) {
        return NextResponse.json(
          { error: `Invalid product in cart: ${item.slug}` },
          { status: 400 }
        )
      }
      const canonicalVariant = canonicalProduct.variants.find((variant) => variant.id === item.variantId)
      if (!canonicalVariant || canonicalVariant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `The selected variant is unavailable: ${item.name}` },
          { status: 409 }
        )
      }
      calculatedSubtotal += (canonicalVariant.pricePaise / 100) * item.quantity
      verifiedItems.push({
        ...item,
        productId: canonicalProduct.id,
        variantId: canonicalVariant.id,
        price: canonicalVariant.pricePaise / 100,
        name: canonicalProduct.name,
        color: canonicalVariant.colour,
        size: canonicalVariant.size,
      })
    }

    // 2. Validate discount code server-side
    let discountAmount = 0
    let isFreeShippingCoupon = false

    if (discountCode) {
      const discountRes = validateAndApplyDiscount(discountCode, calculatedSubtotal)
      if (discountRes.valid) {
        discountAmount = discountRes.discountAmount
        isFreeShippingCoupon = discountRes.isFreeShipping
      }
    }

    // 3. Calculate authoritative shipping fee
    const shippingFee = calculateShippingFee(
      calculatedSubtotal,
      shippingMethod,
      isFreeShippingCoupon
    )

    // 4. Final payable amount in INR
    const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + shippingFee)
    const amountInPaise = Math.round(totalAmount * 100)

    const keyId =
      process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

    // Check if live/test Razorpay keys are configured
    let rpOrderId: string

    if (process.env.RAZORPAY_KEY_SECRET && keyId && !keyId.includes('YourKeyId')) {
      const razorpay = getRazorpayClient()
      const rpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          customer_email: shippingAddress.email,
          customer_phone: shippingAddress.phone,
          customer_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        },
      })
      rpOrderId = rpOrder.id
    } else {
      // Mock order generation for local development / testing without live credentials
      rpOrderId = `order_sim_${Date.now()}`
    }

    // 5. Persist the order and its immutable line snapshots.
    let localOrderId: string
    let orderAccessToken: string | undefined
    if (hasSupabaseServerConfig()) {
      const orderNumber = `KSV-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`
      const created = await supabaseRest<DbOrder[]>('orders', {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify({
          order_number: orderNumber,
          contact_email: shippingAddress.email,
          shipping_address_snapshot: shippingAddress,
          subtotal_paise: Math.round(calculatedSubtotal * 100),
          discount_paise: Math.round(discountAmount * 100),
          shipping_paise: Math.round(shippingFee * 100),
          total_paise: amountInPaise,
          discount_snapshot: discountCode ? { code: discountCode } : null,
        }),
      })
      const dbOrder = created[0]
      if (!dbOrder) throw new Error('The pending order could not be created')
      await supabaseRest('order_items', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify(verifiedItems.map((item) => ({
          order_id: dbOrder.id,
          product_id: item.productId,
          variant_id: item.variantId,
          product_name_snapshot: item.name,
          sku_snapshot: products.find((product) => product.id === item.productId)?.variants.find((variant) => variant.id === item.variantId)?.sku || item.variantId,
          colour_snapshot: item.color,
          size_snapshot: item.size,
          image_url_snapshot: item.image,
          quantity: item.quantity,
          unit_price_paise: Math.round(item.price * 100),
          allocated_discount_paise: 0,
          line_total_paise: Math.round(item.price * item.quantity * 100),
        }))),
      })
      await supabaseRest('payment_attempts', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify({ order_id: dbOrder.id, razorpay_order_id: rpOrderId, expected_amount_paise: amountInPaise, currency: 'INR' }),
      })
      await supabaseRest('rpc/reserve_inventory', {
        method: 'POST',
        body: JSON.stringify({ p_order_id: dbOrder.id, p_items: verifiedItems.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })) }),
      })
      orderAccessToken = randomBytes(32).toString('base64url')
      await supabaseRest('order_access_tokens', {
        method: 'POST',
        prefer: 'return=minimal',
        body: JSON.stringify({
          order_id: dbOrder.id,
          token_hash: createHash('sha256').update(orderAccessToken).digest('hex'),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      })
      localOrderId = dbOrder.id
    } else {
      const order = createPendingOrder({
        razorpayOrderId: rpOrderId,
        items: verifiedItems,
        shippingAddress,
        billingAddress,
        pricing: {
          subtotal: calculatedSubtotal,
          discountAmount,
          discountCode,
          shippingFee,
          shippingMethodId: shippingMethod,
          total: totalAmount,
        },
      })
      localOrderId = order.id
    }

    return NextResponse.json({
      orderId: rpOrderId,
      localOrderId,
      orderAccessToken,
      amount: amountInPaise,
      currency: 'INR',
      keyId: keyId || 'rzp_test_simulated',
      isSimulated: !process.env.RAZORPAY_KEY_SECRET || keyId?.includes('YourKeyId'),
    })
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to initialize payment gateway order' },
      { status: 500 }
    )
  }
}

