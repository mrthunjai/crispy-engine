-- Carts support one authenticated owner or one server-managed guest token, never both.

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_token_hash text,
  status text not null default 'active' check (status in ('active', 'merged', 'checked_out', 'abandoned')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((user_id is null) <> (guest_token_hash is null))
);

create unique index carts_one_active_customer_cart
on public.carts (user_id)
where status = 'active' and user_id is not null;

create unique index carts_one_active_guest_cart
on public.carts (guest_token_hash)
where status = 'active' and guest_token_hash is not null;

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_name_snapshot text not null,
  image_url_snapshot text,
  colour_snapshot text not null,
  size_snapshot text not null,
  price_paise_snapshot integer not null check (price_paise_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create or replace function public.ensure_cart_item_matches_variant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.product_variants
    where id = new.variant_id and product_id = new.product_id
  ) then
    raise exception 'Cart item product must match its variant';
  end if;
  return new;
end;
$$;

create trigger cart_items_match_variant
before insert or update of product_id, variant_id on public.cart_items
for each row execute function public.ensure_cart_item_matches_variant();

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger wishlists_set_updated_at
before update on public.wishlists
for each row execute function public.set_updated_at();
