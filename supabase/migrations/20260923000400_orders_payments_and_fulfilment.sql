-- Orders retain immutable purchase snapshots. Payment and fulfilment state are intentionally separate.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  contact_email text not null check (length(trim(contact_email)) > 0),
  shipping_address_snapshot jsonb not null,
  currency char(3) not null default 'INR' check (currency = 'INR'),
  subtotal_paise integer not null check (subtotal_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  shipping_paise integer not null default 0 check (shipping_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  discount_snapshot jsonb,
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'failed', 'partially_refunded', 'refunded')
  ),
  fulfilment_status text not null default 'pending_payment' check (
    fulfilment_status in ('pending_payment', 'confirmed', 'on_hold', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')
  ),
  checkout_idempotency_key uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_paise <= subtotal_paise),
  check (total_paise = subtotal_paise - discount_paise + shipping_paise)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  colour_snapshot text not null,
  size_snapshot text not null,
  image_url_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price_paise integer not null check (unit_price_paise >= 0),
  allocated_discount_paise integer not null default 0 check (allocated_discount_paise >= 0),
  line_total_paise integer not null check (line_total_paise >= 0),
  created_at timestamptz not null default now(),
  check (allocated_discount_paise <= unit_price_paise * quantity),
  check (line_total_paise = unit_price_paise * quantity - allocated_discount_paise)
);

alter table public.inventory_reservations
  add constraint inventory_reservations_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete restrict;

alter table public.inventory_adjustments
  add constraint inventory_adjustments_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete set null;

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  expected_amount_paise integer not null check (expected_amount_paise >= 0),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  provider_status text not null default 'created' check (
    provider_status in ('created', 'authorized', 'captured', 'failed', 'refunded')
  ),
  failure_code text,
  failure_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'failed', 'ignored')),
  attempts integer not null default 0 check (attempts >= 0),
  error_summary text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  payment_attempt_id uuid not null references public.payment_attempts(id) on delete restrict,
  idempotency_key uuid not null unique,
  razorpay_refund_id text unique,
  amount_paise integer not null check (amount_paise > 0),
  reason text not null check (length(trim(reason)) > 0),
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  admin_actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  previous_status text,
  new_status text not null check (
    new_status in ('pending_payment', 'confirmed', 'on_hold', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')
  ),
  actor_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(trim(code))),
  discount_type text not null check (discount_type in ('fixed', 'percentage')),
  amount_paise integer check (amount_paise > 0),
  percentage_basis_points integer check (percentage_basis_points > 0 and percentage_basis_points <= 10000),
  minimum_subtotal_paise integer not null default 0 check (minimum_subtotal_paise >= 0),
  maximum_discount_paise integer check (maximum_discount_paise > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (discount_type = 'fixed' and amount_paise is not null and percentage_basis_points is null)
    or
    (discount_type = 'percentage' and amount_paise is null and percentage_basis_points is not null)
  ),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  courier_name text not null check (length(trim(courier_name)) > 0),
  tracking_reference text not null check (length(trim(tracking_reference)) > 0),
  tracking_url text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivered_at is null or shipped_at is null or delivered_at >= shipped_at)
);

create table public.order_access_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  order_id uuid references public.orders(id) on delete cascade,
  deduplication_key text not null unique,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger payment_attempts_set_updated_at
before update on public.payment_attempts
for each row execute function public.set_updated_at();

create trigger refunds_set_updated_at
before update on public.refunds
for each row execute function public.set_updated_at();

create trigger discount_codes_set_updated_at
before update on public.discount_codes
for each row execute function public.set_updated_at();

create trigger shipments_set_updated_at
before update on public.shipments
for each row execute function public.set_updated_at();
