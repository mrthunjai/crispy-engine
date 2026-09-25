-- KESHEV catalogue, variants, and inventory foundation.
-- Prices are stored in paise. Product designs are products; colour/size pairs are variants.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  design_code text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  description text,
  care_instructions text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, design_code)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  sku text not null unique,
  colour text not null,
  size text not null check (size in ('S', 'M', 'L', 'XL')),
  price_paise integer not null check (price_paise >= 0),
  compare_at_price_paise integer check (
    compare_at_price_paise is null or compare_at_price_paise > price_paise
  ),
  is_discontinued boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, colour, size)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  image_url text not null check (length(trim(image_url)) > 0),
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

create or replace function public.ensure_image_variant_belongs_to_product()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.variant_id is not null and not exists (
    select 1
    from public.product_variants
    where id = new.variant_id and product_id = new.product_id
  ) then
    raise exception 'A product image variant must belong to the same product';
  end if;
  return new;
end;
$$;

create trigger product_images_match_product
before insert or update of product_id, variant_id on public.product_images
for each row execute function public.ensure_image_variant_belongs_to_product();

create table public.inventory (
  variant_id uuid primary key references public.product_variants(id) on delete restrict,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.create_inventory_for_variant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.inventory (variant_id) values (new.id);
  return new;
end;
$$;

create trigger variants_receive_inventory
after insert on public.product_variants
for each row execute function public.create_inventory_for_variant();

-- order_id becomes a foreign key after the orders table is introduced.
create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  status text not null default 'active' check (status in ('active', 'consumed', 'released', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, variant_id)
);

create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity_change integer not null check (quantity_change <> 0),
  reason text not null check (length(trim(reason)) > 0),
  actor_id uuid references auth.users(id) on delete set null,
  order_id uuid,
  created_at timestamptz not null default now()
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

create trigger inventory_reservations_set_updated_at
before update on public.inventory_reservations
for each row execute function public.set_updated_at();
