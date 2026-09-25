-- Privileged operations are callable only by service_role, except audited admin stock adjustments.

create or replace function public.assert_service_or_admin()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'This operation requires a service or admin role';
  end if;
end;
$$;

create or replace function public.merge_guest_cart(p_guest_cart_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_cart_id uuid;
  v_guest_item record;
begin
  perform public.assert_service_or_admin();

  perform 1 from public.carts
  where id = p_guest_cart_id and user_id is null and status = 'active'
  for update;
  if not found then
    raise exception 'Active guest cart not found';
  end if;

  select id into v_customer_cart_id from public.carts
  where user_id = p_user_id and status = 'active'
  for update;

  if v_customer_cart_id is null then
    insert into public.carts (user_id, status) values (p_user_id, 'active')
    returning id into v_customer_cart_id;
  end if;

  for v_guest_item in
    select * from public.cart_items where cart_id = p_guest_cart_id
  loop
    insert into public.cart_items (
      cart_id, product_id, variant_id, product_name_snapshot, image_url_snapshot,
      colour_snapshot, size_snapshot, price_paise_snapshot, quantity
    ) values (
      v_customer_cart_id, v_guest_item.product_id, v_guest_item.variant_id,
      v_guest_item.product_name_snapshot, v_guest_item.image_url_snapshot,
      v_guest_item.colour_snapshot, v_guest_item.size_snapshot,
      v_guest_item.price_paise_snapshot, v_guest_item.quantity
    )
    on conflict (cart_id, variant_id) do update
    set quantity = public.cart_items.quantity + excluded.quantity,
        updated_at = now();
  end loop;

  update public.carts set status = 'merged' where id = p_guest_cart_id;
  return v_customer_cart_id;
end;
$$;

create or replace function public.release_expired_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform public.assert_service_or_admin();
  update public.inventory_reservations
  set status = 'expired', updated_at = now()
  where status = 'active' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.reserve_inventory(
  p_order_id uuid,
  p_items jsonb,
  p_expires_at timestamptz default now() + interval '15 minutes'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_available integer;
begin
  perform public.assert_service_or_admin();
  if p_expires_at <= now() then
    raise exception 'Reservation expiry must be in the future';
  end if;

  perform public.release_expired_inventory_reservations();
  update public.inventory_reservations
  set status = 'released', updated_at = now()
  where order_id = p_order_id and status = 'active';

  for v_item in
    select (value ->> 'variant_id')::uuid as variant_id,
           (value ->> 'quantity')::integer as quantity
    from jsonb_array_elements(p_items)
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Reservation quantities must be positive';
    end if;

    perform 1 from public.product_variants
    where id = v_item.variant_id and not is_discontinued
    for key share;
    if not found then
      raise exception 'Variant % is unavailable', v_item.variant_id;
    end if;

    perform 1 from public.inventory where variant_id = v_item.variant_id for update;
    select i.stock_quantity - coalesce(sum(r.quantity) filter (
      where r.status = 'active' and r.expires_at > now() and r.order_id <> p_order_id
    ), 0)
    into v_available
    from public.inventory i
    left join public.inventory_reservations r on r.variant_id = i.variant_id
    where i.variant_id = v_item.variant_id
    group by i.stock_quantity;

    if coalesce(v_available, 0) < v_item.quantity then
      raise exception 'Insufficient stock for variant %', v_item.variant_id;
    end if;

    insert into public.inventory_reservations (order_id, variant_id, quantity, expires_at)
    values (p_order_id, v_item.variant_id, v_item.quantity, p_expires_at)
    on conflict (order_id, variant_id) do update
    set quantity = excluded.quantity, status = 'active', expires_at = excluded.expires_at, updated_at = now();
  end loop;
end;
$$;

create or replace function public.adjust_inventory(
  p_variant_id uuid,
  p_quantity_change integer,
  p_reason text,
  p_order_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
begin
  perform public.assert_service_or_admin();
  if p_quantity_change = 0 or length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'An adjustment requires a non-zero quantity and reason';
  end if;

  select stock_quantity into v_stock from public.inventory where variant_id = p_variant_id for update;
  if not found then
    raise exception 'Inventory record not found for variant %', p_variant_id;
  end if;
  if v_stock + p_quantity_change < 0 then
    raise exception 'Inventory cannot become negative';
  end if;

  update public.inventory
  set stock_quantity = stock_quantity + p_quantity_change, updated_at = now()
  where variant_id = p_variant_id
  returning stock_quantity into v_stock;

  insert into public.inventory_adjustments (variant_id, quantity_change, reason, actor_id, order_id)
  values (p_variant_id, p_quantity_change, p_reason, auth.uid(), p_order_id);
  return v_stock;
end;
$$;

create or replace function public.finalize_captured_payment(
  p_payment_attempt_id uuid,
  p_razorpay_payment_id text,
  p_captured_amount_paise integer,
  p_currency char(3) default 'INR'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payment_attempts%rowtype;
  v_order public.orders%rowtype;
  v_reservation record;
  v_stock integer;
begin
  perform public.assert_service_or_admin();
  select * into v_payment from public.payment_attempts where id = p_payment_attempt_id for update;
  if not found then
    raise exception 'Payment attempt not found';
  end if;
  select * into v_order from public.orders where id = v_payment.order_id for update;

  if v_order.payment_status = 'paid' then
    if v_payment.razorpay_payment_id is not null and v_payment.razorpay_payment_id <> p_razorpay_payment_id then
      raise exception 'A different payment has already finalized this order';
    end if;
    return true;
  end if;
  if v_payment.expected_amount_paise <> p_captured_amount_paise or v_payment.currency <> p_currency then
    raise exception 'Captured amount or currency does not match the pending payment';
  end if;

  update public.payment_attempts
  set razorpay_payment_id = p_razorpay_payment_id, provider_status = 'captured', updated_at = now()
  where id = v_payment.id;

  for v_reservation in
    select * from public.inventory_reservations
    where order_id = v_order.id and status = 'active' and expires_at > now()
    order by variant_id
    for update
  loop
    select stock_quantity into v_stock from public.inventory where variant_id = v_reservation.variant_id for update;
    if v_stock < v_reservation.quantity then
      update public.orders
      set payment_status = 'paid', fulfilment_status = 'on_hold', updated_at = now()
      where id = v_order.id;
      return false;
    end if;
  end loop;

  if not exists (
    select 1 from public.inventory_reservations
    where order_id = v_order.id and status = 'active' and expires_at > now()
  ) then
    update public.orders
    set payment_status = 'paid', fulfilment_status = 'on_hold', updated_at = now()
    where id = v_order.id;
    return false;
  end if;

  for v_reservation in
    select * from public.inventory_reservations
    where order_id = v_order.id and status = 'active' and expires_at > now()
    order by variant_id
    for update
  loop
    update public.inventory
    set stock_quantity = stock_quantity - v_reservation.quantity, updated_at = now()
    where variant_id = v_reservation.variant_id;
    insert into public.inventory_adjustments (variant_id, quantity_change, reason, order_id)
    values (v_reservation.variant_id, -v_reservation.quantity, 'sale', v_order.id);
  end loop;

  update public.inventory_reservations
  set status = 'consumed', updated_at = now()
  where order_id = v_order.id and status = 'active' and expires_at > now();
  update public.orders
  set payment_status = 'paid', fulfilment_status = 'confirmed', updated_at = now()
  where id = v_order.id;
  insert into public.order_status_history (order_id, previous_status, new_status, reason)
  values (v_order.id, v_order.fulfilment_status, 'confirmed', 'verified Razorpay capture');
  insert into public.notification_outbox (event_type, order_id, deduplication_key)
  values ('order_confirmation', v_order.id, 'order-confirmation:' || v_order.id::text)
  on conflict (deduplication_key) do nothing;
  return true;
end;
$$;

revoke all on function public.merge_guest_cart(uuid, uuid) from public;
revoke all on function public.release_expired_inventory_reservations() from public;
revoke all on function public.reserve_inventory(uuid, jsonb, timestamptz) from public;
revoke all on function public.adjust_inventory(uuid, integer, text, uuid) from public;
revoke all on function public.finalize_captured_payment(uuid, text, integer, char) from public;
grant execute on function public.merge_guest_cart(uuid, uuid) to service_role;
grant execute on function public.release_expired_inventory_reservations() to service_role;
grant execute on function public.reserve_inventory(uuid, jsonb, timestamptz) to service_role;
grant execute on function public.adjust_inventory(uuid, integer, text, uuid) to authenticated, service_role;
grant execute on function public.finalize_captured_payment(uuid, text, integer, char) to service_role;
