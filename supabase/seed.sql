-- Repeatable local development catalogue. Temporary colours, prices, images, and stock are marked by design.

insert into public.categories (slug, name, sort_order)
values
  ('shirt', 'Shirt', 1),
  ('joggers', 'Joggers', 2),
  ('tracks', 'Tracks', 3),
  ('shorts', 'Shorts', 4),
  ('compression-shorts', 'Compression Shorts', 5)
on conflict (slug) do update
set name = excluded.name, sort_order = excluded.sort_order;

with product_seed (category_slug, design_code, slug, name, price_paise, is_new, is_bestseller) as (
  values
    ('shirt', 'D01', 'shirt-design-01', 'Shirt Design 01', 249000, true, false),
    ('shirt', 'D02', 'shirt-design-02', 'Shirt Design 02', 249000, false, false),
    ('shirt', 'D03', 'shirt-design-03', 'Shirt Design 03', 249000, false, false),
    ('shirt', 'D04', 'shirt-design-04', 'Shirt Design 04', 249000, false, true),
    ('joggers', 'D01', 'joggers-design-01', 'Joggers Design 01', 349000, true, false),
    ('joggers', 'D02', 'joggers-design-02', 'Joggers Design 02', 349000, false, false),
    ('joggers', 'D03', 'joggers-design-03', 'Joggers Design 03', 349000, false, false),
    ('joggers', 'D04', 'joggers-design-04', 'Joggers Design 04', 349000, false, true),
    ('tracks', 'D01', 'tracks-design-01', 'Tracks Design 01', 399000, true, false),
    ('tracks', 'D02', 'tracks-design-02', 'Tracks Design 02', 399000, false, true),
    ('shorts', 'D01', 'shorts-design-01', 'Shorts Design 01', 199000, false, false),
    ('compression-shorts', 'D01', 'compression-shorts-design-01', 'Compression Shorts Design 01', 169000, false, false)
)
insert into public.products (category_id, design_code, slug, name, status, is_new, is_bestseller)
select c.id, s.design_code, s.slug, s.name, 'active', s.is_new, s.is_bestseller
from product_seed s join public.categories c on c.slug = s.category_slug
on conflict (slug) do update
set name = excluded.name,
    status = excluded.status,
    is_new = excluded.is_new,
    is_bestseller = excluded.is_bestseller,
    updated_at = now();

insert into public.product_images (product_id, image_url, alt_text, sort_order)
select id,
       'https://placehold.co/1200x1500?text=' || replace(name, ' ', '+'),
       name || ' placeholder image',
       0
from public.products
on conflict (product_id, sort_order) do update
set image_url = excluded.image_url, alt_text = excluded.alt_text;

with colours (category_slug, colour, colour_code) as (
  values
    ('shirt', 'Black', 'BLK'), ('shirt', 'White', 'WHT'), ('shirt', 'Navy', 'NVY'),
    ('joggers', 'Black', 'BLK'), ('joggers', 'Grey', 'GRY'), ('joggers', 'Olive', 'OLV'),
    ('tracks', 'Black', 'BLK'), ('tracks', 'Navy', 'NVY'), ('tracks', 'Maroon', 'MRN'),
    ('shorts', 'Black', 'BLK'), ('shorts', 'Grey', 'GRY'), ('shorts', 'Navy', 'NVY'),
    ('compression-shorts', 'Black', 'BLK'), ('compression-shorts', 'Grey', 'GRY')
), sizes (size) as (
  values ('S'), ('M'), ('L'), ('XL')
), product_prices (slug, price_paise) as (
  values
    ('shirt-design-01', 249000), ('shirt-design-02', 249000), ('shirt-design-03', 249000), ('shirt-design-04', 249000),
    ('joggers-design-01', 349000), ('joggers-design-02', 349000), ('joggers-design-03', 349000), ('joggers-design-04', 349000),
    ('tracks-design-01', 399000), ('tracks-design-02', 399000),
    ('shorts-design-01', 199000), ('compression-shorts-design-01', 169000)
)
insert into public.product_variants (product_id, sku, colour, size, price_paise)
select p.id,
       'KES-' || upper(replace(c.category_slug, '-', '')) || '-' || p.design_code || '-' || c.colour_code || '-' || s.size,
       c.colour,
       s.size,
       pp.price_paise
from public.products p
join public.categories category on category.id = p.category_id
join colours c on c.category_slug = category.slug
join sizes s on true
join product_prices pp on pp.slug = p.slug
on conflict (product_id, colour, size) do update
set sku = excluded.sku,
    price_paise = excluded.price_paise,
    updated_at = now();

update public.inventory i
set stock_quantity = case
      when p.slug = 'compression-shorts-design-01' and v.colour = 'Black' and v.size = 'S' then 4
      else 24
    end,
    low_stock_threshold = 5,
    updated_at = now()
from public.product_variants v
join public.products p on p.id = v.product_id
where i.variant_id = v.id;
