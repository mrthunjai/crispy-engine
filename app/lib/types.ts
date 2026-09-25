export interface CartItem {
  id: string; // e.g. `${slug}-${color}-${size}`
  slug: string;
  name: string;
  category?: string;
  type: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}

export interface Address {
  id: string;
  label?: string;
  isDefault?: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface DiscountCode {
  code: string;
  type: DiscountType;
  value: number; // e.g., 10 for 10%, 500 for ₹500
  minOrderValue?: number;
  maxDiscount?: number;
  description: string;
  isActive: boolean;
}

export interface ShippingMethod {
  id: 'standard' | 'express';
  name: string;
  description: string;
  deliveryEstimate: string;
  basePrice: number;
}

export interface OrderPricing {
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  shippingFee: number;
  shippingMethodId: 'standard' | 'express';
  total: number;
}

export interface Order {
  id: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  items: CartItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  pricing: OrderPricing;
  paymentStatus: 'pending' | 'paid' | 'failed';
  fulfillmentStatus: 'unfulfilled' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
  stockDecremented: boolean;
}

export interface InventoryItem {
  slug: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  lowStockThreshold: number;
}

