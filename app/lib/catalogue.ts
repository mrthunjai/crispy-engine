import { products as fallbackProducts, type Product } from './data'

type DbCategory = { slug: string; name: string }
type DbInventory = { stock_quantity: number; low_stock_threshold: number }
type DbVariant = {
  id: string
  sku: string
  colour: string
  size: string
  price_paise: number
  inventory: DbInventory | DbInventory[] | null
}
type DbImage = { image_url: string; sort_order: number }
type DbProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  is_new: boolean
  is_bestseller: boolean
  categories: DbCategory | DbCategory[]
  product_variants: DbVariant[]
  product_images: DbImage[]
}

const relation = <T,>(value: T | T[]): T => Array.isArray(value) ? value[0] : value
const collectionFor = (slug: string): 'Tops' | 'Bottoms' => slug === 'shirt' ? 'Tops' : 'Bottoms'

const mapProduct = (row: DbProduct): Product => {
  const category = relation(row.categories)
  const variants = row.product_variants.map((variant) => {
    const inventory = variant.inventory ? relation(variant.inventory) : null
    return {
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      colour: variant.colour,
      pricePaise: variant.price_paise,
      stockQuantity: inventory?.stock_quantity ?? 0
    }
  })
  const lowStock = row.product_variants.some((variant) => {
    const inventory = variant.inventory ? relation(variant.inventory) : null
    return inventory && inventory.stock_quantity > 0 && inventory.stock_quantity <= inventory.low_stock_threshold
  })
  const firstVariant = variants[0]
  const image = [...row.product_images].sort((a,b)=>a.sort_order-b.sort_order)[0]?.image_url
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: category.name,
    categorySlug: category.slug,
    collection: collectionFor(category.slug),
    type: `${category.name}${firstVariant ? ` / ${firstVariant.colour}` : ''}`,
    description: row.description || 'A considered everyday piece, designed to move with you.',
    pricePaise: variants.length ? Math.min(...variants.map((variant)=>variant.pricePaise)) : 0,
    image: image || 'https://placehold.co/1200x1500?text=Product',
    tag: row.is_new ? 'New' : row.is_bestseller ? 'Bestseller' : lowStock ? 'Low stock' : undefined,
    colors: Array.from(new Set(variants.map((variant)=>variant.colour))),
    sizes: Array.from(new Set(variants.map((variant)=>variant.size))),
    variants
  }
}

export const isSupabaseConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))

export async function getCatalogue(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return fallbackProducts
  try {
    const select = 'id,slug,name,description,is_new,is_bestseller,categories(slug,name),product_variants(id,sku,colour,size,price_paise,inventory(stock_quantity,low_stock_threshold)),product_images(image_url,sort_order)'
    const response = await fetch(`${url}/rest/v1/products?select=${encodeURIComponent(select)}&status=eq.active`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store'
    })
    if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`)
    const rows = await response.json() as DbProduct[]
    return rows.length ? rows.map(mapProduct) : fallbackProducts
  } catch (error) {
    console.error('Using fallback catalogue because Supabase could not be loaded.', error)
    return fallbackProducts
  }
}

export async function getProductBySlug(slug: string) {
  return (await getCatalogue()).find((product)=>product.slug===slug)
}
