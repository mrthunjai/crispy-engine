import { NextRequest, NextResponse } from 'next/server'
import { products } from '../../../lib/data'
import { CartItem, Address } from '../../../lib/types'
import { calculateShippingFee } from '../../../lib/shipping'
import { validateAndApplyDiscount } from '../../../lib/discounts'
import { checkItemsAvailability } from '../../../lib/inventory'
import { createPendingOrder } from '../../../lib/orders'
import { getRazorpayClient } from '../../../lib/razorpay'

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
    let calculatedSubtotal = 0
    const verifiedItems: CartItem[] = []

    for (const item of items) {
      const canonicalProduct = products.find((p) => p.slug === item.slug)
      if (!canonicalProduct) {
        return NextResponse.json(
          { error: `Invalid product in cart: ${item.slug}` },
          { status: 400 }
        )
      }
      calculatedSubtotal += canonicalProduct.price * item.quantity
      verifiedItems.push({
        ...item,
        price: canonicalProduct.price,
        name: canonicalProduct.name,
      })
    }

    // 2. Check inventory availability
    const inventoryCheck = checkItemsAvailability(verifiedItems)
    if (!inventoryCheck.available) {
      return NextResponse.json(
        {
          error: `Some items are currently out of stock: ${inventoryCheck.outOfStockItems.join(
            ', '
          )}`,
        },
        { status: 409 }
      )
    }

    // 3. Validate discount code server-side
    let discountAmount = 0
    let isFreeShippingCoupon = false

    if (discountCode) {
      const discountRes = validateAndApplyDiscount(discountCode, calculatedSubtotal)
      if (discountRes.valid) {
        discountAmount = discountRes.discountAmount
        isFreeShippingCoupon = discountRes.isFreeShipping
      }
    }

    // 4. Calculate authoritative shipping fee
    const shippingFee = calculateShippingFee(
      calculatedSubtotal,
      shippingMethod,
      isFreeShippingCoupon
    )

    // 5. Final payable amount in INR
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

    // 6. Record pending order in database/store
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

    return NextResponse.json({
      orderId: rpOrderId,
      localOrderId: order.id,
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

