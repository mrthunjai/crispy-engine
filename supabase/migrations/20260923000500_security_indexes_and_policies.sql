-- Indexes, RLS, and access helpers. Guest operations remain server-managed through the service role.

create index products_category_active_idx on public.products (category_id, status);
create index products_merchandising_idx on public.products (is_new, is_bestseller) where status = 'active';
create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_active_idx on public.product_variants (product_id) where not is_discontinued;
create index product_images_product_idx on public.product_images (product_id, sort_order);
create index inventory_reservations_active_expiry_idx on public.inventory_reservations (variant_id, expires_at) where status = 'active';
create index inventory_adjustments_variant_idx on public.inventory_adjustments (variant_id, created_at desc);
create index addresses_user_idx on public.addresses (user_id);
create index cart_items_cart_idx on public.cart_items (cart_id);
create index wishlist_items_wishlist_idx on public.wishlist_items (wishlist_id);
create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_fulfilment_status_idx on public.orders (fulfilment_status, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index payment_attempts_order_idx on public.payment_attempts (order_id);
create index refunds_order_idx on public.refunds (order_id);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at desc);
create index order_access_tokens_order_idx on public.order_access_tokens (order_id);
create index notification_outbox_pending_idx on public.notification_outbox (created_at) where delivery_status = 'pending';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.inventory_adjustments enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.webhook_events enable row level security;
alter table public.refunds enable row level security;
alter table public.order_status_history enable row level security;
alter table public.discount_codes enable row level security;
alter table public.shipments enable row level security;
alter table public.order_access_tokens enable row level security;
alter table public.notification_outbox enable row level security;

create policy "Public can read categories" on public.categories for select using (true);
create policy "Public can read active products" on public.products for select using (status = 'active');
create policy "Public can read active variants" on public.product_variants for select using (
  not is_discontinued and exists (
    select 1 from public.products p where p.id = product_id and p.status = 'active'
  )
);
create policy "Public can read active product images" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
);

create policy "Customers can read their profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Customers can update their profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Customers manage their addresses" on public.addresses for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Customers read their carts" on public.carts for select to authenticated using (user_id = auth.uid());
create policy "Customers create their carts" on public.carts for insert to authenticated with check (user_id = auth.uid() and guest_token_hash is null);
create policy "Customers update their carts" on public.carts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Customers delete their carts" on public.carts for delete to authenticated using (user_id = auth.uid());

create policy "Customers manage their cart items" on public.cart_items for all to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "Customers manage their wishlist" on public.wishlists for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Customers manage their wishlist items" on public.wishlist_items for all to authenticated
using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

create policy "Customers read their orders" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "Customers read their order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "Admins read their own role" on public.user_roles for select to authenticated using (user_id = auth.uid());

create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage inventory" on public.inventory for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read inventory reservations" on public.inventory_reservations for select to authenticated using (public.is_admin());
create policy "Admins read inventory adjustments" on public.inventory_adjustments for select to authenticated using (public.is_admin());
create policy "Admins read orders" on public.orders for select to authenticated using (public.is_admin());
create policy "Admins read order items" on public.order_items for select to authenticated using (public.is_admin());
create policy "Admins read payment attempts" on public.payment_attempts for select to authenticated using (public.is_admin());
create policy "Admins read webhooks" on public.webhook_events for select to authenticated using (public.is_admin());
create policy "Admins manage refunds" on public.refunds for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read order status history" on public.order_status_history for select to authenticated using (public.is_admin());
create policy "Admins manage discount codes" on public.discount_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage shipments" on public.shipments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins read notification outbox" on public.notification_outbox for select to authenticated using (public.is_admin());
