export type ProductVariant = {
  id: string
  sku: string
  size: string
  colour: string
  pricePaise: number
  stockQuantity: number
}

export type Product = {
  id: string
  slug: string
  name: string
  category: string
  categorySlug: string
  collection: string
  type: string
  description: string
  pricePaise: number
  image: string
  tag?: string
  colors: string[]
  sizes: string[]
  variants: ProductVariant[]
}

type ProductSeed = Omit<Product, 'id' | 'variants' | 'categorySlug' | 'collection'>

const sizes = ['S', 'M', 'L', 'XL']

const seeds: ProductSeed[] = [
  { slug: 'shirt-design-01', name: 'Shirt Design 01', category: 'Shirt', type: 'Shirt / Black', description: 'A considered everyday shirt designed for a clean, comfortable fit.', pricePaise: 249000, image: 'https://placehold.co/1200x1500?text=Shirt+Design+01', tag: 'New', colors: ['Black', 'White', 'Navy'], sizes },
  { slug: 'shirt-design-02', name: 'Shirt Design 02', category: 'Shirt', type: 'Shirt / Black', description: 'A considered everyday shirt designed for a clean, comfortable fit.', pricePaise: 249000, image: 'https://placehold.co/1200x1500?text=Shirt+Design+02', colors: ['Black', 'White', 'Navy'], sizes },
  { slug: 'shirt-design-03', name: 'Shirt Design 03', category: 'Shirt', type: 'Shirt / Black', description: 'A considered everyday shirt designed for a clean, comfortable fit.', pricePaise: 249000, image: 'https://placehold.co/1200x1500?text=Shirt+Design+03', colors: ['Black', 'White', 'Navy'], sizes },
  { slug: 'shirt-design-04', name: 'Shirt Design 04', category: 'Shirt', type: 'Shirt / Black', description: 'A considered everyday shirt designed for a clean, comfortable fit.', pricePaise: 249000, image: 'https://placehold.co/1200x1500?text=Shirt+Design+04', tag: 'Bestseller', colors: ['Black', 'White', 'Navy'], sizes },
  { slug: 'joggers-design-01', name: 'Joggers Design 01', category: 'Joggers', type: 'Joggers / Black', description: 'Relaxed joggers made for movement and everyday wear.', pricePaise: 349000, image: 'https://placehold.co/1200x1500?text=Joggers+Design+01', tag: 'New', colors: ['Black', 'Grey', 'Olive'], sizes },
  { slug: 'joggers-design-02', name: 'Joggers Design 02', category: 'Joggers', type: 'Joggers / Black', description: 'Relaxed joggers made for movement and everyday wear.', pricePaise: 349000, image: 'https://placehold.co/1200x1500?text=Joggers+Design+02', colors: ['Black', 'Grey', 'Olive'], sizes },
  { slug: 'joggers-design-03', name: 'Joggers Design 03', category: 'Joggers', type: 'Joggers / Black', description: 'Relaxed joggers made for movement and everyday wear.', pricePaise: 349000, image: 'https://placehold.co/1200x1500?text=Joggers+Design+03', colors: ['Black', 'Grey', 'Olive'], sizes },
  { slug: 'joggers-design-04', name: 'Joggers Design 04', category: 'Joggers', type: 'Joggers / Black', description: 'Relaxed joggers made for movement and everyday wear.', pricePaise: 349000, image: 'https://placehold.co/1200x1500?text=Joggers+Design+04', tag: 'Bestseller', colors: ['Black', 'Grey', 'Olive'], sizes },
  { slug: 'tracks-design-01', name: 'Tracks Design 01', category: 'Tracks', type: 'Tracks / Black', description: 'A versatile track layer with a streamlined everyday silhouette.', pricePaise: 399000, image: 'https://placehold.co/1200x1500?text=Tracks+Design+01', tag: 'New', colors: ['Black', 'Navy', 'Maroon'], sizes },
  { slug: 'tracks-design-02', name: 'Tracks Design 02', category: 'Tracks', type: 'Tracks / Black', description: 'A versatile track layer with a streamlined everyday silhouette.', pricePaise: 399000, image: 'https://placehold.co/1200x1500?text=Tracks+Design+02', tag: 'Bestseller', colors: ['Black', 'Navy', 'Maroon'], sizes },
  { slug: 'shorts-design-01', name: 'Shorts Design 01', category: 'Shorts', type: 'Shorts / Black', description: 'Lightweight shorts designed for comfortable everyday movement.', pricePaise: 199000, image: 'https://placehold.co/1200x1500?text=Shorts+Design+01', colors: ['Black', 'Grey', 'Navy'], sizes },
  { slug: 'compression-shorts-design-01', name: 'Compression Shorts Design 01', category: 'Compression Shorts', type: 'Compression Shorts / Black', description: 'Supportive compression shorts for training and active days.', pricePaise: 169000, image: 'https://placehold.co/1200x1500?text=Compression+Shorts+Design+01', colors: ['Black', 'Grey'], sizes }
]

const skuPart = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '-')

export const products: Product[] = seeds.map((product) => ({
  ...product,
  id: product.slug,
  categorySlug: product.category.toLowerCase().replace(/\s+/g, '-'),
  collection: product.category,
  variants: product.colors.flatMap((colour) => product.sizes.map((size) => ({
    id: `${product.slug}-${colour.toLowerCase()}-${size.toLowerCase()}`,
    sku: `KES-${skuPart(product.slug)}-${skuPart(colour)}-${skuPart(size)}`,
    colour,
    size,
    pricePaise: product.pricePaise,
    stockQuantity: product.slug === 'compression-shorts-design-01' && colour === 'Black' && size === 'S' ? 4 : 24
  })))
}))

export const money = (paise: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(paise / 100)

export const moneyRupees = (rupees: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(rupees)

export const findProduct = (slug: string) => products.find((product) => product.slug === slug)

export const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`
