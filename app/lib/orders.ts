import { Order, CartItem, Address, OrderPricing } from './types'

const globalForOrders = globalThis as unknown as {
  ordersStore?: Map<string, Order>
}

export const ordersStore: Map<string, Order> =
  globalForOrders.ordersStore || new Map<string, Order>()

if (process.env.NODE_ENV !== 'production') {
  globalForOrders.ordersStore = ordersStore
}

export function createPendingOrder(data: {
  razorpayOrderId: string
  items: CartItem[]
  shippingAddress: Address
  billingAddress?: Address
  pricing: OrderPricing
}): Order {
  const localId = `KSV-${Date.now().toString().slice(-5)}`
  const order: Order = {
    id: localId,
    razorpayOrderId: data.razorpayOrderId,
    items: data.items,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress,
    pricing: data.pricing,
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    createdAt: new Date().toISOString(),
    stockDecremented: false,
  }

  ordersStore.set(order.id, order)
  ordersStore.set(order.razorpayOrderId!, order)
  return order
}

export function getOrderById(orderId: string): Order | undefined {
  return ordersStore.get(orderId)
}

export function getOrderByRazorpayOrderId(rpOrderId: string): Order | undefined {
  return ordersStore.get(rpOrderId)
}

export function markOrderAsPaid(
  orderIdOrRpId: string,
  razorpayPaymentId: string
): { success: boolean; order?: Order; alreadyPaid?: boolean } {
  const order = ordersStore.get(orderIdOrRpId)
  if (!order) {
    return { success: false }
  }

  if (order.paymentStatus === 'paid') {
    return { success: true, order, alreadyPaid: true }
  }

  order.paymentStatus = 'paid'
  order.razorpayPaymentId = razorpayPaymentId
  order.fulfillmentStatus = 'processing'

  return { success: true, order, alreadyPaid: false }
}

