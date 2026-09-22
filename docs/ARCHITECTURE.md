# V1 Architecture

## Scope

V1 supports the complete first-purchase journey:

- Product browsing, search, filtering and sorting
- Size and colour variants
- Product-level wishlists
- Guest and authenticated carts
- Customer accounts and saved addresses
- Server-authoritative checkout
- Razorpay payments
- Order confirmation and order history
- Variant-level inventory
- Basic catalogue, inventory, fulfilment and refund administration

Reviews, recommendations, recently viewed products, bundles, back-in-stock alerts, abandoned-cart recovery, loyalty, referrals, advanced promotions, social catalogue sync and detailed self-service returns remain deferred.

## Platform

| Area | Technology | Responsibility |
| --- | --- | --- |
| Web application | Next.js App Router | Storefront, account, checkout, admin UI and server route handlers |
| Database | Supabase PostgreSQL | Catalogue, customer data, carts, inventory, orders and payments |
| Authentication | Supabase Auth | Sessions, signup, login, password reset and email verification |
| Payments | Razorpay | Payment collection and refunds |
| Production hosting | Vercel | Server-capable Next.js deployment and environment variables |
| Preview hosting | GitHub Pages | Static storefront preview only |
| Email | Transactional email provider | Order confirmation and shipping notifications |

GitHub Pages cannot execute Next.js route handlers, authentication middleware, scheduled cleanup, payment verification or Razorpay webhooks. Before the backend is integrated, remove the production dependency on `output: 'export'` and deploy the complete application to Vercel. The static Pages workflow may remain as a UI preview if desired.

## Catalogue decisions

- Tops and Bottoms are the initial categories.
- New arrivals use an explicit merchandising flag.
- Sale products are derived from variants whose compare-at price exceeds their selling price.
- Bestseller is a manually managed merchandising flag in V1.
- Size and colour are the only purchasable variant dimensions.
- Fit is descriptive product information and is not a selectable variant.
- Wishlist entries reference products. A variant is selected when moving an item to the cart.
- Available, low-stock and out-of-stock states are derived from inventory.
- Discontinued is an explicit variant state.
- The six initial products produce 54 size and colour variants.

All money values use integer paise. For example, ₹2,490 is stored as `249000`.

## Database schema

Use UUID primary keys, `timestamptz` timestamps, foreign keys, check constraints and indexes on foreign keys and common query fields.

### Catalogue and inventory

#### `categories`

- `id`
- `slug`, unique
- `name`
- `sort_order`
- `created_at`, `updated_at`

#### `products`

- `id`
- `category_id`
- `slug`, unique
- `name`
- `description`
- `care_instructions`
- `status`: `draft`, `active`, `archived`
- `is_new`
- `is_bestseller`
- `created_at`, `updated_at`

Only active products appear publicly.

#### `product_variants`

- `id`
- `product_id`
- `sku`, unique
- `size`
- `colour`
- `price_paise`
- `compare_at_price_paise`, nullable
- `is_discontinued`
- `created_at`, `updated_at`

Enforce uniqueness on `(product_id, size, colour)`. The compare-at price, when present, must exceed the selling price.

#### `product_images`

- `id`
- `product_id`
- `variant_id`, nullable
- `storage_path`
- `alt_text`
- `sort_order`

A linked variant must belong to the same product.

#### `inventory`

- `variant_id`, primary key
- `stock_quantity`
- `low_stock_threshold`
- `updated_at`

Each variant has exactly one inventory row. Do not duplicate editable stock on `product_variants`.

#### `inventory_reservations`

- `id`
- `order_id`
- `variant_id`
- `quantity`
- `status`: `active`, `consumed`, `released`, `expired`
- `expires_at`
- `created_at`, `updated_at`

#### `inventory_adjustments`

- `id`
- `variant_id`
- `quantity_change`, signed integer
- `reason`
- `actor_id`
- `order_id`, nullable
- `created_at`

Every manual stock change requires a reason and actor.

### Customers, addresses, carts and wishlists

#### `profiles`

- `id`, references `auth.users.id`
- `full_name`
- `phone`
- `account_status`
- `created_at`, `updated_at`

Supabase Auth owns the authoritative email address.

#### `user_roles`

- `user_id`
- `role`: `customer`, `admin`

Customers cannot modify roles. Admin membership is managed through trusted server operations.

#### `addresses`

- `id`
- `user_id`
- `recipient_name`
- `phone`
- `address_line_1`
- `address_line_2`, nullable
- `city`
- `state`
- `pincode`
- `country`, default `IN`
- `is_default`
- `created_at`, `updated_at`

Enforce at most one default address per customer.

#### `carts`

- `id`
- `user_id`, nullable
- `guest_token_hash`, nullable
- `status`: `active`, `merged`, `converted`, `abandoned`
- `expires_at`
- `created_at`, `updated_at`

A cart has exactly one owner type: authenticated user or guest token. Allow at most one active cart per customer.

#### `cart_items`

- `id`
- `cart_id`
- `product_id`
- `variant_id`
- `size_snapshot`
- `colour_snapshot`
- `quantity`
- `price_snapshot_paise`
- `name_snapshot`
- `image_snapshot`
- `created_at`, `updated_at`

Enforce uniqueness on `(cart_id, variant_id)`. Cart snapshots support display but never authorize checkout price or availability.

#### `wishlists`

- `id`
- `user_id`, unique
- `created_at`, `updated_at`

#### `wishlist_items`

- `id`
- `wishlist_id`
- `product_id`
- `created_at`

Enforce uniqueness on `(wishlist_id, product_id)`.

### Orders, payments and operations

#### `orders`

- `id`
- `order_number`, unique and human-readable
- `user_id`, nullable for guest checkout
- `contact_email`
- delivery address snapshot fields
- `currency`, default `INR`
- `subtotal_paise`
- `discount_paise`
- `shipping_paise`
- `total_paise`
- discount snapshot, nullable
- `payment_status`
- `fulfilment_status`
- `checkout_idempotency_key`, unique
- `created_at`, `updated_at`

Address and monetary snapshots become immutable when the payable order is created.

#### `order_items`

- `id`
- `order_id`
- `product_id`
- `variant_id`
- product name snapshot
- SKU snapshot
- size snapshot
- colour snapshot
- image snapshot
- `quantity`
- `unit_price_paise`
- `discount_paise`
- `line_total_paise`

Order items remain unchanged when catalogue records are edited later.

#### `payment_attempts`

- `id`
- `order_id`
- `razorpay_order_id`, unique
- `razorpay_payment_id`, nullable and unique
- `expected_amount_paise`
- `currency`
- `status`
- failure code and description, nullable
- `created_at`, `updated_at`

One local order may have multiple payment attempts.

#### `webhook_events`

- `provider_event_id`, unique
- `event_type`
- `processing_status`
- `attempt_count`
- `error_summary`, nullable
- `received_at`, `processed_at`

This table makes webhook processing idempotent and auditable.

#### `refunds`

- `id`
- `order_id`
- `payment_attempt_id`
- `idempotency_key`, unique
- `razorpay_refund_id`, nullable and unique
- `amount_paise`
- `reason`
- `status`
- `actor_id`
- `created_at`, `updated_at`

#### `order_status_history`

- `id`
- `order_id`
- previous and new fulfilment status
- `actor_id`
- `reason`, nullable
- `created_at`

#### `discount_codes`

- `id`
- normalized `code`, unique
- `type`: `fixed`, `percentage`
- `value`
- `minimum_subtotal_paise`
- `maximum_discount_paise`, nullable
- start and end timestamps
- `is_active`

V1 allows one order-wide discount code and no stacking.

#### `shipments`

- `id`
- `order_id`, unique in V1
- `courier`
- `tracking_reference`
- `tracking_url`
- `shipped_at`, `delivered_at`

#### `order_access_tokens`

- `id`
- `order_id`
- `token_hash`
- `expires_at`
- `revoked_at`, nullable

Guest order pages use scoped, expiring tokens. Order number and email alone never grant access.

#### `notification_outbox`

- `id`
- event type
- order reference
- deduplication key, unique
- delivery status
- retry count
- timestamps

## Cart lifecycle

The storefront uses one cart interface across every page.

1. A guest receives a random opaque cart token in a secure, HTTP-only cookie. Only its hash is stored.
2. Cart mutations validate variant existence, availability and quantity on the server.
3. Adding the same variant increases its quantity instead of creating another row.
4. Guest carts expire after 30 days of inactivity.
5. On login, the guest cart merges into the customer's active cart in one idempotent operation.
6. Identical variants combine and quantities are capped to available stock.
7. On successful payment, purchased quantities are reconciled without deleting unrelated items added while payment was underway.

The current `StoreProvider` implements the page-facing contract with browser persistence. Person 1's Supabase transport should replace that persistence without introducing page-specific cart state.

## Checkout and payment flow

1. The server verifies ownership of the selected cart.
2. PostgreSQL reloads variants and recalculates prices, discounts, shipping and availability.
3. A transaction creates the pending order, immutable order-item snapshots and 15-minute inventory reservations.
4. A server-only Next.js route creates the Razorpay order and stores the payment attempt.
5. The browser opens Razorpay Checkout using the returned public order data.
6. A server route verifies the browser callback signature using the stored Razorpay order ID.
7. The server confirms captured status, amount, currency and association with the local order.
8. A trusted webhook may independently confirm the payment.
9. Callback and webhook paths call the same idempotent database finalization function.
10. One transaction marks the order paid, consumes reservations, decrements stock once and enqueues confirmation email delivery.

Webhook signatures must use the raw request body. Duplicate or out-of-order events cannot decrement stock twice or move a paid order back to failed.

If a captured payment arrives after its reservation expired, allocate stock atomically when possible. Otherwise place the order on hold and initiate a full refund or manual resolution. A reconciliation job resolves interrupted and uncertain payment attempts.

## Pricing and shipping

- The database price is authoritative at checkout.
- `price_paise` is charged to the customer.
- `compare_at_price_paise` is an optional higher display price.
- India-only standard shipping is ₹150 below ₹3,000.
- Shipping is free at ₹3,000 or more after discounts.
- The cart displays price snapshots but checkout reports and requires acceptance of price or availability changes.

## Statuses

### Payment status

- `pending`
- `paid`
- `failed`
- `partially_refunded`
- `refunded`

### Fulfilment status

- `pending_payment`
- `confirmed`
- `on_hold`
- `processing`
- `shipped`
- `delivered`
- `cancelled`
- `returned`

Payment and fulfilment remain separate. Authorized payment alone does not confirm an order. Cancelling a paid order does not itself refund payment. Refunds and returns never delete the original order and do not automatically restock inventory.

## Security

- Public visitors may read active catalogue records and derived purchase availability.
- Customers may access only their own profile, addresses, cart, wishlist and orders.
- Guests access carts by secure cookie and orders by scoped token.
- Customers cannot update account status, roles, stock, order totals or payment state.
- Admin authorization is enforced on every server operation, not only by hidden routes.
- Customer-facing RLS does not permit direct writes to orders, payments, reservations or inventory.
- Supabase service-role and Razorpay secret keys remain server-only.
- Sensitive database functions restrict execution privileges.
- Logs exclude secrets, access tokens and unnecessary customer data.

## Team ownership

### Person 1 — Database, authentication and platform

- Supabase projects, migrations, constraints, indexes and RLS
- Seed data for all six products and 54 variants
- Authentication, profiles, addresses and protected account routes
- Admin role assignment
- Transactional functions for cart merging, reservations, payment finalization and stock adjustment
- Shared database types, Vercel environments and deployment documentation

Person 1 supplies catalogue/cart types and session helpers to Person 2, and payment/order functions plus admin authorization helpers to Person 3.

### Person 2 — Storefront, cart and wishlist

- Homepage and catalogue presentation
- Search, category/size/colour filters and sorting
- Product detail and variant selection
- Quick view and quick add
- Product-level wishlist
- Shared cart provider and cart UI
- Guest/authenticated persistence integration and login merge UI
- Loading, empty, unavailable, price-change and error states

Person 2 consumes Person 1's schema/session/cart APIs and gives Person 3 stable cart contents containing variant IDs and quantities. Checkout remains responsible for authoritative prices.

### Person 3 — Checkout, payments and admin

- Checkout and saved-address selection
- Server-side quote, shipping and discount validation
- Inventory reservation orchestration
- Razorpay creation, callback verification and webhook processing
- Payment retries, cleanup and reconciliation jobs
- Order confirmation, history and guest access
- Admin catalogue, price, image, stock and fulfilment management
- Refunds, return recording and transactional notifications

Person 3 supplies quote and validation-error contracts to Person 2 and deployment/webhook requirements to Person 1.

## Acceptance criteria

- All six products and 54 variants are represented without exceptions.
- Cart state works across pages, reloads, login and devices.
- Unavailable variants cannot be purchased.
- Server totals match displayed and charged totals.
- Concurrent checkouts cannot consume the same final unit.
- Duplicate callbacks and webhooks produce one stock decrement.
- Payments recover when the browser closes or a database update fails.
- Customers and guests cannot access another customer's data.
- Admin actions are authorized and stock changes are audited.
- Orders preserve product, price and address snapshots.
- Refunds preserve the original order and do not automatically restock.
- Test and production credentials are separated.
